// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Receives the payload of an event. */
export type EventHandler = (payload: unknown) => void;

/** Stops receiving an event. Calling it more than once does nothing. */
export type Unsubscribe = () => void;

/**
 * Named events between blocks and the runtime.
 *
 * Blocks emit events named after their id (`network:step`) and the runtime
 * emits lifecycle events (`slide:enter`, `step:change`, `slide:leave`).
 * A block unsubscribes everything in `destroy`.
 *
 * @example
 * ```ts
 * const off = ctx.events.on("network:step", (payload) => highlight(payload));
 * // in destroy():
 * off();
 * ```
 */
export interface EventBus {
	/** Calls `handler` every time `name` is emitted, until unsubscribed. */
	on(name: string, handler: EventHandler): Unsubscribe;
	/** Calls every handler of `name`, in subscription order. */
	emit(name: string, payload?: unknown): void;
}
