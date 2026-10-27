// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { EventBus, EventHandler, EventPayload } from "@addondeck/sdk";

/** Creates the event bus a deck's blocks share. */
export function createEventBus(): EventBus {
	const handlers = new Map<string, Set<EventHandler>>();
	return {
		on<N extends string>(name: N, handler: EventHandler<EventPayload<N>>) {
			const set = handlers.get(name) ?? new Set();
			// Each subscription is its own entry, so subscribing twice needs two
			// unsubscribes. Payloads are typed where they are emitted.
			const subscription: EventHandler = (payload) =>
				handler(payload as EventPayload<N>);
			set.add(subscription);
			handlers.set(name, set);
			return () => {
				set.delete(subscription);
			};
		},
		emit(name, ...[payload]) {
			for (const handler of [...(handlers.get(name) ?? [])]) handler(payload);
		},
	};
}
