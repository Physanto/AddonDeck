// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Deck } from "@addondeck/core";

/**
 * The index of the slide a source line belongs to: the last slide that starts
 * at or before it. Lines before the first slide, such as the header, belong
 * to the first one.
 */
export function slideAtLine(deck: Deck, line: number): number {
	let index = 0;
	for (const slide of deck.slides) {
		if (slide.location.line > line) break;
		index = slide.index;
	}
	return index;
}
