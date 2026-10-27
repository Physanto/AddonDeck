// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { RuntimeEventName, RuntimeEvents } from "./runtime-events";

/** Receives the payload of an event. */
export type EventHandler<P = unknown> = (payload: P) => void;

/** Stops receiving an event. Calling it more than once does nothing. */
export type Unsubscribe = () => void;

/**
 * The payload of an event: the one {@link RuntimeEvents} declares for a
 * runtime event, and anything for the events blocks emit.
 */
export type EventPayload<N extends string> = N extends RuntimeEventName
	? RuntimeEvents[N]
	: unknown;

/**
 * What `emit` takes after the name: the payload is required for runtime
 * events and optional for the events blocks emit.
 */
export type EventArgs<N extends string> = N extends RuntimeEventName
	? [payload: RuntimeEvents[N]]
	: [payload?: unknown];

/**
 * Named events between blocks and the runtime.
 *
 * Blocks emit events named after their id (`network:step`) and the runtime
 * emits lifecycle events (`slide:enter`, `step:change`, `slide:leave`), whose
 * payloads are typed by {@link RuntimeEvents}. A block unsubscribes
 * everything in `destroy`.
 *
 * @example
 * ```ts
 * const off = ctx.events.on("network:step", (payload) => highlight(payload));
 * ctx.events.on("step:change", ({ slide, step }) => console.log(slide, step));
 * // in destroy():
 * off();
 * ```
 */
export interface EventBus {
	/** Calls `handler` every time `name` is emitted, until unsubscribed. */
	on<N extends string>(
		name: N,
		handler: EventHandler<EventPayload<N>>,
	): Unsubscribe;
	/** Calls every handler of `name`, in subscription order. */
	emit<N extends string>(name: N, ...args: EventArgs<N>): void;
}
