// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockDefinition,
	type BlockRegistry,
	createBlockRegistry,
} from "@addondeck/core";
import type {
	AdapterKind,
	AdapterPlugin,
	AdapterPluginOf,
	BlockPlugin,
	BlockView,
} from "@addondeck/sdk";
import type { PluginRegistry } from "./plugin-registry";

const ADAPTER_KINDS: readonly string[] = [
	"animator",
	"physics",
	"charts",
	"highlighter",
] satisfies readonly AdapterKind[];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Creates an empty registry of blocks and adapters.
 *
 * Plugins arrive as separate classic scripts that call `AddonDeck.register`,
 * so a plugin built against another version of the SDK, or by hand, is
 * checked here instead of failing later in the middle of a slide.
 *
 * @example
 * ```ts
 * const registry = createPluginRegistry();
 * registry.register({ kind: "block", definition: quote, view: quoteView });
 * registry.view("quote"); // quoteView
 * ```
 */
export function createPluginRegistry(): PluginRegistry {
	const definitions: BlockDefinition[] = [];
	const views = new Map<string, BlockView>();
	const adapters = new Map<string, AdapterPlugin>();
	let blocks = createBlockRegistry([]);

	const registerBlock = (plugin: BlockPlugin): void => {
		const { definition, view } = plugin;
		if (!isRecord(definition) || !isRecord(view)) {
			throw new Error("A block plugin needs a definition and a view.");
		}
		if (typeof view.mount !== "function") {
			throw new Error(`The view of the ${definition.type} block has no mount.`);
		}
		if (view.type !== definition.type) {
			throw new Error(
				`The view type "${view.type}" differs from the definition type "${definition.type}".`,
			);
		}
		if (views.has(definition.type)) {
			throw new Error(`The ${definition.type} block is already registered.`);
		}
		// Throws on a keyword conflict before anything is stored.
		blocks = createBlockRegistry([...definitions, definition]);
		definitions.push(definition);
		views.set(definition.type, view);
	};

	const registerAdapter = (plugin: AdapterPlugin): void => {
		if (!ADAPTER_KINDS.includes(plugin.adapter)) {
			throw new Error(`Unknown adapter kind "${String(plugin.adapter)}".`);
		}
		if (typeof plugin.create !== "function") {
			throw new Error(`The ${plugin.adapter} adapter has no create.`);
		}
		if (adapters.has(plugin.adapter)) {
			throw new Error(`An ${plugin.adapter} adapter is already registered.`);
		}
		adapters.set(plugin.adapter, plugin);
	};

	return {
		register(plugin) {
			const kind: unknown = isRecord(plugin) ? plugin.kind : undefined;
			if (kind === "block") registerBlock(plugin as BlockPlugin);
			else if (kind === "adapter") registerAdapter(plugin as AdapterPlugin);
			else throw new Error(`Unknown plugin kind "${String(kind)}".`);
		},
		blocks: (): BlockRegistry => blocks,
		view: (type) => views.get(type),
		adapter<K extends AdapterKind>(kind: K): AdapterPluginOf<K> | undefined {
			// Each adapter is stored under its own kind.
			return adapters.get(kind) as AdapterPluginOf<K> | undefined;
		},
	};
}
