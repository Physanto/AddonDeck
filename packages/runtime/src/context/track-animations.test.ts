// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import type { Animation, Animator, Timeline } from "@addondeck/sdk";
import { describe, expect, it, vi } from "vitest";
import { trackAnimations } from "./track-animations";

/** An animation that runs until finished, and tells whether it was. */
function pendingAnimation(): Animation & { readonly ended: () => void } {
	let end: () => void = () => {};
	const finished = new Promise<void>((resolve) => {
		end = resolve;
	});
	return {
		duration: 100,
		progress: 0,
		finished,
		play() {},
		pause() {},
		seek() {},
		finish: vi.fn(() => end()),
		cancel() {},
		ended: () => end(),
	};
}

function fakeAnimator(made: Animation[]): Animator {
	return {
		animate() {
			const animation = pendingAnimation();
			made.push(animation);
			return animation;
		},
		timeline() {
			const timeline = {
				...pendingAnimation(),
				add: () => timeline,
			} as Timeline;
			made.push(timeline);
			return timeline;
		},
	};
}

describe("trackAnimations", () => {
	it("finishes the animations and timelines still running", () => {
		const made: Animation[] = [];
		const tracked = trackAnimations(() => fakeAnimator(made));
		const element = document.createElement("div");
		tracked.animator.animate(element, { opacity: [0, 1] });
		tracked.animator.timeline().add(element, { x: [0, 10] });
		tracked.finishAll();
		expect(made).toHaveLength(2);
		for (const animation of made) {
			expect(animation.finish).toHaveBeenCalledOnce();
		}
	});

	it("forgets the animations that already ended", async () => {
		const made: Animation[] = [];
		const tracked = trackAnimations(() => fakeAnimator(made));
		const animation = tracked.animator.animate(document.createElement("div"), {
			opacity: [0, 1],
		}) as ReturnType<typeof pendingAnimation>;
		animation.ended();
		await animation.finished;
		await Promise.resolve();
		tracked.finishAll();
		expect(animation.finish).not.toHaveBeenCalled();
	});

	it("reads the animator again for every animation", () => {
		const first: Animation[] = [];
		const second: Animation[] = [];
		let current = fakeAnimator(first);
		const tracked = trackAnimations(() => current);
		const element = document.createElement("div");
		tracked.animator.animate(element, { opacity: 1 });
		current = fakeAnimator(second);
		tracked.animator.animate(element, { opacity: 1 });
		expect([first.length, second.length]).toEqual([1, 1]);
	});
});
