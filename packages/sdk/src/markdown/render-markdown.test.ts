// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import type { SourceLine } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./parse-markdown";
import { renderMarkdown } from "./render-markdown";

function render(...texts: string[]) {
	const source: SourceLine[] = texts.map((text, index) => ({
		line: index + 1,
		raw: text,
		text,
	}));
	const el = document.createElement("div");
	const { lines } = renderMarkdown(parseMarkdown(source).document, el);
	return { el, lines };
}

describe("renderMarkdown", () => {
	it("draws headings, paragraphs and inline formatting", () => {
		const { el } = render(
			"## Why **trains**",
			"Fast and `cheap`",
			"with [a map](https://x.org)",
		);
		expect(el.innerHTML).toBe(
			"<h2>Why <strong>trains</strong></h2>" +
				'<p><span class="adk-md-line">Fast and <code>cheap</code></span><br>' +
				'<span class="adk-md-line">with <a href="https://x.org" target="_blank" rel="noopener noreferrer">a map</a></span></p>',
		);
	});

	it("draws lists, quotes, code and rules", () => {
		const { el } = render(
			"2. a",
			"   - b",
			"> *q*",
			"```js",
			"<x>",
			"```",
			"***",
		);
		expect(el.innerHTML).toBe(
			'<ol start="2"><li><span class="adk-md-line">a</span>' +
				'<ul><li><span class="adk-md-line">b</span></li></ul></li></ol>' +
				'<blockquote><p><span class="adk-md-line"><em>q</em></span></p></blockquote>' +
				'<pre><code data-language="js">&lt;x&gt;</code></pre><hr>',
		);
	});

	it("shows HTML as written and never creates elements from it", () => {
		const { el } = render(
			"<img src=x onerror=alert(1)>",
			"- <script>bad()</script>",
		);
		expect(el.querySelector("img, script")).toBeNull();
		expect(el.textContent).toBe(
			"<img src=x onerror=alert(1)><script>bad()</script>",
		);
	});

	it("keeps fragment links in the same page", () => {
		const { el } = render("[top](#start)");
		expect(el.querySelector("a")?.outerHTML).toBe('<a href="#start">top</a>');
	});

	it("maps each line to the element that shows it", () => {
		const { lines } = render(
			"# Title",
			"",
			"- one",
			"  more",
			"- two",
			"",
			"a",
			"b",
			"```",
			"c",
			"```",
		);
		expect(lines.get(1)?.tagName).toBe("H1");
		expect(lines.get(3)?.tagName).toBe("LI");
		expect(lines.get(4)?.className).toBe("adk-md-line");
		expect(lines.get(5)?.textContent).toBe("two");
		expect(lines.get(8)?.textContent).toBe("b");
		expect([...lines.keys()]).toEqual([1, 3, 4, 5, 7, 8]);
	});
});
