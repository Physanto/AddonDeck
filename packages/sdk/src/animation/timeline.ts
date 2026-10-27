// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Animation } from "./animation";
import type { TimelineStepOptions } from "./animation-options";
import type { AnimationProps, AnimationTarget } from "./animation-props";

/**
 * Animations arranged in time and controlled as one.
 *
 * Steps are added right after creating the timeline, before awaiting anything,
 * because the timeline starts playing at once.
 *
 * @example
 * ```ts
 * const timeline = ctx.animator.timeline()
 *   .add(arrow, { x: [0, 600] })
 *   .add(label, { opacity: [0, 1] }, { at: 200 });
 * await timeline.finished;
 * ```
 */
export interface Timeline extends Animation {
	/**
	 * Adds a step to the timeline.
	 *
	 * @returns The same timeline, to chain more steps.
	 */
	add(
		targets: AnimationTarget,
		props: AnimationProps,
		options?: TimelineStepOptions,
	): Timeline;
}
