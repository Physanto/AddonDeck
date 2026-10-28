// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import type { BlockOption, BlockSource } from "@addondeck/sdk";
import { createTestContext, runBlockContract } from "@addondeck/sdk/testing";
import { describe, expect, it } from "vitest";
import { definition, type ListModel } from "./definition";
import docs from "./docs.md?raw";
import revealAll from "./examples/reveal-all.deck?raw";
import steps from "./examples/steps.deck?raw";
import { view } from "./view";

runBlockContract({
	definition,
	view,
	docs,
	examples: [
		{ name: "steps.deck", source: steps },
		{ name: "reveal-all.deck", source: revealAll },
	],
});

function option(key: string, value: string): BlockOption {
	return { key, name: key, value, location: { line: 1, column: 6 } };
}

function source(
	body: string[],
	header: Partial<BlockSource> = {},
): BlockSource {
	return {
		type: "list",
		keyword: "list",
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

function read(body: string[], header: Partial<BlockSource> = {}): ListModel {
	const { model } = definition.parse(source(body, header));
	if (model === null) throw new Error("no model");
	return model;
}

function mount(model: ListModel) {
	const el = document.createElement("div");
	const instance = view.mount(model, el, createTestContext());
	return { el, instance, items: [...el.querySelectorAll("li")] };
}

describe("list block", () => {
	it("reads one item per line, with or without a marker, nested by indentation", () => {
		const model = read(["- **One**", "", "Two", "  * Two.a", "\t+ Two.b"]);
		expect(model).toMatchObject({ ordered: false, start: 1, reveal: "each" });
		expect(model.items.map((item) => [item.level, item.content])).toEqual([
			[0, [{ kind: "strong", children: [{ kind: "text", text: "One" }] }]],
			[0, [{ kind: "text", text: "Two" }]],
			[1, [{ kind: "text", text: "Two.a" }]],
			[1, [{ kind: "text", text: "Two.b" }]],
		]);
	});

	it("numbers the list from the number of its first item", () => {
		expect(read(["3) Three", "- Four"])).toMatchObject({
			ordered: true,
			start: 3,
		});
		const { items } = mount(read(["1. a", "  - a.1", "2. b"]));
		expect(items.map((item) => item.value)).toEqual([1, 0, 2]);
	});

	it("offers one step per item, with its annotation", () => {
		const model = read(["a", "b  @3 → other"]);
		expect(definition.steps(model)).toEqual([
			{ at: null, triggers: [], location: { line: 2, column: 1 } },
			{ at: 3, triggers: ["other"], location: { line: 3, column: 6 } },
		]);
	});

	it("shows every item from the start with reveal=all", () => {
		const model = read(["a", "b"], { options: [option("reveal", "ALL")] });
		expect(definition.steps(model)).toEqual([]);
		const { items } = mount(model);
		expect(items.map((item) => item.getAttribute("style"))).toEqual([
			null,
			null,
		]);
	});

	it("reveals items one step at a time and goes back", async () => {
		const { items, instance } = mount(read(["a", "b", "c"]));
		const opacity = (): string[] => items.map((item) => item.style.opacity);
		expect(opacity()).toEqual(["0", "0", "0"]);
		await instance.play(0, 2);
		expect(opacity()).toEqual(["1", "1", "0"]);
		instance.setState(1);
		expect(opacity()).toEqual(["1", "0", "0"]);
	});

	it("warns about what it ignores", () => {
		const codes = (body: string[], header: Partial<BlockSource> = {}) =>
			definition.parse(source(body, header)).diagnostics.map((d) => d.code);
		expect(
			codes(["a"], { args: ["big"], options: [option("size", "2")] }),
		).toEqual(["LIST-W01", "LIST-W01"]);
		expect(codes(["a"], { options: [option("reveal", "slow")] })).toEqual([
			"LIST-W02",
		]);
		expect(codes([])).toEqual(["LIST-W03"]);
		expect(codes(["a  @1"], { options: [option("reveal", "all")] })).toEqual([
			"LIST-W04",
		]);
		expect(codes(["a @1"])).toEqual(["W307"]);
	});

	it("shows raw HTML as text and removes what it drew", () => {
		const { el, instance } = mount(read(["<b>x</b>"]));
		expect(el.querySelector("b")).toBeNull();
		instance.destroy();
		expect(el.innerHTML).toBe("");
	});
});
