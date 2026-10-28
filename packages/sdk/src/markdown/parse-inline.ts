// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { InlineNode } from "./markdown-node";
import { safeHref } from "./safe-href";

const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
const WORD = /[\p{L}\p{N}]/u;

function isSpace(char: string | undefined): boolean {
	return char === undefined || /\s/.test(char);
}

function runLength(text: string, start: number): number {
	const char = text[start];
	let end = start;
	while (text[end] === char) end++;
	return end - start;
}

/** End of the code span opened by the backtick run at `start`, or -1. */
function codeSpanEnd(text: string, start: number): number {
	const length = runLength(text, start);
	let index = start + length;
	while (index < text.length) {
		if (text[index] === "`") {
			const closing = runLength(text, index);
			if (closing === length) return index;
			index += closing;
		} else {
			index++;
		}
	}
	return -1;
}

/**
 * Index after the construct that starts at `index` and must be skipped whole
 * while looking for a closing delimiter: an escape or a code span.
 */
function skip(text: string, index: number): number {
	const char = text[index];
	if (char === "\\" && ESCAPABLE.test(text[index + 1] ?? "")) return index + 2;
	if (char === "`") {
		const end = codeSpanEnd(text, index);
		if (end >= 0) return end + runLength(text, end);
		return index + runLength(text, index);
	}
	return index + 1;
}

/** Index of the `]` that closes the `[` at `start`, or -1. */
function closingBracket(text: string, start: number): number {
	let depth = 0;
	let index = start;
	while (index < text.length) {
		const char = text[index];
		if (char === "[") depth++;
		if (char === "]" && --depth === 0) return index;
		index = skip(text, index);
	}
	return -1;
}

interface LinkMatch {
	readonly label: string;
	readonly href: string;
	readonly end: number;
}

/** Reads `[label](destination "title")` at `start`; the title is dropped. */
function readLink(text: string, start: number): LinkMatch | null {
	const close = closingBracket(text, start);
	if (close < 0 || text[close + 1] !== "(") return null;
	let index = close + 2;
	while (text[index] === " ") index++;
	let href: string;
	if (text[index] === "<") {
		const end = text.indexOf(">", index);
		if (end < 0) return null;
		href = text.slice(index + 1, end);
		index = end + 1;
	} else {
		const from = index;
		let depth = 0;
		while (index < text.length && !isSpace(text[index])) {
			if (text[index] === "(") depth++;
			if (text[index] === ")" && depth-- === 0) break;
			index++;
		}
		href = text.slice(from, index);
	}
	while (text[index] === " ") index++;
	const quote = text[index];
	if (quote === '"' || quote === "'") {
		const end = text.indexOf(quote, index + 1);
		if (end < 0) return null;
		index = end + 1;
		while (text[index] === " ") index++;
	}
	if (text[index] !== ")") return null;
	return { label: text.slice(start + 1, close), href, end: index + 1 };
}

function canOpen(text: string, start: number, length: number): boolean {
	const char = text[start];
	const after = text[start + length];
	if (isSpace(after)) return false;
	return char !== "_" || !WORD.test(text[start - 1] ?? "");
}

function canClose(text: string, start: number, length: number): boolean {
	const char = text[start];
	if (isSpace(text[start - 1])) return false;
	return char !== "_" || !WORD.test(text[start + length] ?? "");
}

/**
 * Finds the delimiters that close emphasis opened by the run at `start`.
 * Strong text (two delimiters) skips single ones, so `**a *b* c**` closes at
 * the end; a longer closing run closes with its last delimiters.
 *
 * @returns The index of the closing delimiters, or -1.
 */
function closingDelimiter(text: string, start: number, size: number): number {
	const char = text[start];
	const from = start + runLength(text, start);
	let index = from;
	while (index < text.length) {
		if (text[index] !== char) {
			index = skip(text, index);
			continue;
		}
		const length = runLength(text, index);
		const fits = size === 1 ? length === 1 : length >= size;
		if (fits && index > from && canClose(text, index, length)) {
			return index + length - size;
		}
		index += length;
	}
	return -1;
}

function emphasis(size: number, children: InlineNode[]): InlineNode {
	if (size === 1) return { kind: "emphasis", children };
	const strong: InlineNode = { kind: "strong", children };
	return size === 2 ? strong : { kind: "emphasis", children: [strong] };
}

/**
 * Reads inline Markdown: strong text (`**`, `__`), emphasis (`*`, `_`),
 * inline code, links and backslash escapes.
 *
 * Anything else is text, including HTML tags, which stay literal. Images
 * (`![alt](src)`) are not supported and stay literal too. A link to an
 * address other than `http`, `https`, `mailto` or a `#` fragment keeps its
 * label as text.
 *
 * @example
 * ```ts
 * parseInline("Read **the docs**");
 * // [{ kind: "text", text: "Read " }, { kind: "strong", children: [{ kind: "text", text: "the docs" }] }]
 * ```
 */
export function parseInline(text: string): InlineNode[] {
	const nodes: InlineNode[] = [];
	let buffer = "";
	const flush = (): void => {
		if (buffer !== "") nodes.push({ kind: "text", text: buffer });
		buffer = "";
	};

	let index = 0;
	while (index < text.length) {
		const char = text[index] ?? "";
		const next = text[index + 1] ?? "";

		if (char === "\\" && ESCAPABLE.test(next)) {
			buffer += next;
			index += 2;
			continue;
		}

		if (char === "`") {
			const length = runLength(text, index);
			const end = codeSpanEnd(text, index);
			if (end < 0) {
				buffer += text.slice(index, index + length);
				index += length;
				continue;
			}
			let code = text.slice(index + length, end);
			if (code.length > 2 && code.startsWith(" ") && code.endsWith(" ")) {
				code = code.slice(1, -1);
			}
			flush();
			nodes.push({ kind: "code", text: code });
			index = end + length;
			continue;
		}

		if (char === "!" && next === "[") {
			const link = readLink(text, index + 1);
			const end = link === null ? index + 2 : link.end;
			buffer += text.slice(index, end);
			index = end;
			continue;
		}

		if (char === "[") {
			const link = readLink(text, index);
			if (link !== null) {
				flush();
				const children = parseInline(link.label);
				const href = safeHref(link.href);
				if (href === null) nodes.push(...children);
				else nodes.push({ kind: "link", href, children });
				index = link.end;
				continue;
			}
		}

		if (char === "*" || char === "_") {
			const start = index;
			const length = runLength(text, index);
			if (canOpen(text, index, length)) {
				for (let size = Math.min(length, 3); size > 0; size--) {
					const close = closingDelimiter(text, index, size);
					if (close < 0) continue;
					buffer += text.slice(index, index + length - size);
					flush();
					nodes.push(
						emphasis(size, parseInline(text.slice(index + length, close))),
					);
					index = close + size;
					break;
				}
				if (index !== start) continue;
			}
			buffer += text.slice(index, index + length);
			index += length;
			continue;
		}

		buffer += char;
		index++;
	}
	flush();
	return nodes;
}
