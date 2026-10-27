// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckPosition } from "./deck-position";

const HASH = /^#\/([1-9]\d*)(?:\/([1-9]\d*))?\/?$/;

/**
 * Reads a position from the address hash, `#/slide/step`, both counted from 1.
 *
 * Step 1 is the slide before any click and can be left out: `#/3` and `#/3/1`
 * are the same position. The hash only changes inside the page, so it also
 * works for a file opened from the disk.
 *
 * @returns The position, counted from 0, or `null` when the hash is not one.
 *
 * @example
 * ```ts
 * parseDeckHash("#/3/2"); // { slide: 2, step: 1 }
 * parseDeckHash("#notes"); // null
 * ```
 */
export function parseDeckHash(hash: string): DeckPosition | null {
	const match = HASH.exec(hash);
	if (match === null) return null;
	return {
		slide: Number(match[1]) - 1,
		step: match[2] === undefined ? 0 : Number(match[2]) - 1,
	};
}

/**
 * Writes a position as an address hash, the inverse of {@link parseDeckHash}.
 * The step is left out at the start of a slide.
 *
 * @example
 * ```ts
 * formatDeckHash({ slide: 2, step: 0 }); // "#/3"
 * formatDeckHash({ slide: 2, step: 1 }); // "#/3/2"
 * ```
 */
export function formatDeckHash(position: DeckPosition): string {
	const slide = `#/${position.slide + 1}`;
	return position.step === 0 ? slide : `${slide}/${position.step + 1}`;
}
