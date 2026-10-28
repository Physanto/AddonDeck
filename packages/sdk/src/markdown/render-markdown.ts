// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	InlineNode,
	MarkdownBlock,
	MarkdownDocument,
	MarkdownLine,
} from "./markdown-node";

/**
 * Appends inline Markdown to `parent`. Text goes in as text nodes, never as
 * HTML, so tags written in a deck show as written.
 */
export function renderInline(
	nodes: readonly InlineNode[],
	parent: HTMLElement,
): void {
	const document = parent.ownerDocument;
	for (const node of nodes) {
		switch (node.kind) {
			case "text":
				parent.append(node.text);
				break;
			case "code": {
				const code = document.createElement("code");
				code.textContent = node.text;
				parent.append(code);
				break;
			}
			case "strong":
			case "emphasis": {
				const element = document.createElement(
					node.kind === "strong" ? "strong" : "em",
				);
				renderInline(node.children, element);
				parent.append(element);
				break;
			}
			case "link": {
				const link = document.createElement("a");
				link.href = node.href;
				if (!node.href.startsWith("#")) {
					link.target = "_blank";
					link.rel = "noopener noreferrer";
				}
				renderInline(node.children, link);
				parent.append(link);
				break;
			}
		}
	}
}

/** What {@link renderMarkdown} drew. */
export interface RenderedMarkdown {
	/**
	 * The element that shows each source line, by line number: the heading,
	 * the list item a line starts, or the `adk-md-line` span of a line inside
	 * a paragraph or item. Lines of code blocks and blank lines have none.
	 */
	readonly lines: ReadonlyMap<number, HTMLElement>;
}

/**
 * Draws a Markdown document inside `parent` with plain HTML elements
 * (`h1`…`h6`, `p`, `ul`, `ol`, `li`, `blockquote`, `pre`, `hr`).
 *
 * Every line break of the source is kept: lines of a paragraph or list item
 * are `span.adk-md-line` elements separated by `<br>`, because a slide is
 * written line by line.
 *
 * @example
 * ```ts
 * const { document } = parseMarkdown(node.lines);
 * const { lines } = renderMarkdown(document, el);
 * lines.get(12)?.style.setProperty("opacity", "0");
 * ```
 */
export function renderMarkdown(
	markdown: MarkdownDocument,
	parent: HTMLElement,
): RenderedMarkdown {
	const document = parent.ownerDocument;
	const lines = new Map<number, HTMLElement>();

	const appendLines = (
		source: readonly MarkdownLine[],
		element: HTMLElement,
	): void => {
		source.forEach((line, index) => {
			if (index > 0) element.append(document.createElement("br"));
			const span = document.createElement("span");
			span.className = "adk-md-line";
			renderInline(line.content, span);
			element.append(span);
			lines.set(line.line, span);
		});
	};

	const appendBlocks = (
		blocks: readonly MarkdownBlock[],
		into: HTMLElement,
	): void => {
		for (const block of blocks) {
			switch (block.kind) {
				case "heading": {
					const heading = document.createElement(`h${block.level}`);
					renderInline(block.line.content, heading);
					into.append(heading);
					lines.set(block.line.line, heading);
					break;
				}
				case "paragraph": {
					const paragraph = document.createElement("p");
					appendLines(block.lines, paragraph);
					into.append(paragraph);
					break;
				}
				case "list": {
					const list = document.createElement(block.ordered ? "ol" : "ul");
					if (block.ordered && block.start !== 1) {
						list.setAttribute("start", String(block.start));
					}
					for (const item of block.items) {
						const entry = document.createElement("li");
						appendLines(item.lines, entry);
						appendBlocks(item.children, entry);
						list.append(entry);
						const first = item.lines[0];
						if (first !== undefined) lines.set(first.line, entry);
					}
					into.append(list);
					break;
				}
				case "quote": {
					const quote = document.createElement("blockquote");
					appendBlocks(block.children, quote);
					into.append(quote);
					break;
				}
				case "code": {
					const pre = document.createElement("pre");
					const code = document.createElement("code");
					if (block.language !== "") code.dataset.language = block.language;
					code.textContent = block.text;
					pre.append(code);
					into.append(pre);
					break;
				}
				case "rule":
					into.append(document.createElement("hr"));
					break;
			}
		}
	};

	appendBlocks(markdown.blocks, parent);
	return { lines };
}
