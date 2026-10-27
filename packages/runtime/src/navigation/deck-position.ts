// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Where the presentation is: a slide and how many of its clicks were played. */
export interface DeckPosition {
	/** Index of the slide, starting at 0. */
	readonly slide: number;
	/** Clicks of the slide already played, from 0 to the number of clicks it has. */
	readonly step: number;
}

/** Whether two positions are the same. */
export function samePosition(a: DeckPosition, b: DeckPosition): boolean {
	return a.slide === b.slide && a.step === b.step;
}
