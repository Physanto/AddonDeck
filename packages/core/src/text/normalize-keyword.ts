// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

const COMBINING_MARK = /\p{M}/gu;
const SEPARATOR = /[\s_]/g;

/**
 * Normalizes a keyword so that capitals and accents never matter.
 *
 * Decomposes the word (NFKD), removes combining marks, lowercases it, trims it
 * and replaces `_` and whitespace with `-`. Header keys, block keywords, option
 * keys, enumerated values and ids are all compared this way.
 *
 * @param word - The keyword as written.
 * @returns The normalized keyword.
 *
 * @example
 * ```ts
 * normalizeKeyword("Séquence"); // "sequence"
 * normalizeKeyword("Line of_time"); // "line-of-time"
 * ```
 */
export function normalizeKeyword(word: string): string {
	return word
		.normalize("NFKD")
		.replace(COMBINING_MARK, "")
		.toLowerCase()
		.trim()
		.replace(SEPARATOR, "-");
}
