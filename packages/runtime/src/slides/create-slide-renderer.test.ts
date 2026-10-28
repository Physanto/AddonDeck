// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { compileStepPlan, parse } from "@addondeck/core";
import type { BlockContext, BlockPlugin, Plugin } from "@addondeck/sdk";
import { createTestContext } from "@addondeck/sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import {
	type BoxLog,
	type BoxModel,
	createBoxPlugin,
} from "../../test/support/box-plugin";
import type { RuntimeIssue } from "../issues/runtime-issue";
import { createTranslator } from "../messages/create-translator";
import { createPluginRegistry } from "../registry/create-plugin-registry";
import {
	createSlideRenderer,
	type SlideRenderer,
	type SlideRendererOptions,
} from "./create-slide-renderer";

let renderer: SlideRenderer | null = null;

afterEach(() => {
	renderer?.destroy();
	renderer = null;
	document.body.replaceChildren();
});

function setup(
	source: string,
	plugins: readonly Plugin[] = [],
	extra: Partial<Pick<SlideRendererOptions, "problems" | "context">> = {},
) {
	const registry = createPluginRegistry();
	for (const plugin of plugins) registry.register(plugin);
	const { deck } = parse(source, { registry: registry.blocks() });
	const stage = document.createElement("div");
	document.body.append(stage);
	const issues: RuntimeIssue[] = [];
	renderer = createSlideRenderer({
		deck,
		plans: deck.slides.map(
			(slide) => compileStepPlan(slide, registry.blocks()).clicks,
		),
		stage,
		label: (slide) => `Slide ${slide.index + 1}`,
		registry,
		context: createTestContext(),
		translate: createTranslator(),
		report: (issue) => issues.push(issue),
		...extra,
	});
	const slide = (index: number): HTMLElement | null =>
		stage.querySelector(`.adk-slide[data-index="${index}"]`);
	return { renderer, stage, issues, slide };
}

/** A deck of `count` slides, each with one box named after its number. */
function boxes(count: number): string {
	return Array.from(
		{ length: count },
		(_, index) => `box:\n  ${index + 1}`,
	).join("\n\n---\n\n");
}

