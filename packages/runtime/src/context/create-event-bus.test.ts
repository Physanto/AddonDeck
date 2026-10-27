// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StepChangeEvent } from "@addondeck/sdk";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createEventBus } from "./create-event-bus";

describe("createEventBus", () => {
	it("calls the handlers of an event in subscription order", () => {
		const events = createEventBus();
		const calls: string[] = [];
		events.on("network:step", (payload) => calls.push(`a:${payload}`));
		events.on("network:step", (payload) => calls.push(`b:${payload}`));
		events.on("other", () => calls.push("other"));
		events.emit("network:step", 2);
		expect(calls).toEqual(["a:2", "b:2"]);
	});

	it("counts the same handler subscribed twice as two subscriptions", () => {
		const events = createEventBus();
		const handler = vi.fn();
		const first = events.on("tick", handler);
		events.on("tick", handler);
		first();
		first();
		events.emit("tick");
		expect(handler).toHaveBeenCalledOnce();
	});

	it("lets a handler unsubscribe while the event is being emitted", () => {
		const events = createEventBus();
		const later = vi.fn();
		const off = events.on("tick", () => off());
		events.on("tick", later);
		events.emit("tick");
		events.emit("tick");
		expect(later).toHaveBeenCalledTimes(2);
	});

	it("ignores events nobody listens to", () => {
		expect(() => createEventBus().emit("nobody")).not.toThrow();
	});

	it("types the payloads of the runtime events", () => {
		const events = createEventBus();
		const changes: StepChangeEvent[] = [];
		events.on("step:change", (change) => {
			expectTypeOf(change).toEqualTypeOf<StepChangeEvent>();
			changes.push(change);
		});
		events.on("network:step", (payload) => {
			expectTypeOf(payload).toBeUnknown();
		});
		events.emit("step:change", { slide: 1, step: 2 });
		events.emit("network:step");
		// @ts-expect-error A runtime event needs its payload.
		events.emit("slide:enter");
		// @ts-expect-error The payload of a runtime event has its shape.
		events.emit("slide:leave", { step: 1 });
		expect(changes).toEqual([{ slide: 1, step: 2 }]);
	});
});
