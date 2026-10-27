// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StepClick } from "@addondeck/core";
import { describe, expect, it, vi } from "vitest";
import {
	createStepTimeline,
	type StepTimeline,
	type TimelineBlock,
} from "./create-step-timeline";

/**
 * A block that records what the timeline asks of it. Each `play` waits until
 * the test ends it, as a real animation would, unless `instant` is set.
 */
function fakeBlock(name: string, log: string[], instant = false) {
	let state = 0;
	const pending: Array<() => void> = [];
	const block: TimelineBlock = {
		instance: {
			setState(step) {
				state = step;
				log.push(`${name}.set(${step})`);
			},
			play(from, to) {
				log.push(`${name}.play(${from},${to})`);
				if (instant) {
					state = to;
					return Promise.resolve();
				}
				return new Promise((resolve) => {
					pending.push(() => {
						state = to;
						resolve();
					});
				});
			},
			destroy() {},
		},
		finishAnimations: vi.fn(() => {
			log.push(`${name}.finish`);
		}),
	};
	return {
		block,
		state: () => state,
		/** Ends every `play` started so far. */
		end() {
			for (const resolve of pending.splice(0)) resolve();
		},
		/** Ends the oldest `play` still waiting. */
		endOldest() {
			pending.shift()?.();
		},
	};
}

// Three clicks: a advances twice, b once together with a and once alone.
const CLICKS: readonly StepClick[] = [
	[{ node: 0, from: 0, to: 1 }],
	[
		{ node: 0, from: 1, to: 2 },
		{ node: 1, from: 0, to: 1 },
	],
	[{ node: 1, from: 1, to: 2 }],
];

function setup(options: { instant?: boolean } = {}) {
	const log: string[] = [];
	const a = fakeBlock("a", log, options.instant);
	const b = fakeBlock("b", log, options.instant);
	const failures: Array<[number, number, unknown]> = [];
	const timeline = createStepTimeline({
		clicks: CLICKS,
		blocks: new Map([
			[0, a.block],
			[1, b.block],
		]),
		fail: (node, step, thrown) => failures.push([node, step, thrown]),
	});
	return { timeline, log, a, b, failures };
}

