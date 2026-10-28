// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import type { MarkdownBlock } from "./markdown-node";
import { parseMarkdown } from "./parse-markdown";

function lines(...texts: string[]): SourceLine[] {
	return texts.map((text, index) => ({ line: index + 1, raw: text, text }));
}

function blocks(...texts: string[]): readonly MarkdownBlock[] {
	return parseMarkdown(lines(...texts)).document.blocks;
}

const plain = (line: number, text: string) => ({
	line,
	content: [{ kind: "text", text }],
});

describe("parseMarkdown", () => {
	it("reads headings of six levels, without closing hashes", () => {
		expect(blocks("# One", "###### Six ##", "#hashtag")).toEqual([
			{ kind: "heading", level: 1, line: plain(1, "One") },
			{ kind: "heading", level: 6, line: plain(2, "Six") },
			{ kind: "paragraph", lines: [plain(3, "#hashtag")] },
		]);
	});

	it("separates paragraphs with blank lines and keeps each line", () => {
		expect(blocks("First", "still first", "", "Second")).toEqual([
			{
				kind: "paragraph",
				lines: [plain(1, "First"), plain(2, "still first")],
			},
			{ kind: "paragraph", lines: [plain(4, "Second")] },
		]);
	});

	it("reads bullet and ordered lists, nested by indentation", () => {
		expect(
			blocks("- a", "  - a1", "  - a2", "- b", "", "3. c", "4) d"),
		).toEqual([
			{
				kind: "list",
				ordered: false,
				start: 1,
				items: [
					{
						lines: [plain(1, "a")],
						children: [
							{
								kind: "list",
								ordered: false,
								start: 1,
								items: [
									{ lines: [plain(2, "a1")], children: [] },
									{ lines: [plain(3, "a2")], children: [] },
								],
							},
						],
					},
					{ lines: [plain(4, "b")], children: [] },
				],
			},
			{
				kind: "list",
				ordered: true,
				start: 3,
				items: [
					{ lines: [plain(6, "c")], children: [] },
					{ lines: [plain(7, "d")], children: [] },
				],
			},
		]);
	});

	it("continues a list across blank lines and an item across indented lines", () => {
		expect(blocks("* a", "  more of a", "", "* b", "after")).toEqual([
			{
				kind: "list",
				ordered: false,
				start: 1,
				items: [
					{ lines: [plain(1, "a"), plain(2, "more of a")], children: [] },
					{ lines: [plain(4, "b")], children: [] },
				],
			},
			{ kind: "paragraph", lines: [plain(5, "after")] },
		]);
	});

	it("lets a list or a heading interrupt a paragraph", () => {
		expect(
			blocks("Intro", "- item", "Text", "## Title").map((b) => b.kind),
		).toEqual(["paragraph", "list", "paragraph", "heading"]);
	});

	it("reads block quotes, with blocks inside", () => {
		expect(blocks("> # Quote", "> - one", "Out")).toEqual([
			{
				kind: "quote",
				children: [
					{ kind: "heading", level: 1, line: plain(1, "Quote") },
					{
						kind: "list",
						ordered: false,
						start: 1,
						items: [{ lines: [plain(2, "one")], children: [] }],
					},
				],
			},
			{ kind: "paragraph", lines: [plain(3, "Out")] },
		]);
	});

	it("reads fenced code literally, also when it is never closed", () => {
		expect(
			blocks("```python", "# not a heading", "- not a list", "```", "x"),
		).toEqual([
			{
				kind: "code",
				language: "python",
				text: "# not a heading\n- not a list",
				line: 1,
			},
			{ kind: "paragraph", lines: [plain(5, "x")] },
		]);
		expect(blocks("~~~", "open")).toEqual([
			{ kind: "code", language: "", text: "open", line: 1 },
		]);
	});

	it("reads horizontal rules", () => {
		expect(blocks("***", "_ _ _")).toEqual([
			{ kind: "rule", line: 1 },
			{ kind: "rule", line: 2 },
		]);
	});

	it("takes step annotations off every line outside code fences", () => {
		const { document } = parseMarkdown(
			lines("- One  @1", "```", "x  @9", "```", "Two  → net"),
		);
		expect(
			document.annotated.map(({ line, annotation }) => [
				line,
				annotation.step,
				annotation.triggers,
			]),
		).toEqual([
			[1, 1, []],
			[5, null, ["net"]],
		]);
		expect(document.blocks[0]).toMatchObject({
			items: [{ lines: [plain(1, "One")] }],
		});
		expect(document.blocks[1]).toMatchObject({ text: "x  @9" });
	});

	it("reports the diagnostics of the annotations", () => {
		const { diagnostics } = parseMarkdown(lines("print(x) @3", "y  @0"));
		expect(diagnostics.map((d) => d.code)).toEqual(["W307", "W310"]);
	});

	it("keeps HTML as text", () => {
		expect(blocks("<div onclick=x()>hi</div>")).toEqual([
			{ kind: "paragraph", lines: [plain(1, "<div onclick=x()>hi</div>")] },
		]);
	});
});
