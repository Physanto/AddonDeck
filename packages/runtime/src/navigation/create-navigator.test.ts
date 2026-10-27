// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it, vi } from "vitest";
import { createNavigator, type Navigator } from "./create-navigator";
import type { DeckPosition } from "./deck-position";

/** Positions visited by calling `move` until the position stops changing. */
function walk(navigator: Navigator, move: () => void): DeckPosition[] {
	const visited = [navigator.position];
	for (;;) {
		const before = navigator.position;
		move();
		if (navigator.position === before) return visited;
		visited.push(navigator.position);
	}
}

describe("createNavigator", () => {
	it("starts at the first slide, before any click", () => {
		const navigator = createNavigator([2, 0]);
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
		expect(navigator.slideCount).toBe(2);
	});

	it("plays every click of a slide before entering the next one", () => {
		const navigator = createNavigator([2, 0, 1]);
		expect(walk(navigator, navigator.next)).toEqual([
			{ slide: 0, step: 0 },
			{ slide: 0, step: 1 },
			{ slide: 0, step: 2 },
			{ slide: 1, step: 0 },
			{ slide: 2, step: 0 },
			{ slide: 2, step: 1 },
		]);
	});

	it("goes back through the same positions in reverse", () => {
		const navigator = createNavigator([2, 0, 1, 3]);
		const forward = walk(navigator, navigator.next);
		const backward = walk(navigator, navigator.prev);
		expect(backward).toEqual([...forward].reverse());
	});

	it("enters the previous slide at its last click", () => {
		const navigator = createNavigator([3, 0], { slide: 1, step: 0 });
		navigator.prev();
		expect(navigator.position).toEqual({ slide: 0, step: 3 });
	});

	it("stays put at both ends of the deck", () => {
		const navigator = createNavigator([0, 1]);
		navigator.prev();
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
		navigator.last();
		navigator.next();
		expect(navigator.position).toEqual({ slide: 1, step: 1 });
	});

	it("jumps to the start of the deck and to the end of the last slide", () => {
		const navigator = createNavigator([1, 2, 4], { slide: 1, step: 1 });
		navigator.last();
		expect(navigator.position).toEqual({ slide: 2, step: 4 });
		navigator.first();
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
	});

	it("clamps positions to the slides and clicks that exist", () => {
		const navigator = createNavigator([1, 2]);
		navigator.goTo({ slide: 9, step: 9 });
		expect(navigator.position).toEqual({ slide: 1, step: 2 });
		navigator.goTo({ slide: 0, step: 5 });
		expect(navigator.position).toEqual({ slide: 0, step: 1 });
		navigator.goTo({ slide: -3, step: -1 });
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
		navigator.goTo({ slide: 1.5, step: Number.NaN });
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
	});

	it("clamps the starting position", () => {
		expect(createNavigator([0, 2], { slide: 7, step: 7 }).position).toEqual({
			slide: 1,
			step: 2,
		});
	});

	it("tells listeners the new and the previous position", () => {
		const navigator = createNavigator([1, 0]);
		const listener = vi.fn();
		navigator.subscribe(listener);
		navigator.next();
		navigator.next();
		expect(listener.mock.calls).toEqual([
			[
				{ slide: 0, step: 1 },
				{ slide: 0, step: 0 },
			],
			[
				{ slide: 1, step: 0 },
				{ slide: 0, step: 1 },
			],
		]);
	});

	it("does not notify when the position does not change", () => {
		const navigator = createNavigator([0, 0]);
		const listener = vi.fn();
		navigator.subscribe(listener);
		navigator.prev();
		navigator.goTo({ slide: 0, step: 0 });
		navigator.first();
		expect(listener).not.toHaveBeenCalled();
	});

	it("stops notifying after unsubscribing", () => {
		const navigator = createNavigator([0, 0, 0]);
		const listener = vi.fn();
		const unsubscribe = navigator.subscribe(listener);
		navigator.next();
		unsubscribe();
		unsubscribe();
		navigator.next();
		expect(listener).toHaveBeenCalledOnce();
	});

	it("does nothing in a deck without slides", () => {
		const navigator = createNavigator([]);
		navigator.next();
		navigator.last();
		navigator.goTo({ slide: 3, step: 1 });
		expect(navigator.position).toEqual({ slide: 0, step: 0 });
		expect(navigator.slideCount).toBe(0);
	});
});
