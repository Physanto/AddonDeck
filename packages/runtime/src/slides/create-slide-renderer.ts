// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Deck, Slide } from "@addondeck/core";
import type { BlockInstance } from "@addondeck/sdk";
import { arrangeSlide } from "./arrange-slide";
import { type MountNodeOptions, mountNode } from "./mount-node";

/** Draws the slides of a deck on the stage. */
export interface SlideRenderer {
	/**
	 * Shows slide `index`, keeping its neighbors mounted and hidden so moving
	 * to them is immediate, and destroys every other slide.
	 */
	show(index: number): void;
	/** Indexes of the mounted slides, in order. */
	mounted(): readonly number[];
	/** Destroys every mounted slide. */
	destroy(): void;
}

/** What {@link createSlideRenderer} needs. */
export interface SlideRendererOptions extends MountNodeOptions {
	readonly deck: Deck;
	/** The element slides are drawn in: the stage canvas. */
	readonly stage: HTMLElement;
	/** Accessible name of a slide, such as "Slide 2 of 5". */
	readonly label: (slide: Slide) => string;
}

interface MountedSlide {
	readonly element: HTMLElement;
	readonly instances: readonly BlockInstance[];
}

/** Slides kept mounted on each side of the current one. */
const NEIGHBORS = 1;

/**
 * Creates the renderer of a deck. Nothing is drawn until {@link SlideRenderer.show}.
 *
 * @example
 * ```ts
 * const renderer = createSlideRenderer({ deck, stage: stage.element, label, ...services });
 * renderer.show(3);
 * renderer.mounted(); // [2, 3, 4]
 * ```
 */
export function createSlideRenderer(
	options: SlideRendererOptions,
): SlideRenderer {
	const { deck, stage, label } = options;
	const document = stage.ownerDocument;
	const mounted = new Map<number, MountedSlide>();

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
		const instances: BlockInstance[] = [];
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
			const instance = mountNode(node, el, options);
			if (instance !== null) instances.push(instance);
		};
		if (arrangement.header !== null) {
			const header = region("adk-slide-header");
			element.append(header);
			place(arrangement.header, header);
		}
		const body = region("adk-slide-body");
		element.append(body);
		for (const index of arrangement.body) place(index, body);
		return { element, instances };
	};

	const unmount = (slide: MountedSlide): void => {
		for (const instance of slide.instances) {
			try {
				instance.destroy();
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

	return {
		show(index) {
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
				const { element } = slide;
				element.dataset.state =
					i < index ? "past" : i > index ? "future" : "current";
				element.inert = i !== index;
				if (i === index) element.removeAttribute("aria-hidden");
				else element.setAttribute("aria-hidden", "true");
			}
		},
		mounted: () => [...mounted.keys()].sort((a, b) => a - b),
		destroy() {
			for (const slide of mounted.values()) unmount(slide);
			mounted.clear();
		},
	};
}
