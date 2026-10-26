// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { levenshtein } from "./levenshtein";
import { normalizeKeyword } from "./normalize-keyword";

/** Farthest a keyword may be from a known one, in edits, to suggest it. */
export const MAX_SUGGESTION_DISTANCE = 2;

/**
 * Finds the known keyword closest to a word, to offer it as a suggestion.
 *
 * The word is normalized before comparing. Ties go to the candidate listed
 * first, so the result never depends on anything but the arguments.
 *
 * @param word - The word as written.
 * @param candidates - Known keywords, already normalized.
 * @param maxDistance - Largest edit distance accepted.
 * @returns The closest candidate, or `null` when none is close enough.
 *
 * @example
 * ```ts
 * closestKeyword("Secuence", ["sequence", "graph"]); // "sequence"
 * closestKeyword("steps", ["sequence", "graph"]); // null
 * ```
 */
export function closestKeyword(
	word: string,
	candidates: readonly string[],
	maxDistance: number = MAX_SUGGESTION_DISTANCE,
): string | null {
	const normalized = normalizeKeyword(word);
	let best: string | null = null;
	let bestDistance = maxDistance + 1;
	for (const candidate of candidates) {
		if (Math.abs(candidate.length - normalized.length) >= bestDistance) {
			continue;
		}
		const distance = levenshtein(normalized, candidate);
		if (distance < bestDistance) {
			best = candidate;
			bestDistance = distance;
		}
	}
	return best;
}
