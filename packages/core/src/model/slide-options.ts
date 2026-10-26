// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** How a slide enters the screen. */
export type SlideTransition = "none" | "fade" | "slide" | "zoom";

/** How the blocks of a slide are arranged. */
export type SlideLayout = "auto" | "columns" | "rows";

/** Options of one slide, from its `slide:` directive, with defaults applied. */
export interface SlideOptions {
	/** Background name or color, or `null` to use the deck background. */
	readonly background: string | null;
	readonly transition: SlideTransition;
	readonly layout: SlideLayout;
}
