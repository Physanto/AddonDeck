// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type Animator,
	createInstantAnimator,
	type MotionTokens,
} from "@addondeck/sdk";
import { createTestContext } from "@addondeck/sdk/testing";
import { describe, expect, it, vi } from "vitest";
import { createPluginRegistry } from "../registry/create-plugin-registry";
import type { ThemeEngine } from "../theme/create-theme-engine";
import {
	DEFAULT_MOTION_TOKENS,
	DEFAULT_THEME_TOKENS,
	MINIMAL_MOTION_TOKENS,
} from "../theme/default-tokens";
import { createDeckContext } from "./create-deck-context";

/** A theme engine whose motion the test changes. */
function fakeEngine(initial: MotionTokens) {
	let motion = initial;
	const listeners = new Set<(motion: MotionTokens) => void>();
	const engine: ThemeEngine = {
		theme: DEFAULT_THEME_TOKENS,
		get motion() {
			return motion;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		destroy() {},
	};
	return {
		engine,
		listeners,
		set(next: MotionTokens) {
			motion = next;
			for (const listener of listeners) listener(next);
		},
	};
}

function setup(initial: MotionTokens, withAdapter = true) {
	const registry = createPluginRegistry();
	const create = vi.fn((): Animator => createInstantAnimator());
	if (withAdapter) {
		registry.register({ kind: "adapter", adapter: "animator", create });
	}
	const motion = fakeEngine(initial);
	const { assets, events, stage } = createTestContext();
	const deck = createDeckContext({
		registry,
		theme: motion.engine,
		assets,
		events,
		stage,
	});
	return { deck, create, motion };
}

describe("createDeckContext", () => {
	it("creates the animator with the theme and the motion in effect", () => {
		const { deck, create } = setup(DEFAULT_MOTION_TOKENS);
		expect(create).toHaveBeenCalledWith({
			theme: DEFAULT_THEME_TOKENS,
			motion: DEFAULT_MOTION_TOKENS,
		});
		expect(deck.context.animator).toBe(create.mock.results[0]?.value);
		expect(deck.context.motion).toBe(DEFAULT_MOTION_TOKENS);
	});

	it("animates without motion in the minimal personality", () => {
		const { deck, create } = setup(MINIMAL_MOTION_TOKENS);
		expect(create).not.toHaveBeenCalled();
		expect(deck.context.animator.animate).toEqual(expect.any(Function));
	});

	it("creates another animator when the personality changes", () => {
		const { deck, create, motion } = setup(DEFAULT_MOTION_TOKENS);
		const first = deck.context.animator;
		motion.set(MINIMAL_MOTION_TOKENS);
		expect(deck.context.animator).not.toBe(first);
		expect(deck.context.motion).toBe(MINIMAL_MOTION_TOKENS);
		motion.set(DEFAULT_MOTION_TOKENS);
		expect(create).toHaveBeenCalledTimes(2);
	});

	it("animates without motion when no animator is registered", () => {
		const { deck } = setup(DEFAULT_MOTION_TOKENS, false);
		expect(deck.context.animator.timeline).toEqual(expect.any(Function));
	});

	it("stops following the personality when destroyed", () => {
		const { deck, motion } = setup(DEFAULT_MOTION_TOKENS);
		deck.destroy();
		expect(motion.listeners.size).toBe(0);
	});
});