/** Lets pending promise callbacks run. */
async function flush(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

function states(...blocks: Array<{ state: () => number }>): number[] {
	return blocks.map((block) => block.state());
}

describe("createStepTimeline", () => {
	it("starts at step 0 without touching the blocks", () => {
		const { timeline, log } = setup();
		expect(timeline.step).toBe(0);
		expect(timeline.playing).toBe(false);
		expect(log).toEqual([]);
	});

	it("animates the next click on every block that advances in it", async () => {
		const { timeline, log, a, b } = setup();
		timeline.goTo(1);
		a.end();
		await flush();
		timeline.goTo(2);
		expect(log).toEqual(["a.play(0,1)", "a.play(1,2)", "b.play(0,1)"]);
		expect(timeline.step).toBe(2);
		expect(timeline.playing).toBe(true);
		a.end();
		b.end();
		await flush();
		expect(timeline.playing).toBe(false);
		expect(states(a, b)).toEqual([2, 1]);
	});

	it("shows any other step at once, in either direction", () => {
		const { timeline, log, a, b } = setup();
		timeline.goTo(3);
		expect(log).toEqual(["a.set(2)", "b.set(2)"]);
		log.length = 0;
		timeline.goTo(1);
		expect(log).toEqual(["a.set(1)", "b.set(0)"]);
		expect(states(a, b)).toEqual([1, 0]);
		expect(timeline.playing).toBe(false);
	});

	it("shows even the next click at once when asked to jump", () => {
		const { timeline, log } = setup();
		timeline.jumpTo(1);
		expect(log).toEqual(["a.set(1)", "b.set(0)"]);
		expect(timeline.step).toBe(1);
	});

	it("clamps the step to the clicks of the slide", () => {
		const { timeline } = setup();
		timeline.goTo(9);
		expect(timeline.step).toBe(3);
		timeline.goTo(-2);
		expect(timeline.step).toBe(0);
		timeline.goTo(1.5);
		expect(timeline.step).toBe(0);
	});

	it("does nothing when asked for the step it shows", () => {
		const { timeline, log } = setup();
		timeline.goTo(0);
		timeline.jumpTo(0);
		expect(log).toEqual(["a.set(0)", "b.set(0)"]);
		log.length = 0;
		timeline.goTo(0);
		expect(log).toEqual([]);
	});

	describe("with fast clicks", () => {
		it("finishes the click still animating and plays the next one", async () => {
			const { timeline, log, a, b } = setup();
			timeline.goTo(1);
			timeline.goTo(2);
			expect(log).toEqual([
				"a.play(0,1)",
				"a.finish",
				"a.set(1)",
				"a.play(1,2)",
				"b.play(0,1)",
			]);
			expect(a.block.finishAnimations).toHaveBeenCalledOnce();
			expect(b.block.finishAnimations).not.toHaveBeenCalled();
			a.end();
			b.end();
			await flush();
			expect(states(a, b)).toEqual([2, 1]);
		});

		it("ends in the same state as clicking slowly, however fast the clicks come", async () => {
			const slow = setup({ instant: true });
			for (const step of [1, 2, 3]) {
				slow.timeline.goTo(step);
				await flush();
			}
			const fast = setup();
			fast.timeline.goTo(1);
			fast.timeline.goTo(2);
			fast.timeline.goTo(3);
			fast.a.end();
			fast.b.end();
			await flush();
			expect(states(fast.a, fast.b)).toEqual(states(slow.a, slow.b));
			expect(fast.timeline.step).toBe(3);
			expect(fast.timeline.playing).toBe(false);
		});

		it("ignores a play that ends after its click was finished", async () => {
			const { timeline, a, b } = setup();
			timeline.goTo(1);
			timeline.goTo(2);
			// The first play of a ends now, while the second click animates.
			a.endOldest();
			await flush();
			expect(timeline.playing).toBe(true);
			a.end();
			b.end();
			await flush();
			expect(timeline.playing).toBe(false);
		});

		it("finishes the click still animating before going back", () => {
			const { timeline, log, a, b } = setup();
			timeline.goTo(1);
			timeline.goTo(0);
			expect(log).toEqual([
				"a.play(0,1)",
				"a.finish",
				"a.set(1)",
				"a.set(0)",
				"b.set(0)",
			]);
			expect(states(a, b)).toEqual([0, 0]);
		});

		it("leaves the click complete when settled", () => {
			const { timeline, a } = setup();
			timeline.goTo(1);
			timeline.settle();
			expect(timeline.playing).toBe(false);
			expect(a.state()).toBe(1);
			timeline.settle();
			expect(a.block.finishAnimations).toHaveBeenCalledOnce();
		});
	});

	describe("with a failing block", () => {
		it("reports a play that throws and shows the click's state", () => {
			const { timeline, a, failures } = setup();
			const error = new Error("broken");
			a.block.instance.play = () => {
				throw error;
			};
			timeline.goTo(1);
			expect(failures).toEqual([[0, 1, error]]);
			expect(a.state()).toBe(1);
		});

		it("reports a play that rejects and shows the click's state", async () => {
			const { timeline, a, failures } = setup();
			const error = new Error("rejected");
			a.block.instance.play = () => Promise.reject(error);
			timeline.goTo(1);
			await flush();
			expect(failures).toEqual([[0, 1, error]]);
			expect(a.state()).toBe(1);
			expect(timeline.playing).toBe(false);
		});

		it("does not let a late rejection undo a later step", async () => {
			const { timeline, a, failures } = setup();
			let reject: (error: Error) => void = () => {};
			a.block.instance.play = () =>
				new Promise((_, fail) => {
					reject = fail;
				});
			timeline.goTo(1);
			timeline.goTo(3);
			reject(new Error("late"));
			await flush();
			expect(failures).toHaveLength(1);
			expect(a.state()).toBe(2);
		});

		it("reports a setState that throws and goes on with the others", () => {
			const { timeline, a, b, failures } = setup();
			a.block.instance.setState = () => {
				throw new Error("cannot");
			};
			timeline.goTo(3);
			expect(failures).toEqual([[0, 2, new Error("cannot")]]);
			expect(b.state()).toBe(2);
		});
	});

	it("skips content that has no block", () => {
		const log: string[] = [];
		const a = fakeBlock("a", log, true);
		const timeline: StepTimeline = createStepTimeline({
			clicks: [[{ node: 5, from: 0, to: 1 }], [{ node: 0, from: 0, to: 1 }]],
			blocks: new Map([[0, a.block]]),
			fail: () => {},
		});
		timeline.goTo(1);
		timeline.goTo(2);
		expect(log).toEqual(["a.play(0,1)"]);
	});
});
