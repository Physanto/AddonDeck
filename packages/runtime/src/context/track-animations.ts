// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Animation, Animator } from "@addondeck/sdk";

/** An animator that remembers the animations still running. */
export interface TrackedAnimator {
	readonly animator: Animator;
	/** Jumps every running animation to its end. */
	finishAll(): void;
}

/**
 * Wraps the animator of the moment so the runtime can end a block's
 * animations at once when the presenter clicks again.
 *
 * @param current - Returns the animator to use; it is read on every call, so
 * a new motion personality applies to the next animation.
 */
export function trackAnimations(current: () => Animator): TrackedAnimator {
	const running = new Set<Animation>();
	const track = <A extends Animation>(animation: A): A => {
		running.add(animation);
		void animation.finished.then(() => running.delete(animation));
		return animation;
	};
	return {
		animator: {
			animate: (targets, props, options) =>
				track(current().animate(targets, props, options)),
			timeline: () => track(current().timeline()),
		},
		finishAll() {
			for (const animation of [...running]) animation.finish();
			running.clear();
		},
	};
}