describe("createSlideRenderer", () => {
	it("draws nothing until a slide is shown", () => {
		const { stage, renderer } = setup("# Hello");
		expect(stage.children).toHaveLength(0);
		expect(renderer.mounted()).toEqual([]);
	});

	it("mounts the current slide and its neighbors, in order", () => {
		const log: BoxLog = [];
		const { renderer, stage } = setup(boxes(5), [createBoxPlugin(log)]);
		renderer.show(2);
		expect(renderer.mounted()).toEqual([1, 2, 3]);
		expect(log).toEqual(["mount:2", "mount:3", "mount:4"]);
		expect(
			[...stage.children].map((slide) => (slide as HTMLElement).dataset.index),
		).toEqual(["1", "2", "3"]);
	});

	it("destroys the slides that move away and keeps the ones still near", () => {
		const log: BoxLog = [];
		const { renderer, stage } = setup(boxes(6), [createBoxPlugin(log)]);
		renderer.show(1);
		log.length = 0;
		renderer.show(3);
		expect(renderer.mounted()).toEqual([2, 3, 4]);
		expect(log).toEqual(["destroy:1", "destroy:2", "mount:4", "mount:5"]);
		expect(stage.querySelectorAll(".test-box")).toHaveLength(3);
		renderer.show(0);
		expect(
			[...stage.children].map((slide) => (slide as HTMLElement).dataset.index),
		).toEqual(["0", "1"]);
	});

	it("shows only the current slide and hides its neighbors from assistive technology", () => {
		const { renderer, slide } = setup(boxes(3), [createBoxPlugin()]);
		renderer.show(1);
		expect(slide(1)?.dataset.state).toBe("current");
		expect(slide(1)?.inert).toBe(false);
		expect(slide(1)?.hasAttribute("aria-hidden")).toBe(false);
		expect(slide(1)?.getAttribute("aria-label")).toBe("Slide 2");
		for (const [index, state] of [
			[0, "past"],
			[2, "future"],
		] as const) {
			expect(slide(index)?.dataset.state).toBe(state);
			expect(slide(index)?.inert).toBe(true);
			expect(slide(index)?.getAttribute("aria-hidden")).toBe("true");
		}
		renderer.show(2);
		expect(slide(2)?.inert).toBe(false);
		expect(slide(2)?.hasAttribute("aria-hidden")).toBe(false);
		expect(slide(1)?.dataset.state).toBe("past");
	});

	it("destroys every slide", () => {
		const log: BoxLog = [];
		const { renderer, stage } = setup(boxes(3), [createBoxPlugin(log)]);
		renderer.show(1);
		renderer.destroy();
		expect(stage.children).toHaveLength(0);
		expect(log.filter((entry) => entry.startsWith("destroy"))).toHaveLength(3);
		expect(renderer.mounted()).toEqual([]);
	});

	it("puts leading text in the header and the rest in the body", () => {
		const { renderer, slide } = setup("## Title\n\nbox:\n  a\n\nbox:\n  b", [
			createBoxPlugin(),
		]);
		renderer.show(0);
		const element = slide(0);
		expect(element?.dataset.flow).toBe("columns");
		expect(
			element
				?.querySelector(".adk-slide-header > .adk-block")
				?.getAttribute("data-type"),
		).toBe("text");
		expect(
			element?.querySelectorAll(".adk-slide-body > .adk-block[data-type=box]"),
		).toHaveLength(2);
	});

	it("marks each block with its type and id", () => {
		const { renderer, slide } = setup("box id=intro:\n  a", [
			createBoxPlugin(),
		]);
		renderer.show(0);
		const block = slide(0)?.querySelector(".adk-block");
		expect(block?.getAttribute("data-type")).toBe("box");
		expect(block?.getAttribute("data-id")).toBe("intro");
		expect(block?.querySelector(".test-box")?.textContent).toBe("a");
	});

	it("shows text as a placeholder with its source until the text block exists", () => {
		const { renderer, slide, issues } = setup("# Hello\nAnimated *slides*");
		renderer.show(0);
		const placeholder = slide(0)?.querySelector(".adk-placeholder");
		expect(placeholder?.getAttribute("data-type")).toBe("text");
		expect(
			placeholder?.querySelector(".adk-placeholder-type")?.textContent,
		).toBe("text");
		expect(
			placeholder?.querySelector(".adk-placeholder-source")?.textContent,
		).toBe("# Hello\nAnimated *slides*");
		expect(placeholder?.hasAttribute("data-error")).toBe(false);
		expect(issues).toEqual([]);
	});

	it("draws text with the text block, as if it were written as text:", () => {
		const log: BoxLog = [];
		const { renderer, slide } = setup("# Hello\nAnimated *slides*", [
			createBoxPlugin(log, { type: "text" }),
		]);
		renderer.show(0);
		expect(log).toEqual(["mount:# Hello"]);
		const block = slide(0)?.querySelector('.adk-block[data-type="text"]');
		expect(block?.querySelector(".adk-placeholder")).toBeNull();
		expect(block?.querySelector(".test-box")?.textContent).toBe(
			"# Hello\nAnimated *slides*",
		);
	});

	it("plays the annotated lines of a text on the text block", () => {
		const log: BoxLog = [];
		const { renderer } = setup("- a  @1\n- b  @2", [
			createBoxPlugin(log, { type: "text", logSteps: true }),
		]);
		renderer.show(0);
		log.length = 0;
		renderer.goToStep(1);
		renderer.goToStep(2);
		// The second click finishes the first one before it plays.
		expect(log).toEqual([
			"play:- a  @1:0-1",
			"set:- a  @1:1",
			"play:- a  @1:1-2",
		]);
		expect(renderer.timeline(0)?.step).toBe(2);
	});

	it("shows text as a placeholder when the text block cannot read it", () => {
		const text: BlockPlugin = {
			kind: "block",
			definition: {
				type: "text",
				aliases: [],
				version: "1.0.0",
				parse: () => ({ model: null, diagnostics: [] }),
				steps: () => [],
			},
			view: {
				type: "text",
				mount: () => {
					throw new Error("never mounted");
				},
			},
		};
		const { renderer, slide, issues } = setup("Hi", [text]);
		renderer.show(0);
		expect(
			slide(0)?.querySelector(".adk-placeholder-source")?.textContent,
		).toBe("Hi");
		expect(issues).toEqual([]);
	});

	it("shows a block its definition could not read as a placeholder", () => {
		const log: BoxLog = [];
		const { renderer, slide, issues } = setup("box broken:\n  a", [
			createBoxPlugin(log),
		]);
		renderer.show(0);
		expect(log).toEqual([]);
		expect(
			slide(0)?.querySelector(".adk-placeholder-source")?.textContent,
		).toBe("box:\n  a");
		expect(issues).toEqual([]);
	});

	it("reports a block whose adapter is missing and shows the problem in its place", () => {
		const log: BoxLog = [];
		const { renderer, slide, issues } = setup("box:\n  a", [
			createBoxPlugin(log, { needs: ["animator", "charts"] }),
		]);
		renderer.show(0);
		const message =
			'Line 1: the box block needs the "charts" adapter, which is not registered.';
		expect(log).toEqual([]);
		expect(issues).toEqual([{ severity: "error", message }]);
		const placeholder = slide(0)?.querySelector(".adk-placeholder");
		expect(placeholder?.hasAttribute("data-error")).toBe(true);
		expect(
			placeholder?.querySelector(".adk-placeholder-message")?.textContent,
		).toBe(message);
	});

	it("reports a block that fails to mount and keeps showing the slide", () => {
		const log: BoxLog = [];
		const { renderer, slide, issues } = setup("box:\n  bad\n\nbox:\n  good", [
			createBoxPlugin(log, { failOn: "bad" }),
		]);
		renderer.show(0);
		expect(log).toEqual(["mount:good"]);
		expect(issues).toEqual([
			{
				severity: "error",
				message: "Line 1: the box block could not be drawn (cannot draw bad).",
			},
		]);
		expect(
			slide(0)?.querySelector(".adk-placeholder[data-error]"),
		).not.toBeNull();
	});

	it("keeps going when a block fails to clean up", () => {
		const box = createBoxPlugin();
		const failing: BlockPlugin<BoxModel> = {
			...box,
			view: {
				type: "box",
				mount(model, el, ctx) {
					const instance = box.view.mount(model, el, ctx);
					return {
						...instance,
						destroy: () => {
							throw new Error("cannot clean up");
						},
					};
				},
			},
		};
		const { renderer, stage } = setup(boxes(4), [failing]);
		const errors: unknown[] = [];
		const original = console.error;
		console.error = (error: unknown) => errors.push(error);
		try {
			renderer.show(0);
			renderer.show(3);
		} finally {
			console.error = original;
		}
		expect(errors).toHaveLength(2);
		expect(renderer.mounted()).toEqual([2, 3]);
		expect(stage.children).toHaveLength(2);
	});

	describe("steps", () => {
		const STEPS =
			"box:\n  a1\n  a2\n\n---\n\nbox:\n  b1\n  b2\n  b3\n\n---\n\nbox:\n  c1";

		function steps(element: HTMLElement | null): string | undefined {
			return element?.querySelector<HTMLElement>(".test-box")?.dataset.step;
		}

		it("shows the slide at the step asked for, at once", () => {
			const log: BoxLog = [];
			const { renderer, slide } = setup(STEPS, [
				createBoxPlugin(log, { logSteps: true }),
			]);
			renderer.show(1, 2);
			expect(steps(slide(1))).toBe("2");
			expect(log).toContain("set:b1:2");
			expect(log.some((entry) => entry.startsWith("play:"))).toBe(false);
		});

		it("leaves the previous slide at its end and the next one at its start", () => {
			const { renderer, slide } = setup(STEPS, [createBoxPlugin()]);
			renderer.show(1, 1);
			expect(steps(slide(0))).toBe("2");
			expect(steps(slide(2))).toBe("0");
		});

		it("animates the next click of the current slide and jumps to any other", () => {
			const log: BoxLog = [];
			const { renderer, slide } = setup(STEPS, [
				createBoxPlugin(log, { logSteps: true }),
			]);
			renderer.show(1);
			log.length = 0;
			renderer.goToStep(1);
			expect(log).toEqual(["play:b1:0-1"]);
			// The click is still playing, so it is completed before the jump.
			renderer.goToStep(3);
			expect(log).toEqual(["play:b1:0-1", "set:b1:1", "set:b1:3"]);
			expect(steps(slide(1))).toBe("3");
			expect(renderer.timeline(1)?.step).toBe(3);
		});

		it("does nothing with steps before a slide is shown", () => {
			const { renderer } = setup(STEPS, [createBoxPlugin()]);
			expect(() => renderer.goToStep(1)).not.toThrow();
			expect(renderer.timeline(0)).toBeUndefined();
		});

		it("reports a block that fails to change step", () => {
			const box = createBoxPlugin();
			const failing: BlockPlugin<BoxModel> = {
				...box,
				view: {
					type: "box",
					mount(model, el, ctx) {
						return {
							...box.view.mount(model, el, ctx),
							setState: () => {
								throw new Error("stuck");
							},
						};
					},
				},
			};
			const { renderer, issues } = setup(STEPS, [failing]);
			renderer.show(1, 2);
			expect(issues).toContainEqual({
				severity: "error",
				message: "Line 7: the box block could not show its step 2 (stuck).",
			});
		});

		it("gives each block a context of its own built from the shared one", () => {
			const contexts: BlockContext[] = [];
			const box = createBoxPlugin();
			const spy: BlockPlugin<BoxModel> = {
				...box,
				view: {
					type: "box",
					mount(model, el, ctx) {
						contexts.push(ctx);
						return box.view.mount(model, el, ctx);
					},
				},
			};
			const shared = createTestContext();
			const { renderer } = setup("box:\n  a\n\nbox:\n  b", [spy], {
				context: shared,
			});
			renderer.show(0);
			expect(contexts).toHaveLength(2);
			expect(contexts[0]).not.toBe(contexts[1]);
			expect(contexts[0]?.events).toBe(shared.events);
		});
	});

	describe("transitions", () => {
		const DECK = [
			"# One",
			"slide: transition=zoom\n\n# Two",
			"slide: transition=slide\n\n# Three",
			"# Four",
			"# Five",
		].join("\n\n---\n\n");

		it("uses the transition of the later slide when moving to a neighbor", () => {
			const { renderer, stage } = setup(DECK);
			renderer.show(0);
			expect(stage.dataset.transition).toBe("none");
			renderer.show(1);
			expect(stage.dataset.transition).toBe("zoom");
			renderer.show(2);
			expect(stage.dataset.transition).toBe("slide");
			renderer.show(1);
			expect(stage.dataset.transition).toBe("slide");
			renderer.show(2);
			renderer.show(3);
			expect(stage.dataset.transition).toBe("fade");
		});

		it("cuts when jumping further than a neighbor", () => {
			const { renderer, stage } = setup(DECK);
			renderer.show(0);
			renderer.show(4);
			expect(stage.dataset.transition).toBe("none");
		});
	});

	describe("problems", () => {
		it("shows the problems of a slide in a card on it", () => {
			const problems = new Map([
				[
					1,
					[
						{ severity: "error", message: "Line 5: broken" },
						{ severity: "warning", message: "Line 6: odd" },
					] as const,
				],
			]);
			const { renderer, slide } = setup("# One\n\n---\n\n# Two", [], {
				problems,
			});
			renderer.show(0);
			expect(slide(0)?.querySelector(".adk-error-card")).toBeNull();
			const card = slide(1)?.querySelector(".adk-error-card");
			expect(card?.querySelector("summary")?.textContent).toBe(
				"Problems on this slide: 2",
			);
			expect(
				[...(card?.querySelectorAll("li") ?? [])].map((item) => [
					item.dataset.severity,
					item.textContent,
				]),
			).toEqual([
				["error", "Line 5: broken"],
				["warning", "Line 6: odd"],
			]);
		});
	});
});
