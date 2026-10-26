// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { createSlideContext, sourceLines } from "../../test/support/contexts";
import { SEQUENCE_BLOCK } from "../../test/support/test-registry";
import { buildBlockNode } from "./build-block-node";
import { readBlockHeader } from "./read-block-header";

function build(headerLine: string, context = createSlideContext(), line = 3) {
	const header = readBlockHeader(headerLine);
	if (header === null) throw new Error("not a header");
	return buildBlockNode(
		SEQUENCE_BLOCK,
		header,
		sourceLines("A -> B", line + 1),
		line,
		context,
	);
}

describe("buildBlockNode", () => {
	it("passes the split header and the body to the block", () => {
		const node = build('Sequence left id=Pay caption="Two words":');
		expect(node).toEqual({
			kind: "block",
			type: "sequence",
			keyword: "Sequence",
			id: "pay",
			args: ["left"],
			options: [
				{
					key: "caption",
					name: "caption",
					value: "Two words",
					location: { line: 3, column: 22 },
				},
			],
			body: [{ line: 4, raw: "A -> B", text: "A -> B" }],
			location: { line: 3, column: 1 },
			model: ["A -> B"],
		});
	});

	it("drops an invalid id with E203", () => {
		const context = createSlideContext();
		const node = build("sequence id=1st:", context);
		expect(node.id).toBeNull();
		expect(context.reporter.diagnostics).toMatchObject([
			{ code: "E203", line: 3, column: 10, params: { id: "1st" } },
		]);
	});

	it("reports a repeated id anywhere in the deck with E202", () => {
		const context = createSlideContext();
		build("sequence id=flow:", context, 3);
		const node = build("sequence id=Flow:", context, 9);
		expect(node.id).toBe("flow");
		expect(context.reporter.diagnostics).toMatchObject([
			{ code: "E202", line: 9, params: { id: "Flow", firstLine: 3 } },
		]);
	});

	it("keeps the last id when several are given", () => {
		expect(build("sequence id=a id=b:").id).toBe("b");
	});
});
