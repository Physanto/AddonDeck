// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * The stage slides are drawn on: a logical canvas, 1920×1080 by default,
 * scaled to fit the screen.
 *
 * Blocks lay themselves out in stage pixels; `scale` converts them to screen
 * pixels, for example to measure the pointer.
 */
export interface StageInfo {
	/** Logical width in stage pixels. */
	readonly width: number;
	/** Logical height in stage pixels. */
	readonly height: number;
	/** Screen pixels per stage pixel. */
	readonly scale: number;
}
