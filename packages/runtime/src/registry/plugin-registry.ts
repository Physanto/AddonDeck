// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockRegistry } from "@addondeck/core";
import type {
	AdapterKind,
	AdapterPluginOf,
	BlockView,
	Plugin,
} from "@addondeck/sdk";

/** The blocks and adapters registered in the page. */
export interface PluginRegistry {
	/**
	 * Adds a block or an adapter.
	 *
	 * @throws Error when the plugin is malformed or claims a type, keyword or
	 * adapter kind already registered. These are mistakes in a plugin, not in a deck.
	 */
	register(plugin: Plugin): void;
	/** The registered block definitions, for the parser. */
	blocks(): BlockRegistry;
	/** The view of a block type, or `undefined` when none is registered. */
	view(type: string): BlockView | undefined;
	/** The adapter of a kind, or `undefined` when none is registered. */
	adapter<K extends AdapterKind>(kind: K): AdapterPluginOf<K> | undefined;
}
