// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Deck, Slide, StepClick } from "@addondeck/core";
import { describeError } from "../issues/describe-error";
import type { RuntimeIssue } from "../issues/runtime-issue";
import {
	createStepTimeline,
	type StepTimeline,
} from "../steps/create-step-timeline";
import { arrangeSlide } from "./arrange-slide";
import { mountErrorCard } from "./mount-error-card";
import {
	type MountedBlock,
	type MountNodeOptions,
	mountNode,
} from "./mount-node";

/** Draws the slides of a deck on the stage and plays their clicks. */
export interface SlideRenderer {
	/**
	 * Shows slide `index` after `step` clicks, at once, keeping its neighbors
	 * mounted and hidden so moving to them is immediate, and destroys every
	 * other slide. The previous slide is left at its end and the next one at
	 * its start, as moving to them finds them.
	 */
	show(index: number, step?: number): void;
	/** Moves the current slide to `step` clicks; the next click animates. */
	goToStep(step: number): void;
	/** The timeline of a mounted slide. */
	timeline(index: number): StepTimeline | undefined;
	/** Indexes of the mounted slides, in order. */
	mounted(): readonly number[];
	/** Destroys every mounted slide. */
	destroy(): void;
}

/** What {@link createSlideRenderer} needs. */
export interface SlideRendererOptions extends MountNodeOptions {
	readonly deck: Deck;
	/** The step plan of each slide, by slide index. */
	readonly plans: readonly (readonly StepClick[])[];
	/** The element slides are drawn in: the stage canvas. */
	readonly stage: HTMLElement;
	/** Accessible name of a slide, such as "Slide 2 of 5". */
	readonly label: (slide: Slide) => string;
	/** Problems shown in a card on each slide, by slide index. */
	readonly problems?: ReadonlyMap<number, readonly RuntimeIssue[]>;
}

interface MountedSlide {
	readonly element: HTMLElement;
	readonly blocks: ReadonlyMap<number, MountedBlock>;
	readonly timeline: StepTimeline;
}

/** Slides kept mounted on each side of the current one. */
const NEIGHBORS = 1;

/**
 * Creates the renderer of a deck. Nothing is drawn until {@link SlideRenderer.show}.
 *
 * Moving to a neighbor uses the transition of the later of the two slides,
 * so going back plays the same transition in reverse. Any other jump cuts.
 *
 * @example
 * ```ts
 * const renderer = createSlideRenderer({ deck, plans, stage: stage.element, label, ...services });
 * renderer.show(3);
 * renderer.mounted(); // [2, 3, 4]
 * renderer.goToStep(1); // animates the first click of slide 3
 * ```
 */
export function createSlideRenderer(
	options: SlideRendererOptions,
): SlideRenderer {
	const { deck, plans, stage, label, translate, report } = options;
	const document = stage.ownerDocument;
	const mounted = new Map<number, MountedSlide>();
	let current: number | null = null;

	const region = (className: string): HTMLElement => {
		const element = document.createElement("div");
		element.className = className;
		return element;
	};

	const mountSlide = (slide: Slide): MountedSlide => {
		const arrangement = arrangeSlide(slide.content, slide.options.layout);
		const element = document.createElement("section");
		element.className = "adk-slide";
		element.dataset.index = String(slide.index);
		element.dataset.flow = arrangement.flow;
		element.setAttribute("aria-label", label(slide));
		const blocks = new Map<number, MountedBlock>();
		const place = (index: number, parent: HTMLElement): void => {
			const node = slide.content[index];
			if (node === undefined) return;
			const el = region("adk-block");
			if (node.kind === "block") {
				el.dataset.type = node.type;
				if (node.id !== null) el.dataset.id = node.id;
			} else {
				el.dataset.type = "text";
			}
			parent.append(el);
			const block = mountNode(node, el, options);
			if (block !== null) blocks.set(index, block);
		};
		if (arrangement.header !== null) {
			const header = region("adk-slide-header");
			element.append(header);
			place(arrangement.header, header);
		}
		const body = region("adk-slide-body");
		element.append(body);
		for (const index of arrangement.body) place(index, body);

		const problems = options.problems?.get(slide.index) ?? [];
		if (problems.length > 0) {
			const title = translate("problemsTitle", { count: problems.length });
			mountErrorCard(element, problems, title);
		}

		const timeline = createStepTimeline({
			clicks: plans[slide.index] ?? [],
			blocks,
			fail(node, step, thrown) {
				const content = slide.content[node];
				report({
					severity: "error",
					message: translate("stepFailed", {
						line: content?.location.line ?? slide.location.line,
						type: content?.kind === "block" ? content.type : "text",
						step,
						reason: describeError(thrown),
					}),
				});
			},
		});
		return { element, blocks, timeline };
	};

	const unmount = (slide: MountedSlide): void => {
		slide.timeline.settle();
		for (const block of slide.blocks.values()) {
			try {
				block.destroy();
			} catch (thrown) {
				// A block that fails to clean up must not stop the presentation.
				console.error(thrown);
			}
		}
		slide.element.remove();
	};

	const insertInOrder = (index: number, element: HTMLElement): void => {
		const after = [...mounted.keys()]
			.filter((other) => other > index)
			.sort((a, b) => a - b)[0];
		const before = after === undefined ? null : mounted.get(after)?.element;
		stage.insertBefore(element, before ?? null);
	};

	const transitionTo = (index: number): string => {
		if (current === null || Math.abs(index - current) !== NEIGHBORS) {
			return "none";
		}
		return deck.slides[Math.max(index, current)]?.options.transition ?? "none";
	};

	return {
		show(index, step = 0) {
			stage.dataset.transition = transitionTo(index);
			current = index;
			const wanted = new Map<number, Slide>();
			for (let i = index - NEIGHBORS; i <= index + NEIGHBORS; i++) {
				const slide = deck.slides[i];
				if (slide !== undefined) wanted.set(i, slide);
			}
			for (const [i, slide] of mounted) {
				if (!wanted.has(i)) {
					unmount(slide);
					mounted.delete(i);
				}
			}
			for (const [i, source] of wanted) {
				let slide = mounted.get(i);
				if (slide === undefined) {
					slide = mountSlide(source);
					insertInOrder(i, slide.element);
					mounted.set(i, slide);
				}
				const { element, timeline } = slide;
				const clicks = plans[i]?.length ?? 0;
				timeline.jumpTo(i < index ? clicks : i > index ? 0 : step);
				element.dataset.state =
					i < index ? "past" : i > index ? "future" : "current";
				element.inert = i !== index;
				if (i === index) element.removeAttribute("aria-hidden");
				else element.setAttribute("aria-hidden", "true");
			}
		},
		goToStep(step) {
			if (current !== null) mounted.get(current)?.timeline.goTo(step);
		},
		timeline: (index) => mounted.get(index)?.timeline,
		mounted: () => [...mounted.keys()].sort((a, b) => a - b),
		destroy() {
			for (const slide of mounted.values()) unmount(slide);
			mounted.clear();
			current = null;
		},
	};
}
