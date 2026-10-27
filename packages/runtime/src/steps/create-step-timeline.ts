// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StepAdvance, StepClick } from "@addondeck/core";
import type { BlockInstance } from "@addondeck/sdk";
import { stepStates } from "./step-states";

/** A block the timeline moves, with a way to end its animations at once. */
export interface TimelineBlock {
	readonly instance: BlockInstance;
	/** Jumps the block's running animations to their end. */
	finishAnimations(): void;
}

/** What {@link createStepTimeline} needs. */
export interface StepTimelineOptions {
	/** The slide's step plan. */
	readonly clicks: readonly StepClick[];
	/** The mounted blocks, by index in `slide.content`. Content without a block is skipped. */
	readonly blocks: ReadonlyMap<number, TimelineBlock>;
	/** Called when a block throws or rejects while changing step; the slide goes on. */
	readonly fail: (node: number, step: number, thrown: unknown) => void;
}

/** The clicks of one slide, played on its blocks. */
export interface StepTimeline {
	/** Clicks shown, from 0 to the number of clicks. */
	readonly step: number;
	/** Whether a click is still animating. */
	readonly playing: boolean;
	/**
	 * Shows the slide after `step` clicks. The next click animates; any other
	 * step is shown at once. A click still animating is finished first.
	 */
	goTo(step: number): void;
	/** Shows the slide after `step` clicks at once, even the next one. */
	jumpTo(step: number): void;
	/** Finishes the click being animated at once, leaving it complete. */
	settle(): void;
}

/**
 * Creates the timeline of a slide whose blocks were just mounted, at step 0.
 *
 * A click plays `play(from, to)` on every block that advances in it, at the
 * same time. When the presenter clicks again before it ends, its animations
 * jump to their end and each block is set to the click's state, so the next
 * click always starts from where the plan says. A late `play` that resolves
 * after that is ignored.
 *
 * @example
 * ```ts
 * const timeline = createStepTimeline({ clicks: plan.clicks, blocks, fail });
 * timeline.goTo(1); // animates the first click
 * timeline.goTo(3); // finishes it and shows the third click at once
 * ```
 */
export function createStepTimeline(options: StepTimelineOptions): StepTimeline {
	const { clicks, blocks, fail } = options;
	let step = 0;
	let running: StepClick | null = null;
	// Each click played or settled gets a new generation, so the end of an
	// older one cannot clear the running click.
	let generation = 0;

	const clamp = (target: number): number =>
		Number.isInteger(target) ? Math.min(Math.max(target, 0), clicks.length) : 0;

	const setState = (node: number, to: number): void => {
		const block = blocks.get(node);
		if (block === undefined) return;
		try {
			block.instance.setState(to);
		} catch (thrown) {
			fail(node, to, thrown);
		}
	};

	const playAdvance = (
		advance: StepAdvance,
		current: number,
	): Promise<void> => {
		const block = blocks.get(advance.node);
		if (block === undefined) return Promise.resolve();
		const recover = (thrown: unknown): void => {
			fail(advance.node, advance.to, thrown);
			if (current === generation) setState(advance.node, advance.to);
		};
		try {
			return Promise.resolve(
				block.instance.play(advance.from, advance.to),
			).catch(recover);
		} catch (thrown) {
			recover(thrown);
			return Promise.resolve();
		}
	};

	const settle = (): void => {
		if (running === null) return;
		const click = running;
		running = null;
		generation++;
		for (const advance of click) {
			blocks.get(advance.node)?.finishAnimations();
			setState(advance.node, advance.to);
		}
	};

	const jumpTo = (target: number): void => {
		settle();
		step = clamp(target);
		for (const [node, state] of stepStates(clicks, step)) setState(node, state);
	};

	return {
		get step() {
			return step;
		},
		get playing() {
			return running !== null;
		},
		goTo(target) {
			settle();
			const next = clamp(target);
			const click = clicks[step];
			if (next !== step + 1 || click === undefined) {
				if (next !== step) jumpTo(next);
				return;
			}
			step = next;
			running = click;
			const current = ++generation;
			void Promise.all(
				click.map((advance) => playAdvance(advance, current)),
			).then(() => {
				if (current === generation) running = null;
			});
		},
		jumpTo,
		settle,
	};
}
