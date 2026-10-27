// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type Animation,
	type AnimationOptions,
	type AnimationProps,
	type AnimationTarget,
	type Animator,
	createInstantAnimator,
	type Timeline,
} from "@addondeck/sdk";

/** An animator for tests whose animations run until the test ends them. */
export interface ManualAnimator extends Animator {
	/** Animations not ended yet. */
	readonly running: number;
	/** Ends every running animation, as if its time had passed. */
	endAll(): void;
}

/**
 * Creates an animator whose animations show nothing until they end, either
 * because the test calls {@link ManualAnimator.endAll} or because someone
 * calls `finish`. Ending one applies its final values with the instant
 * animator, so it looks exactly as a real one at its end.
 */
export function createManualAnimator(): ManualAnimator {
	const instant = createInstantAnimator();
	const running = new Set<() => void>();

	const pending = (apply: () => void): Animation => {
		let resolve: () => void = () => {};
		const finished = new Promise<void>((done) => {
			resolve = done;
		});
		let ended = false;
		const end = (): void => {
			if (ended) return;
			ended = true;
			running.delete(end);
			apply();
			resolve();
		};
		running.add(end);
		return {
			duration: 1000,
			get progress() {
				return ended ? 1 : 0;
			},
			finished,
			play() {},
			pause() {},
			seek() {},
			finish: end,
			cancel: end,
		};
	};

	return {
		get running() {
			return running.size;
		},
		endAll() {
			for (const end of [...running]) end();
		},
		animate(targets, props, options) {
			return pending(() => instant.animate(targets, props, options));
		},
		timeline() {
			const steps: Array<
				[AnimationTarget, AnimationProps, AnimationOptions | undefined]
			> = [];
			const animation = pending(() => {
				const timeline = instant.timeline();
				for (const [targets, props, options] of steps) {
					timeline.add(targets, props, options);
				}
			});
			const timeline: Timeline = {
				...animation,
				get progress() {
					return animation.progress;
				},
				add(targets, props, options) {
					steps.push([targets, props, options]);
					return timeline;
				},
			};
			return timeline;
		},
	};
}
