// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Easing } from "../animation/easing";

/**
 * The active motion personality: how long and with which curves things move.
 *
 * Blocks take durations and easings from here instead of writing them, so the
 * whole deck moves alike. With reduced motion, the runtime gives the `minimal`
 * personality.
 *
 * @example
 * ```ts
 * ctx.animator.animate(item, { opacity: [0, 1] }, {
 *   duration: ctx.motion.duration.m,
 *   easing: ctx.motion.easing.enter,
 * });
 * ```
 */
export interface MotionTokens {
	/** Personality id, such as `smooth`. */
	readonly id: string;
	/** Durations in milliseconds, from extra short to long. */
	readonly duration: {
		readonly xs: number;
		readonly s: number;
		readonly m: number;
		readonly l: number;
	};
	/** Curves by purpose. */
	readonly easing: {
		/** For things that appear. */
		readonly enter: Easing;
		/** For things that leave. */
		readonly exit: Easing;
		/** For things that move or change. */
		readonly move: Easing;
	};
	/** Milliseconds between consecutive items of a staggered animation. */
	readonly stagger: number;
	/** How much movements go past their end before settling, from 0 (none) to 1. */
	readonly overshoot: number;
}
