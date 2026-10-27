// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DelayFunction } from "./animation-props";

/** Where a staggered animation starts. */
export type StaggerFrom = "first" | "last" | "center";

/**
 * A delay that grows from one target to the next.
 *
 * @param step - Milliseconds between two consecutive targets, usually `ctx.motion.stagger`.
 * @param from - Which target starts first.
 * @returns A delay for the `delay` option of an animation.
 *
 * @example
 * ```ts
 * ctx.animator.animate(items, { opacity: [0, 1] }, { delay: stagger(ctx.motion.stagger) });
 * ```
 */
export function stagger(
	step: number,
	from: StaggerFrom = "first",
): DelayFunction {
	return (index, count) => {
		if (from === "last") return (count - 1 - index) * step;
		if (from === "center") return Math.abs(index - (count - 1) / 2) * step;
		return index * step;
	};
}
