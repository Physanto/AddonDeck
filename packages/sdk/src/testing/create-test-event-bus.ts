// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	EventBus,
	EventHandler,
	EventPayload,
} from "../services/event-bus";

/** An event emitted on a {@link TestEventBus}. */
export interface TestEvent {
	readonly name: string;
	readonly payload: unknown;
}

/** An event bus that also tells tests what happened on it. */
export interface TestEventBus extends EventBus {
	/** Events emitted so far, in order. */
	readonly emitted: readonly TestEvent[];
	/** Active subscriptions to `name`, or to every event when `name` is omitted. */
	listenerCount(name?: string): number;
}

/**
 * Creates an in-memory event bus for tests.
 *
 * @example
 * ```ts
 * const events = createTestEventBus();
 * const off = events.on("network:step", () => {});
 * events.listenerCount(); // 1
 * off();
 * ```
 */
export function createTestEventBus(): TestEventBus {
	const handlers = new Map<string, EventHandler[]>();
	const emitted: TestEvent[] = [];
	return {
		emitted,
		on<N extends string>(name: N, handler: EventHandler<EventPayload<N>>) {
			const list = handlers.get(name) ?? [];
			// Payloads are typed where they are emitted; the bus stores them as they come.
			const subscription: EventHandler = (payload) =>
				handler(payload as EventPayload<N>);
			list.push(subscription);
			handlers.set(name, list);
			return () => {
				const index = list.indexOf(subscription);
				if (index !== -1) list.splice(index, 1);
			};
		},
		emit(name, ...[payload]) {
			emitted.push({ name, payload });
			for (const handler of [...(handlers.get(name) ?? [])]) handler(payload);
		},
		listenerCount(name) {
			if (name !== undefined) return handlers.get(name)?.length ?? 0;
			let count = 0;
			for (const list of handlers.values()) count += list.length;
			return count;
		},
	};
}
