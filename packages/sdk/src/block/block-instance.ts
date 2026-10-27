// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Box } from "./box";

/**
 * A block drawn on a slide, as {@link BlockView.mount} returns it.
 *
 * Steps count the block's own steps, from 0 (nothing played) to the number of
 * steps its definition offers. The runtime decides when each one plays, from
 * the slide's step plan. The block contract suite checks every rule below.
 */
export interface BlockInstance {
	/**
	 * Shows the block as it is after `step` steps, without animating.
	 *
	 * Idempotent: calling it twice gives the same result. It must work in any
	 * direction, so going back from step 5 to step 2 shows exactly step 2.
	 */
	setState(step: number): void;
	/**
	 * Animates from step `from` to step `to`, usually `from + 1`.
	 *
	 * When the returned promise resolves, the block must look exactly as after
	 * `setState(to)`. The runtime only calls it after `setState(from)` or a
	 * previous `play` that ended at `from`.
	 */
	play(from: number, to: number): Promise<void>;
	/** Adapts the block to a new size of its area, when it lays itself out. */
	resize?(box: Box): void;
	/**
	 * Removes everything the block created: its nodes, its event listeners,
	 * its timers and its subscriptions. The instance is not used afterwards.
	 */
	destroy(): void;
}
