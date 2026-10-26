// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { isIndented } from "../text/indentation";
import { normalizeKeyword } from "../text/normalize-keyword";

/** A line shaped like `word: value`, as used by the header and the directives. */
export interface KeyValueLine {
	/** The word before the colon, as written. */
	readonly keyword: string;
	/** The normalized word. */
	readonly key: string;
	/** Everything after the colon, trimmed. */
	readonly value: string;
	/** Column where the value starts, or just after the colon when it is empty. */
	readonly valueColumn: number;
}

/**
 * Reads a `word: value` line. Returns `null` when the line is indented or the
 * part before the first colon is not a single word.
 */
export function readKeyValueLine(line: string): KeyValueLine | null {
	if (isIndented(line)) return null;
	const colon = line.indexOf(":");
	if (colon === -1) return null;
	const keyword = line.slice(0, colon).trim();
	if (keyword === "" || /\s/.test(keyword)) return null;

	const after = line.slice(colon + 1);
	const leading = after.length - after.trimStart().length;
	return {
		keyword,
		key: normalizeKeyword(keyword),
		value: after.trim(),
		valueColumn: colon + 1 + leading + 1,
	};
}
