// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Animation } from "./animation";
import type { AnimationOptions } from "./animation-options";
import type { AnimationProps, AnimationTarget } from "./animation-props";
import type { Timeline } from "./timeline";

/**
 * Animates elements without depending on an animation library.
 *
 * Blocks and the runtime only use this interface; an adapter implements it
 * with a real library, so changing the library never touches a block.
 * {@link createInstantAnimator} implements it without a library, applying the
 * final values at once.
 *
 * @example
 * ```ts
 * play: async (from, to) => {
 *   await ctx.animator.animate(items[from], { opacity: [0, 1], y: [20, 0] }).finished;
 * },
 * ```
 */
export interface Animator {
	/** Starts animating the targets towards the given values. */
	animate(
		targets: AnimationTarget,
		props: AnimationProps,
		options?: AnimationOptions,
	): Animation;
	/** Creates an empty timeline that plays the steps added to it. */
	timeline(): Timeline;
}
