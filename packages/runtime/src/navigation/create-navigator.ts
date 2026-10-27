// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Unsubscribe } from "@addondeck/sdk";
import { type DeckPosition, samePosition } from "./deck-position";

/** Called after the position changes. */
export type PositionListener = (
	position: DeckPosition,
	previous: DeckPosition,
) => void;

/**
 * Moves through the slides and clicks of a deck. It knows nothing about the
 * page: keyboard, pointer and address bar call it.
 */
export interface Navigator {
	readonly position: DeckPosition;
	readonly slideCount: number;
	/** Plays the next click, or enters the next slide at its start. */
	next(): void;
	/** Undoes the last click, or returns to the previous slide at its end. */
	prev(): void;
	/** Goes to the start of the first slide. */
	first(): void;
	/** Goes to the end of the last slide. */
	last(): void;
	/** Goes to a position, clamped to the slides and clicks that exist. */
	goTo(position: DeckPosition): void;
	/** Calls `listener` after every change of position. */
	subscribe(listener: PositionListener): Unsubscribe;
}

/**
 * Creates a navigator for a deck.
 *
 * Going back into a slide lands on its last click, so moving backwards shows
 * every state that moving forwards showed, in reverse.
 *
 * @param clickCounts - Number of clicks of each slide, in order.
 * @param start - First position; it is clamped like {@link Navigator.goTo}.
 *
 * @example
 * ```ts
 * const navigator = createNavigator([0, 2]);
 * navigator.next(); // { slide: 1, step: 0 }
 * navigator.next(); // { slide: 1, step: 1 }
 * navigator.prev(); // { slide: 1, step: 0 }
 * ```
 */
export function createNavigator(
	clickCounts: readonly number[],
	start: DeckPosition = { slide: 0, step: 0 },
): Navigator {
	const lastSlide = Math.max(clickCounts.length - 1, 0);
	const clicksOf = (slide: number): number => clickCounts[slide] ?? 0;
	const clamp = (value: number, max: number): number =>
		Number.isInteger(value) ? Math.min(Math.max(value, 0), max) : 0;
	const clampPosition = (target: DeckPosition): DeckPosition => {
		const slide = clamp(target.slide, lastSlide);
		return { slide, step: clamp(target.step, clicksOf(slide)) };
	};

	const listeners = new Set<PositionListener>();
	let position = clampPosition(start);
	const moveTo = (target: DeckPosition): void => {
		const next = clampPosition(target);
		if (samePosition(next, position)) return;
		const previous = position;
		position = next;
		for (const listener of [...listeners]) listener(position, previous);
	};

	return {
		get position() {
			return position;
		},
		slideCount: clickCounts.length,
		next() {
			const { slide, step } = position;
			if (step < clicksOf(slide)) moveTo({ slide, step: step + 1 });
			else if (slide < lastSlide) moveTo({ slide: slide + 1, step: 0 });
		},
		prev() {
			const { slide, step } = position;
			if (step > 0) moveTo({ slide, step: step - 1 });
			else if (slide > 0)
				moveTo({ slide: slide - 1, step: clicksOf(slide - 1) });
		},
		first() {
			moveTo({ slide: 0, step: 0 });
		},
		last() {
			moveTo({ slide: lastSlide, step: clicksOf(lastSlide) });
		},
		goTo: moveTo,
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
}
