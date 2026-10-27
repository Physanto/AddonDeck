// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "../diagnostics/diagnostic";

/**
 * One piece of slide content moving forward in a click.
 *
 * `from` and `to` count the content's own steps, so a block instance plays the
 * click with `play(from, to)` and jumps to it with `setState(to)`.
 */
export interface StepAdvance {
	/** Index of the text or block in `slide.content`. */
	readonly node: number;
	/** Steps of the node already played before the click. */
	readonly from: number;
	/** Steps of the node played after the click; at least `from + 1`. */
	readonly to: number;
}

/** Everything that moves forward in one click, in order of appearance. */
export type StepClick = readonly StepAdvance[];

/**
 * The step plan of a slide: which content advances in each click.
 *
 * Content that advances in no click is shown in its initial state, step 0,
 * for the whole slide.
 */
export interface StepPlan {
	/** `clicks[0]` is the first click of the slide. Empty when the slide has no steps. */
	readonly clicks: readonly StepClick[];
	/** `E201`, `E204` and `W315`, sorted by position. */
	readonly diagnostics: readonly Diagnostic[];
}
