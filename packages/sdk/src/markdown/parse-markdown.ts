// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	closesFence,
	type Diagnostic,
	type ExtractStepAnnotationsOptions,
	extractStepAnnotations,
	readFence,
	type SourceLine,
} from "@addondeck/core";
import type {
	AnnotatedLine,
	MarkdownBlock,
	MarkdownDocument,
	MarkdownLine,
	MarkdownListItem,
} from "./markdown-node";
import { parseInline } from "./parse-inline";

/** A line ready to read: without its annotation, unless it is inside a code fence. */
interface Line {
	readonly line: number;
	readonly text: string;
}

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/;
const HEADING_CLOSE = /(?:^|[ \t]+)#+[ \t]*$/;
const RULE = /^ {0,3}([*_-])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const ITEM = /^([ \t]*)([-*+]|(\d{1,9})[.)])(?:[ \t]+(.*))?$/;

/** For indentation, a tab counts as two spaces, as in block bodies. */
function indentOf(text: string): number {
	let width = 0;
	for (const char of text) {
		if (char === " ") width++;
		else if (char === "\t") width += 2;
		else break;
	}
	return width;
}

function isBlank(text: string): boolean {
	return text.trim() === "";
}

interface Item {
	readonly indent: number;
	readonly ordered: boolean;
	readonly start: number;
	readonly content: string;
}

function readItem(text: string): Item | null {
	if (RULE.test(text)) return null;
	const match = ITEM.exec(text);
	if (match === null) return null;
	const number = match[3];
	return {
		indent: indentOf(match[1] ?? ""),
		ordered: number !== undefined,
		start: number === undefined ? 1 : Number(number),
		content: match[4] ?? "",
	};
}

function toLine(line: Line, content: string): MarkdownLine {
	return { line: line.line, content: parseInline(content.trim()) };
}

/** Whether a line starts a block, which ends the paragraph before it. */
function startsBlock(text: string): boolean {
	return (
		readFence(text) !== null ||
		HEADING.test(text) ||
		RULE.test(text) ||
		QUOTE.test(text) ||
		readItem(text) !== null
	);
}

class BlockReader {
	private index = 0;

	constructor(private readonly lines: readonly Line[]) {}

	readAll(): MarkdownBlock[] {
		const blocks: MarkdownBlock[] = [];
		while (this.index < this.lines.length) {
			const line = this.peek();
			if (line === undefined) break;
			if (isBlank(line.text)) {
				this.index++;
				continue;
			}
			blocks.push(this.readBlock(line));
		}
		return blocks;
	}

	private peek(offset = 0): Line | undefined {
		return this.lines[this.index + offset];
	}

	private readBlock(line: Line): MarkdownBlock {
		const { text } = line;
		const fence = readFence(text);
		if (fence !== null) {
			this.index++;
			const body: string[] = [];
			for (let next = this.peek(); next !== undefined; next = this.peek()) {
				this.index++;
				if (closesFence(fence, next.text.trimEnd())) break;
				body.push(next.text);
			}
			const info = text.trim().slice(fence.length).trim();
			return {
				kind: "code",
				language: info.split(/\s/)[0] ?? "",
				text: body.join("\n"),
				line: line.line,
			};
		}

		const heading = HEADING.exec(text);
		if (heading !== null) {
			this.index++;
			const level = (heading[1] ?? "#").length as 1 | 2 | 3 | 4 | 5 | 6;
			const content = (heading[2] ?? "").replace(HEADING_CLOSE, "");
			return { kind: "heading", level, line: toLine(line, content) };
		}

		if (RULE.test(text)) {
			this.index++;
			return { kind: "rule", line: line.line };
		}

		if (QUOTE.test(text)) {
			const quoted: Line[] = [];
			for (let next = this.peek(); next !== undefined; next = this.peek()) {
				if (!QUOTE.test(next.text)) break;
				quoted.push({ line: next.line, text: next.text.replace(QUOTE, "") });
				this.index++;
			}
			return { kind: "quote", children: new BlockReader(quoted).readAll() };
		}

		const item = readItem(text);
		if (item !== null) return this.readList(item);

		const lines: MarkdownLine[] = [];
		for (let next = this.peek(); next !== undefined; next = this.peek()) {
			if (isBlank(next.text)) break;
			if (lines.length > 0 && startsBlock(next.text)) break;
			lines.push(toLine(next, next.text));
			this.index++;
		}
		return { kind: "paragraph", lines };
	}

