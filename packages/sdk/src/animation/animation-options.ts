// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DelayFunction } from "./animation-props";
import type { Easing } from "./easing";

/** How an animation runs. Missing values come from the deck's motion tokens. */
export interface AnimationOptions {
	/** Duration in milliseconds, without the delay. */
	readonly duration?: number;
	/** Delay before starting, in milliseconds, or one per target to stagger them. */
	readonly delay?: number | DelayFunction;
	/** Curve of the movement; usually one of `ctx.motion.easing`. */
	readonly easing?: Easing;
}

/** How a step of a timeline runs, and when it starts. */
export interface TimelineStepOptions extends AnimationOptions {
	/**
	 * Start time in milliseconds from the start of the timeline. By default the
	 * step starts when the previous one ends.
	 */
	readonly at?: number;
}
