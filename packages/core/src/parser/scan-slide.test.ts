// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import {
	codes,
	createSlideContext,
	rawSlide,
} from "../../test/support/contexts";
import { scanSlide } from "./scan-slide";

function scan(text: string, context = createSlideContext()) {
	const slide = scanSlide(rawSlide(text), context);
	return { slide, diagnostics: context.reporter.diagnostics };
}

function texts(text: string): string[][] {
	return scan(text).slide.content.map((node) =>
		node.kind === "text"
			? node.lines.map((line) => line.raw)
			: [`[${node.type}]`],
	);
}

describe("scanSlide", () => {
	describe("text", () => {
		it("joins consecutive lines and drops blank lines at both ends", () => {
			expect(texts("\n# Title\n\nParagraph\n\n")).toEqual([
				["# Title", "", "Paragraph"],
			]);
		});

		it("drops comments without splitting the text", () => {
			expect(texts("a\n// hidden\nb")).toEqual([["a", "b"]]);
		});

		it("keeps indented comments and lines starting with a backslash", () => {
			expect(texts("  // shown\n\\// shown too\n\\section: x")).toEqual([
				["  // shown", "\\// shown too", "\\section: x"],
			]);
		});

		it("keeps raw HTML as text", () => {
			expect(texts("<b>bold?</b>")).toEqual([["<b>bold?</b>"]]);
		});

		it("records the first level-1 heading", () => {
			expect(scan("## Sub\n# Main  @1\n# Other").slide.firstHeading).toBe(
				"Main",
			);
		});

		it("reads step annotations in text lines", () => {
			const { diagnostics } = scan("- one @1\n- two  @0");
			expect(codes(diagnostics)).toEqual(["W307", "W310"]);
		});
	});

	describe("code fences", () => {
		it("takes fenced lines literally", () => {
			const { slide, diagnostics } = scan(
				"```\nsection: x\nsequence:\n  a\n// not a comment\n# Not a title  @0\n```\nafter",
			);
			expect(slide.content).toHaveLength(1);
			expect(slide.sections).toEqual([]);
			expect(slide.firstHeading).toBeNull();
			expect(diagnostics).toEqual([]);
		});

		it("warns about a fence that is never closed", () => {
			const { diagnostics } = scan("text\n  ~~~\ncode");
			expect(diagnostics).toMatchObject([
				{ code: "W311", line: 2, column: 3, params: { openLine: 2 } },
			]);
		});
	});

	describe("directives", () => {
		it("reads sections and slide options in the leading lines", () => {
			const { slide, diagnostics } = scan(
				"// comment\n\nsection: Results\nslide: layout=rows\nslide: transition=none\n\n# Sales",
			);
			expect(slide.sections).toEqual([
				{ title: "Results", location: { line: 3, column: 1 } },
			]);
			expect(slide.options).toEqual({
				background: null,
				transition: "none",
				layout: "rows",
			});
			expect(diagnostics).toEqual([]);
		});

		it("ignores an empty section name with W303", () => {
			const { slide, diagnostics } = scan("Section:\n# x");
			expect(slide.sections).toEqual([]);
			expect(diagnostics).toMatchObject([
				{ code: "W303", params: { key: "Section", value: "" } },
			]);
		});

		it("shows a directive after the start of the slide as text, with W306", () => {
			const { slide, diagnostics } = scan(
				"# Title\nsection: Late\nslide: layout=rows",
			);
			expect(slide.sections).toEqual([]);
			expect(slide.options.layout).toBe("auto");
			expect(codes(diagnostics)).toEqual(["W306", "W306"]);
			expect(texts("# Title\nsection: Late")).toEqual([
				["# Title", "section: Late"],
			]);
		});
	});

	describe("blocks", () => {
		it("reads a block and its body between text", () => {
			expect(texts("## Flow\nsequence id=pay:\n  A -> B\n\nAfter")).toEqual([
				["## Flow"],
				["[sequence]"],
				["After"],
			]);
		});

		it("reads a block with an empty body", () => {
			const { slide } = scan("sequence:\nnext");
			expect(slide.content[0]).toMatchObject({
				kind: "block",
				body: [],
				model: [],
			});
		});

		it("ends a body at a comment", () => {
			expect(texts("sequence:\n  a\n// end\nb")).toEqual([
				["[sequence]"],
				["b"],
			]);
		});

		it("treats an indented header as text", () => {
			expect(texts("  sequence:\n    a")).toEqual([["  sequence:", "    a"]]);
		});

		it("shows a keyword followed by text as text, with I403", () => {
			const { slide, diagnostics } = scan("Sequence: the order matters");
			expect(slide.content[0]?.kind).toBe("text");
			expect(diagnostics).toMatchObject([
				{ code: "I403", params: { keyword: "Sequence" } },
			]);
		});

		it("warns about a header without its colon when a body follows", () => {
			expect(codes(scan("sequence id=pay\n\n  A -> B").diagnostics)).toEqual([
				"W305",
			]);
			expect(codes(scan("Sequence diagrams are useful").diagnostics)).toEqual(
				[],
			);
		});

		it("warns about an unknown block that is close to a known keyword", () => {
			const { slide, diagnostics } = scan("secuence id=pay:\n  A -> B");
			expect(slide.content).toMatchObject([{ kind: "text" }]);
			expect(diagnostics).toMatchObject([
				{
					code: "W304",
					suggestion: "sequence",
					params: { keyword: "secuence" },
				},
			]);
		});

		it("suggests notes for an unknown keyword close to it", () => {
			expect(scan("note:\n  remember").diagnostics[0]?.suggestion).toBe(
				"notes",
			);
		});

		it("warns about an unknown block with options even without a suggestion", () => {
			const { diagnostics } = scan("chart kind=bar:\n  a");
			expect(diagnostics).toMatchObject([{ code: "W304" }]);
			expect(diagnostics[0]?.suggestion).toBeUndefined();
		});

		it("does not suggest a keyword to itself", () => {
			const { diagnostics } = scan("notes id=x:\n  a");
			expect(diagnostics).toMatchObject([{ code: "W304" }]);
			expect(diagnostics[0]?.suggestion).toBeUndefined();
		});

		it("stays silent about text that merely ends with a colon", () => {
			expect(scan("Steps:\n  - one\n  - two").diagnostics).toEqual([]);
		});
	});

	describe("notes", () => {
		it("joins several notes with a blank line", () => {
			const { slide } = scan(
				"notes:\n  First.\n    Deeper.\n# Title\nnotes:\n  Second.",
			);
			expect(slide.notes).toMatchObject({
				text: "First.\n  Deeper.\n\nSecond.",
				location: { line: 1, column: 1 },
			});
			expect(slide.notes?.lines).toHaveLength(3);
		});

		it("warns about notes without indented text", () => {
			const { slide, diagnostics } = scan("# x\nnotes:\n\nnext");
			expect(slide.notes).toBeNull();
			expect(diagnostics).toMatchObject([{ code: "W313", line: 2 }]);
		});

		it("shows notes on the same line as text, with I403", () => {
			const { slide, diagnostics } = scan("Notes: buy milk");
			expect(slide.notes).toBeNull();
			expect(slide.content).toHaveLength(1);
			expect(codes(diagnostics)).toEqual(["I403"]);
		});
	});

	describe("triggers", () => {
		it("accepts a trigger naming a block on the slide, before or after it", () => {
			const text = "- a  → net\nsequence id=Net:\n  x\n- b  @2 → net";
			expect(scan(text).diagnostics).toEqual([]);
		});

		it("reports a trigger naming no block on the slide", () => {
			const { diagnostics } = scan(
				"- a  @1 → ghost → net\nsequence id=net:\n  x",
			);
			expect(diagnostics).toMatchObject([
				{ code: "E204", line: 1, column: 6, params: { id: "ghost" } },
			]);
		});
	});

	describe("emptiness and location", () => {
		it("is empty with only blank lines, comments and directives", () => {
			const { slide } = scan("\n// c\nsection: S\nslide: layout=rows\n");
			expect(slide.empty).toBe(true);
			expect(slide.location).toEqual({ line: 2, column: 1 });
		});

		it("is not empty with only notes", () => {
			expect(scan("notes:\n  hi").slide.empty).toBe(false);
		});
	});
});
