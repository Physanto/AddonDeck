// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import type { BlockSource } from "@addondeck/sdk";
import { createTestContext, runBlockContract } from "@addondeck/sdk/testing";
import { describe, expect, it } from "vitest";
import { definition } from "./definition";
import docs from "./docs.md?raw";
import markdown from "./examples/markdown.deck?raw";
import steps from "./examples/steps.deck?raw";
import { view } from "./view";

runBlockContract({
	definition,
	view,
	docs,
	examples: [
		{ name: "markdown.deck", source: markdown },
		{ name: "steps.deck", source: steps },
	],
});

function source(
	body: string[],
	header: Partial<BlockSource> = {},
): BlockSource {
	return {
		type: "text",
		keyword: "text",
		id: null,
		args: [],
		options: [],
		body: body.map((text, index) => ({
			line: index + 2,
			raw: `  ${text}`,
			text,
		})),
		location: { line: 1, column: 1 },
		...header,
	};
}

function mount(body: string[]) {
	const { model } = definition.parse(source(body));
	if (model === null) throw new Error("no model");
	const el = document.createElement("div");
	const instance = view.mount(model, el, createTestContext());
	return { el, instance };
}

describe("text block", () => {
	it("offers one step per annotated line, outside code fences", () => {
		const { model } = definition.parse(
			source(["# Title", "- a  @2", "```", "b  @1", "```", "c  → other"]),
		);
		if (model === null) throw new Error("no model");
		expect(definition.steps(model)).toEqual([
			{ at: 2, triggers: [], location: { line: 3, column: 8 } },
			{ at: null, triggers: ["other"], location: { line: 7, column: 6 } },
		]);
	});

	it("warns about arguments and options it does not take", () => {
		const { diagnostics } = definition.parse(
			source(["Hi"], {
				args: ["big"],
				options: [
					{
						key: "size",
						name: "Size",
						value: "2",
						location: { line: 1, column: 10 },
					},
				],
			}),
		);
		expect(diagnostics.map((d) => [d.code, d.params.name])).toEqual([
			["TEXT-W01", "big"],
			["TEXT-W01", "Size"],
		]);
	});

	it("shows unannotated text from the start and the rest one step at a time", async () => {
		const { el, instance } = mount([
			"Always here",
			"",
			"- First  @1",
			"- Second  @2",
		]);
		const [first, second] = el.querySelectorAll("li");
		expect(el.querySelector("p")?.getAttribute("style")).toBeNull();
		expect(first?.style.opacity).toBe("0");
		await instance.play(0, 1);
		expect(first?.style.opacity).toBe("1");
		expect(second?.style.opacity).toBe("0");
		instance.setState(2);
		expect(second?.style.opacity).toBe("1");
		instance.setState(0);
		expect(first?.style.opacity).toBe("0");
	});

	it("reveals a single line of a paragraph", () => {
		const { el, instance } = mount(["Question?", "Answer.  @1"]);
		const [question, answer] = el.querySelectorAll<HTMLElement>(".adk-md-line");
		expect(question?.style.opacity).toBe("");
		expect(answer?.style.opacity).toBe("0");
		instance.setState(1);
		expect(answer?.style.opacity).toBe("1");
	});

	it("shows raw HTML as text", () => {
		const { el } = mount(["<img src=x onerror=alert(1)>"]);
		expect(el.querySelector("img")).toBeNull();
		expect(el.textContent).toBe("<img src=x onerror=alert(1)>");
	});

	it("removes what it drew when destroyed", () => {
		const { el, instance } = mount(["# Hi"]);
		instance.destroy();
		expect(el.innerHTML).toBe("");
	});
});
