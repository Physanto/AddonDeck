// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	ChartRenderer,
	Highlighter,
	MotionTokens,
	PhysicsWorld,
} from "@addondeck/sdk";
import { createTestContext } from "@addondeck/sdk/testing";
import { describe, expect, it, vi } from "vitest";
import { createPluginRegistry } from "../registry/create-plugin-registry";
import { MINIMAL_MOTION_TOKENS } from "../theme/default-tokens";
import { createBlockContext } from "./create-block-context";

function fakeWorld(): PhysicsWorld {
	return {
		addBody() {},
		removeBody() {},
		applyImpulse() {},
		step() {},
		bodies: () => [],
		snapshot: () => ({ time: 0, data: null }),
		restore() {},
		destroy: vi.fn(),
	};
}

function registryWithAdapters() {
	const registry = createPluginRegistry();
	const physics = vi.fn(fakeWorld);
	const charts = vi.fn((): ChartRenderer => ({}) as ChartRenderer);
	const highlighter = vi.fn((): Highlighter => ({}) as Highlighter);
	registry.register({ kind: "adapter", adapter: "physics", create: physics });
	registry.register({ kind: "adapter", adapter: "charts", create: charts });
	registry.register({
		kind: "adapter",
		adapter: "highlighter",
		create: highlighter,
	});
	return { registry, physics, charts, highlighter };
}

describe("createBlockContext", () => {
	it("gives a block only the shared services when it needs nothing else", () => {
		const { registry, physics, charts, highlighter } = registryWithAdapters();
		const deck = createTestContext();
		const { context } = createBlockContext(deck, [], registry);
		expect(Object.keys(context).sort()).toEqual([
			"animator",
			"assets",
			"events",
			"motion",
			"stage",
			"theme",
		]);
		expect(context.events).toBe(deck.events);
		expect(context.assets).toBe(deck.assets);
		expect(context.stage).toBe(deck.stage);
		expect(context.theme).toBe(deck.theme);
		expect(physics).not.toHaveBeenCalled();
		expect(charts).not.toHaveBeenCalled();
		expect(highlighter).not.toHaveBeenCalled();
	});

	it("creates the adapters the block declares, with the theme and the motion", () => {
		const { registry, physics, charts, highlighter } = registryWithAdapters();
		const deck = createTestContext();
		const { context } = createBlockContext(
			deck,
			["physics", "charts", "highlighter"],
			registry,
		);
		const environment = { theme: deck.theme, motion: deck.motion };
		expect(physics).toHaveBeenCalledWith(environment);
		expect(charts).toHaveBeenCalledWith(environment);
		expect(highlighter).toHaveBeenCalledWith(environment);
		expect(context.physics).toBe(physics.mock.results[0]?.value);
		expect(context.charts).toBe(charts.mock.results[0]?.value);
		expect(context.highlighter).toBe(highlighter.mock.results[0]?.value);
	});

	it("gives each block a physics world of its own and destroys it with the block", () => {
		const { registry, physics } = registryWithAdapters();
		const deck = createTestContext();
		const first = createBlockContext(deck, ["physics"], registry);
		const second = createBlockContext(deck, ["physics"], registry);
		expect(first.context.physics).not.toBe(second.context.physics);
		first.destroy();
		expect(first.context.physics?.destroy).toHaveBeenCalledOnce();
		expect(second.context.physics?.destroy).not.toHaveBeenCalled();
		expect(physics).toHaveBeenCalledTimes(2);
	});

	it("leaves out an adapter that is not registered", () => {
		const { context } = createBlockContext(
			createTestContext(),
			["charts"],
			createPluginRegistry(),
		);
		expect("charts" in context).toBe(false);
	});

	it("reads the motion of the deck when the block does", () => {
		let motion: MotionTokens = createTestContext().motion;
		const deck = {
			...createTestContext(),
			get motion() {
				return motion;
			},
		};
		const { context } = createBlockContext(deck, [], createPluginRegistry());
		motion = MINIMAL_MOTION_TOKENS;
		expect(context.motion).toBe(MINIMAL_MOTION_TOKENS);
	});

	it("finishes the block's animations", () => {
		const deck = createTestContext();
		const finish = vi.fn();
		vi.spyOn(deck.animator, "animate").mockReturnValue({
			duration: 1,
			progress: 0,
			finished: new Promise(() => {}),
			play() {},
			pause() {},
			seek() {},
			finish,
			cancel() {},
		});
		const services = createBlockContext(deck, [], createPluginRegistry());
		services.context.animator.animate([], { opacity: 1 });
		services.finishAnimations();
		expect(finish).toHaveBeenCalledOnce();
	});
});
