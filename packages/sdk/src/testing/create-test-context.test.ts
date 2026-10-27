// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import type { Highlighter } from "../adapters/highlighter";
import { createTestAssetResolver } from "./create-test-asset-resolver";
import { createTestContext } from "./create-test-context";
import { createTestEventBus } from "./create-test-event-bus";
import { TEST_STAGE_INFO } from "./test-tokens";

describe("createTestContext", () => {
	it("gives every service a block needs", () => {
		const ctx = createTestContext();
		expect(ctx.stage).toEqual(TEST_STAGE_INFO);
		expect(ctx.theme.colors.primary).toMatch(/^#/);
		expect(ctx.motion.duration.m).toBeGreaterThan(0);
		expect(ctx.physics).toBeUndefined();
	});

	it("replaces the services given, but always uses a fresh event bus", () => {
		const highlighter: Highlighter = {
			supports: () => true,
			highlight: (code) =>
				code.split("\n").map((text) => [{ text, scope: null }]),
		};
		const first = createTestContext({ highlighter });
		const second = createTestContext();
		expect(first.highlighter).toBe(highlighter);
		expect(first.events).not.toBe(second.events);
	});
});

describe("createTestEventBus", () => {
	it("delivers events to their subscribers and records them", () => {
		const events = createTestEventBus();
		const received: unknown[] = [];
		const off = events.on("network:step", (payload) => received.push(payload));
		events.on("other", () => received.push("other"));
		events.emit("network:step", 1);
		events.emit("nobody");
		expect(received).toEqual([1]);
		expect(events.emitted).toEqual([
			{ name: "network:step", payload: 1 },
			{ name: "nobody", payload: undefined },
		]);
		expect(events.listenerCount("network:step")).toBe(1);
		expect(events.listenerCount("missing")).toBe(0);
		off();
		off();
		expect(events.listenerCount()).toBe(1);
	});

	it("lets a handler unsubscribe while the event is delivered", () => {
		const events = createTestEventBus();
		const calls: string[] = [];
		const off = events.on("tick", () => {
			calls.push("first");
			off();
		});
		events.on("tick", () => calls.push("second"));
		events.emit("tick");
		events.emit("tick");
		expect(calls).toEqual(["first", "second", "second"]);
	});
});

describe("createTestAssetResolver", () => {
	it("resolves every reference that is not blank, with its kind", () => {
		const assets = createTestAssetResolver();
		expect(assets.resolve("icon:lucide/heart")).toEqual({
			kind: "icon",
			url: "data:,icon%3Alucide%2Fheart",
		});
		expect(assets.resolve("🐕")?.kind).toBe("image");
		expect(assets.resolve("  ")).toBeNull();
	});
});
