// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Edit distance between two strings: the fewest insertions, deletions and
 * substitutions of UTF-16 code units that turn `a` into `b`.
 */
export function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const substitution = a[i - 1] === b[j - 1] ? 0 : 1;
			current[j] = Math.min(
				(previous[j] ?? 0) + 1,
				(current[j - 1] ?? 0) + 1,
				(previous[j - 1] ?? 0) + substitution,
			);
		}
		previous = current;
	}
	return previous[b.length] ?? 0;
}
