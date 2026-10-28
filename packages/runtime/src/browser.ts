// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Entry of the classic script embedded in exported decks. Its exports become
// the properties of the page global `AddonDeck` (ADR 002).

import type { Plugin } from "@addondeck/sdk";
import { createPluginRegistry } from "./registry/create-plugin-registry";
import type { Runtime, RuntimeOptions } from "./start/create-runtime";
import { startFromPage } from "./start/start-from-page";

const registry = createPluginRegistry();
let running: Runtime | null = null;

/**
 * Adds a block or an adapter. Each plugin script calls it when it loads,
 * before {@link start}.
 *
 * @throws Error when the plugin is malformed or already registered.
 */
export function register(plugin: Plugin): void {
	registry.register(plugin);
}

/** What the page itself decides about the deck, besides its text. */
export type PageOptions = Pick<RuntimeOptions, "watermark">;

/**
 * Shows the deck embedded in the page. Calling it again returns the deck
 * already shown.
 *
 * @param options - Written by the exporter, such as `{ watermark: false }`
 * for an export without the watermark.
 * @returns The running deck, or `null` when the page has no deck; the reason
 * is on the console.
 */
export function start(options: PageOptions = {}): Runtime | null {
	running ??= startFromPage(document, { ...options, registry });
	return running;
}
