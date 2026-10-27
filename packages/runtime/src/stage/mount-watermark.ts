// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Adds the small "Made with AddonDeck" badge to a corner of the stage.
 *
 * It sits inside the slides' padding, where blocks never draw, so it covers
 * no content; it ignores the pointer, so clicking it still moves forward.
 * Decks turn it off with `watermark: off`.
 *
 * @param label - The badge text, from the text catalog.
 */
export function mountWatermark(stage: HTMLElement, label: string): HTMLElement {
	const badge = stage.ownerDocument.createElement("div");
	badge.className = "adk-watermark";
	badge.textContent = label;
	stage.append(badge);
	return badge;
}
