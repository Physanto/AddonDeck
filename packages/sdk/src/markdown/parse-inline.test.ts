// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import type { InlineNode } from "./markdown-node";
import { parseInline } from "./parse-inline";

const text = (value: string): InlineNode => ({ kind: "text", text: value });
const strong = (...children: InlineNode[]): InlineNode => ({
	kind: "strong",
	children,
});
const em = (...children: InlineNode[]): InlineNode => ({
	kind: "emphasis",
	children,
});

describe("parseInline", () => {
	it("reads plain text as one text node", () => {
		expect(parseInline("Hello, world")).toEqual([text("Hello, world")]);
		expect(parseInline("")).toEqual([]);
	});

	it("reads strong text and emphasis with stars and underscores", () => {
		expect(parseInline("a **b** c")).toEqual([
			text("a "),
			strong(text("b")),
			text(" c"),
		]);
		expect(parseInline("__b__ and _c_")).toEqual([
			strong(text("b")),
			text(" and "),
			em(text("c")),
		]);
		expect(parseInline("*one*")).toEqual([em(text("one"))]);
	});

	it("nests emphasis inside strong text and the other way round", () => {
		expect(parseInline("**a *b* c**")).toEqual([
			strong(text("a "), em(text("b")), text(" c")),
		]);
		expect(parseInline("*a **b** c*")).toEqual([
			em(text("a "), strong(text("b")), text(" c")),
		]);
		expect(parseInline("***both***")).toEqual([em(strong(text("both")))]);
	});

	it("keeps delimiters that open or close nothing", () => {
		expect(parseInline("2 * 3 * 4")).toEqual([text("2 * 3 * 4")]);
		expect(parseInline("**open")).toEqual([text("**open")]);
		expect(parseInline("snake_case_name")).toEqual([text("snake_case_name")]);
		expect(parseInline("**a*")).toEqual([text("*"), em(text("a"))]);
	});

	it("reads inline code literally", () => {
		expect(parseInline("run `npm *install*` now")).toEqual([
			text("run "),
			{ kind: "code", text: "npm *install*" },
			text(" now"),
		]);
		expect(parseInline("``a ` b``")).toEqual([{ kind: "code", text: "a ` b" }]);
		expect(parseInline("`` `x` ``")).toEqual([{ kind: "code", text: "`x`" }]);
		expect(parseInline("`open")).toEqual([text("`open")]);
	});

	it("reads links to web and email addresses and to fragments", () => {
		expect(parseInline("[the **docs**](https://example.com/a_(b))")).toEqual([
			{
				kind: "link",
				href: "https://example.com/a_(b)",
				children: [text("the "), strong(text("docs"))],
			},
		]);
		expect(parseInline('[mail](mailto:a@b.c "Write")')).toEqual([
			{ kind: "link", href: "mailto:a@b.c", children: [text("mail")] },
		]);
		expect(parseInline("[top](<#start>)")).toEqual([
			{ kind: "link", href: "#start", children: [text("top")] },
		]);
	});

	it("keeps only the label of a link to any other address", () => {
		expect(parseInline("[click](javascript:alert(1))")).toEqual([
			text("click"),
		]);
		expect(parseInline("[x](data:text/html,hi) y")).toEqual([
			text("x"),
			text(" y"),
		]);
		expect(parseInline("[x](JavaScript:void(0))")).toEqual([text("x")]);
	});

	it("keeps images, unfinished links and HTML as text", () => {
		expect(parseInline("![cat](https://x/cat.png)")).toEqual([
			text("![cat](https://x/cat.png)"),
		]);
		expect(parseInline("[not a link] (x)")).toEqual([text("[not a link] (x)")]);
		expect(parseInline("<b>bold</b><script>x()</script>")).toEqual([
			text("<b>bold</b><script>x()</script>"),
		]);
	});

	it("turns backslash escapes into the literal character", () => {
		expect(parseInline("\\*not em\\* \\` \\\\ \\a")).toEqual([
			text("*not em* ` \\ \\a"),
		]);
	});
});
