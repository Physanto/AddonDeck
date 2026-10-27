// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockNode, SlideNode, TextNode } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { arrangeSlide } from "./arrange-slide";

const location = { line: 1, column: 1 };
const text: TextNode = { kind: "text", lines: [], location };
const block: BlockNode = {
	kind: "block",
	type: "box",
	keyword: "box",
	id: null,
	args: [],
	options: [],
	body: [],
	location,
	model: {},
};

function nodes(pattern: string): SlideNode[] {
	return [...pattern].map((kind) => (kind === "t" ? text : block));
}

describe("arrangeSlide", () => {
	it("lets a single piece fill the slide", () => {
		expect(arrangeSlide(nodes("t"), "auto")).toEqual({
			header: null,
			body: [0],
			flow: "single",
		});
		expect(arrangeSlide(nodes("b"), "auto")).toEqual({
			header: null,
			body: [0],
			flow: "single",
		});
	});

	it("puts leading text above one block", () => {
		expect(arrangeSlide(nodes("tb"), "auto")).toEqual({
			header: 0,
			body: [1],
			flow: "single",
		});
	});

	it("places two pieces side by side", () => {
		expect(arrangeSlide(nodes("bb"), "auto")).toEqual({
			header: null,
			body: [0, 1],
			flow: "columns",
		});
		expect(arrangeSlide(nodes("tbb"), "auto")).toEqual({
			header: 0,
			body: [1, 2],
			flow: "columns",
		});
	});

	it("stacks three or more pieces in rows", () => {
		expect(arrangeSlide(nodes("bbb"), "auto")).toEqual({
			header: null,
			body: [0, 1, 2],
			flow: "rows",
		});
		expect(arrangeSlide(nodes("tbtb"), "auto").flow).toBe("rows");
	});

	it("only takes text as the header when it comes first", () => {
		expect(arrangeSlide(nodes("bt"), "auto")).toEqual({
			header: null,
			body: [0, 1],
			flow: "columns",
		});
	});

	it("uses the flow the slide asks for", () => {
		expect(arrangeSlide(nodes("tbbb"), "columns")).toEqual({
			header: 0,
			body: [1, 2, 3],
			flow: "columns",
		});
		expect(arrangeSlide(nodes("bb"), "rows").flow).toBe("rows");
		expect(arrangeSlide(nodes("b"), "columns").flow).toBe("columns");
	});

	it("arranges an empty slide", () => {
		expect(arrangeSlide([], "auto")).toEqual({
			header: null,
			body: [],
			flow: "single",
		});
	});
});