	/**
	 * Reads a list whose first item is the current line. Items of the same
	 * kind at the same indentation continue it, even after blank lines; deeper
	 * items nest; deeper lines that are not items continue the last item.
	 */
	private readList(first: Item): MarkdownBlock {
		const items: { lines: MarkdownLine[]; children: MarkdownBlock[] }[] = [];
		for (let line = this.peek(); line !== undefined; line = this.peek()) {
			if (isBlank(line.text)) {
				const next = this.nextFilled();
				if (next === undefined || indentOf(next.text) < first.indent) break;
				const item = readItem(next.text);
				const sibling =
					item !== null &&
					item.indent === first.indent &&
					item.ordered === first.ordered;
				if (!sibling && indentOf(next.text) <= first.indent) break;
				this.index++;
				continue;
			}
			const item = readItem(line.text);
			const last = items.at(-1);
			if (item !== null && item.indent <= first.indent) {
				if (item.ordered !== first.ordered || item.indent < first.indent) {
					break;
				}
				items.push({ lines: [toLine(line, item.content)], children: [] });
				this.index++;
			} else if (last !== undefined && item !== null) {
				last.children.push(this.readList(item));
			} else if (
				last !== undefined &&
				indentOf(line.text) > first.indent &&
				!startsBlock(line.text.trimStart())
			) {
				last.lines.push(toLine(line, line.text));
				this.index++;
			} else {
				break;
			}
		}
		return {
			kind: "list",
			ordered: first.ordered,
			start: first.start,
			items: items satisfies readonly MarkdownListItem[],
		};
	}

	private nextFilled(): Line | undefined {
		for (let offset = 1; ; offset++) {
			const line = this.peek(offset);
			if (line === undefined || !isBlank(line.text)) return line;
		}
	}
}

/** What {@link parseMarkdown} returns. */
export interface ParseMarkdownResult {
	readonly document: MarkdownDocument;
	/** `W307` and `W310` from the step annotations. */
	readonly diagnostics: readonly Diagnostic[];
}

/**
 * Reads Markdown lines into blocks: ATX headings (`#` to `######`),
 * paragraphs, bullet and ordered lists (nested by indentation), block quotes,
 * fenced code and horizontal rules, with {@link parseInline} inside.
 *
 * Step annotations are taken off the end of every line outside code fences,
 * the same lines the step plan reads them from. Raw HTML stays literal text.
 *
 * @param lines - The lines to read; each line's `text` is used.
 *
 * @example
 * ```ts
 * const { document } = parseMarkdown(node.lines);
 * document.annotated; // lines with `@n` or `→ id`, in order
 * ```
 */
export function parseMarkdown(
	lines: readonly SourceLine[],
	options: ExtractStepAnnotationsOptions = {},
): ParseMarkdownResult {
	const prepared: Line[] = [];
	const annotated: AnnotatedLine[] = [];
	const diagnostics: Diagnostic[] = [];
	let fence: ReturnType<typeof readFence> = null;
	for (const line of lines) {
		if (fence !== null) {
			if (closesFence(fence, line.text.trimEnd())) fence = null;
			prepared.push({ line: line.line, text: line.text });
			continue;
		}
		fence = readFence(line.text);
		if (fence !== null) {
			prepared.push({ line: line.line, text: line.text });
			continue;
		}
		const result = extractStepAnnotations(line, options);
		diagnostics.push(...result.diagnostics);
		if (result.annotation !== null) {
			annotated.push({ line: line.line, annotation: result.annotation });
		}
		prepared.push({ line: line.line, text: result.content });
	}
	const blocks = new BlockReader(prepared).readAll();
	return { document: { blocks, annotated }, diagnostics };
}
