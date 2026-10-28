// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockContext } from "../block/block-context";
import type { Animator } from "./animator";
import { stagger } from "./stagger";

/** How far below its place hidden content waits, in stage pixels. */
export const REVEAL_RISE = 24;

/**
 * Shows or hides elements at once, leaving the same styles as the end of
 * {@link playReveal}, so a block's `setState` and `play` agree.
 *
 * @example
 * ```ts
 * setState(step) {
 *   items.forEach((item, index) => setRevealed(ctx.animator, [item], index < step));
 * },
 * ```
 */
export function setRevealed(
	animator: Animator,
	targets: readonly Element[],
	revealed: boolean,
): void {
	if (targets.length === 0) return;
	animator.animate(
		targets,
		revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: REVEAL_RISE },
		{ duration: 0 },
	);
}

/**
 * Makes hidden elements appear, rising into place one after another, with
 * the deck's motion.
 *
 * @returns A promise that resolves when the last element is in place.
 */
export async function playReveal(
	ctx: Pick<BlockContext, "animator" | "motion">,
	targets: readonly Element[],
): Promise<void> {
	if (targets.length === 0) return;
	const { animator, motion } = ctx;
	await animator.animate(
		targets,
		{ opacity: [0, 1], y: [REVEAL_RISE, 0] },
		{
			duration: motion.duration.m,
			easing: motion.easing.enter,
			delay: stagger(motion.stagger),
		},
	).finished;
}
