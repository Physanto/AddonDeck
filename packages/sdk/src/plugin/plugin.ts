// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AdapterKind, BlockDefinition } from "@addondeck/core";
import type { ChartRenderer } from "../adapters/chart-renderer";
import type { Highlighter } from "../adapters/highlighter";
import type { PhysicsWorld } from "../adapters/physics-world";
import type { Animator } from "../animation/animator";
import type { BlockView } from "../block/block-view";
import type { MotionTokens } from "../services/motion-tokens";
import type { ThemeTokens } from "../services/theme-tokens";

/**
 * A block as its script registers it in the page.
 *
 * The definition travels with the view because the runtime parses the deck in
 * the browser: a block it cannot parse is shown as text.
 *
 * @typeParam M - The model the block's definition builds.
 *
 * @example
 * ```ts
 * AddonDeck.register({ kind: "block", definition: quote, view: quoteView });
 * ```
 */
export interface BlockPlugin<M = unknown> {
	readonly kind: "block";
	readonly definition: BlockDefinition<M>;
	/** Draws the block; its `type` must equal the definition's. */
	readonly view: BlockView<M>;
}

/** The service each kind of adapter creates. */
export interface AdapterServices {
	readonly animator: Animator;
	readonly physics: PhysicsWorld;
	readonly charts: ChartRenderer;
	readonly highlighter: Highlighter;
}

/**
 * What an adapter receives to create its service.
 *
 * @experimental Settled together with the theme engine; it may change until then.
 */
export interface AdapterEnvironment {
	readonly theme: ThemeTokens;
	readonly motion: MotionTokens;
}

/**
 * An adapter of one kind, as its script registers it in the page.
 *
 * @typeParam K - The kind of service the adapter creates.
 *
 * @experimental Settled together with the theme engine; it may change until then.
 */
export interface AdapterPluginOf<K extends AdapterKind> {
	readonly kind: "adapter";
	readonly adapter: K;
	/**
	 * Creates a service. The runtime calls it again when the environment
	 * changes, such as another motion personality.
	 */
	create(environment: AdapterEnvironment): AdapterServices[K];
}

/**
 * An adapter of any kind, narrowed by `adapter`.
 *
 * @example
 * ```ts
 * AddonDeck.register({
 *   kind: "adapter",
 *   adapter: "animator",
 *   create: ({ motion }) => createAnimeAnimator({ motion }),
 * });
 * ```
 */
export type AdapterPlugin = {
	readonly [K in AdapterKind]: AdapterPluginOf<K>;
}[AdapterKind];

/** Anything a script can register with the runtime. Narrow it with `kind`. */
export type Plugin = BlockPlugin | AdapterPlugin;
