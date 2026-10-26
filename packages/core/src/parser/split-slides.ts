// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "../model/source-line";

/** The lines between two separators, before they are read. */
export interface RawSlide {
	readonly lines: readonly SourceLine[];
	/** Line number where the slide starts, even when it has no lines. */
	readonly startLine: number;
	/** Whether this is the first or the last slide of the deck. */
	readonly edge: boolean;
}

const SEPARATOR = /^-{3,}$/;

/** Whether a line separates slides: three or more dashes, not indented, nothing else. */
export function isSeparator(line: string): boolean {
	return SEPARATOR.test(line.trimEnd());
}

/**
 * Splits the lines after the header into slides at every separator. A
 * separator always separates, even inside a Markdown fence, so an unclosed
 * fence can never swallow the rest of the deck.
 */
export function splitSlides(
	lines: readonly string[],
	start: number,
): readonly RawSlide[] {
	const chunks: { lines: SourceLine[]; startLine: number }[] = [];
	let current: SourceLine[] = [];
	let startLine = start + 1;
	for (let index = start; index < lines.length; index++) {
		const raw = lines[index] ?? "";
		if (isSeparator(raw)) {
			chunks.push({ lines: current, startLine });
			current = [];
			startLine = index + 2;
		} else {
			current.push({ line: index + 1, raw, text: raw });
		}
	}
	chunks.push({ lines: current, startLine });
	return chunks.map((chunk, index) => ({
		...chunk,
		edge: index === 0 || index === chunks.length - 1,
	}));
}
