// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { parse } from "@addondeck/core";
import type { BlockPlugin, Plugin } from "@addondeck/sdk";
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
} from "./create-slide-renderer";

let renderer: SlideRenderer | null = null;

afterEach(() => {
	renderer?.destroy();
	renderer = null;
	document.body.replaceChildren();
});

function setup(source: string, plugins: readonly Plugin[] = []) {
	const registry = createPluginRegistry();
	for (const plugin of plugins) registry.register(plugin);
	const { deck } = parse(source, { registry: registry.blocks() });
	const stage = document.createElement("div");
	document.body.append(stage);
	const issues: RuntimeIssue[] = [];
	renderer = createSlideRenderer({
		deck,
		stage,
		label: (slide) => `Slide ${slide.index + 1}`,
		registry,
		context: createTestContext(),
		translate: createTranslator(),
		report: (issue) => issues.push(issue),
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
});
