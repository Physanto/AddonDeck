// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type Animator,
	type AssetResolver,
	type BlockContext,
	createInstantAnimator,
	type EventBus,
	type MotionTokens,
	type StageInfo,
} from "@addondeck/sdk";
import type { PluginRegistry } from "../registry/plugin-registry";
import type { ThemeEngine } from "../theme/create-theme-engine";

/** What {@link createDeckContext} needs. */
export interface DeckContextOptions {
	readonly registry: PluginRegistry;
	readonly theme: ThemeEngine;
	readonly assets: AssetResolver;
	readonly events: EventBus;
	readonly stage: StageInfo;
}

/** The services every block of a deck shares, kept up to date. */
export interface DeckContext {
	/** `animator` and `motion` always return the ones in effect. */
	readonly context: BlockContext;
	/** Stops following the motion personality. */
	destroy(): void;
}

/**
 * Creates the services the blocks of a deck share.
 *
 * The animator follows the motion personality: the registered adapter
 * creates a new one when the personality changes, and `minimal`, or having
 * no animator registered, animates without motion.
 */
export function createDeckContext(options: DeckContextOptions): DeckContext {
	const { registry, theme } = options;
	const animatorFor = (motion: MotionTokens): Animator => {
		const adapter = registry.adapter("animator");
		if (motion.id === "minimal" || adapter === undefined) {
			return createInstantAnimator();
		}
		return adapter.create({ theme: theme.theme, motion });
	};
	let animator = animatorFor(theme.motion);
	const unsubscribe = theme.subscribe((motion) => {
		animator = animatorFor(motion);
	});

	return {
		context: {
			get animator() {
				return animator;
			},
			theme: theme.theme,
			get motion() {
				return theme.motion;
			},
			assets: options.assets,
			events: options.events,
			stage: options.stage,
		},
		destroy: unsubscribe,
	};
}
