// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type Animator,
	createInstantAnimator,
	type MotionTokens,
	type Timeline,
} from "@addondeck/sdk";
import { createTimeline } from "animejs";
import { addAnimeStep } from "./add-anime-step";

/** Settings of {@link createAnimeAnimator}. */
export interface AnimeAnimatorOptions {
	/**
	 * The active motion personality. Animations without a duration take
	 * `duration.m`, and those without an easing take `easing.move`.
	 */
	readonly motion: MotionTokens;
}

/**
 * Wraps an anime.js timeline in the SDK interface.
 *
 * Every animation is an anime.js timeline, even a single `animate`, because a
 * step with `draw` needs two anime.js animations that are controlled as one.
 */
function createAnimeTimeline(motion: MotionTokens): Timeline {
	let resolve = (): void => {};
	const finished = new Promise<void>((settle) => {
		resolve = settle;
	});
	const anime = createTimeline({
		onComplete: () => resolve(),
		// anime.js cancels an animation when later ones replace all its
		// properties, and then never completes it.
		onPause: (self) => {
			if (self.cancelled) resolve();
		},
	});
	const timeline: Timeline = {
		get duration() {
			// Same as `duration` without loops, but anime.js stores an empty
			// `duration` as a tiny positive number.
			return anime.iterationDuration;
		},
		get progress() {
			return anime.progress;
		},
		finished,
		play() {
			if (!anime.completed) anime.resume();
		},
		pause() {
			anime.pause();
		},
		seek(time) {
			// anime.js keeps playing after a seek unless it was paused.
			anime.pause();
			anime.seek(time);
		},
		finish() {
			anime.complete();
			resolve();
		},
		cancel() {
			anime.cancel();
			resolve();
		},
		add(targets, props, options = {}) {
			addAnimeStep(anime, targets, props, options, motion);
			return timeline;
		},
	};
	return timeline;
}

/**
 * Creates an animator backed by anime.js v4.
 *
 * It plays with the main loop of anime.js, so animations pause while the page
 * is hidden. Durations and easings missing from an animation come from the
 * motion personality; create a new animator when the personality changes.
 *
 * @param options - The motion personality to use for defaults.
 * @returns An animator for the runtime to give to blocks.
 *
 * @example
 * ```ts
 * const animator = createAnimeAnimator({ motion });
 * await animator.animate(title, { opacity: [0, 1], y: [20, 0] }).finished;
 * ```
 */
export function createAnimeAnimator(options: AnimeAnimatorOptions): Animator {
	const { motion } = options;
	const instant = createInstantAnimator();
	return {
		animate(targets, props, animationOptions) {
			const animation = createAnimeTimeline(motion).add(
				targets,
				props,
				animationOptions,
			);
			if (animation.duration === 0) {
				// anime.js waits for the next frame even when there is nothing to
				// play, and completing it at once does not always render; the
				// instant animator leaves the same styles right now.
				animation.cancel();
				return instant.animate(targets, props, animationOptions);
			}
			return animation;
		},
		timeline() {
			return createAnimeTimeline(motion);
		},
	};
}
