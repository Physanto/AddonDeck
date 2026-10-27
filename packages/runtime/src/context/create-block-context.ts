// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AdapterKind, BlockContext, PhysicsWorld } from "@addondeck/sdk";
import type { PluginRegistry } from "../registry/plugin-registry";
import { trackAnimations } from "./track-animations";

/** The services of one block, and how to stop them. */
export interface BlockServices {
	readonly context: BlockContext;
	/** Jumps the block's running animations to their end. */
	finishAnimations(): void;
	/** Frees what was created for the block alone, such as its physics world. */
	destroy(): void;
}

/**
 * Builds the context of one block from the deck's shared services.
 *
 * The optional services are created only for the adapters the block declares
 * in `needs`, with the theme and the motion in effect; a physics world belongs
 * to its block and is destroyed with it. An adapter that is not registered
 * is left out: whoever mounts the block reports it first.
 *
 * @param deck - The services every block shares; `animator` and `motion` are read when used.
 * @param needs - The adapters the block's definition declares.
 */
export function createBlockContext(
	deck: BlockContext,
	needs: readonly AdapterKind[],
	registry: PluginRegistry,
): BlockServices {
	const tracked = trackAnimations(() => deck.animator);
	const environment = { theme: deck.theme, motion: deck.motion };
	const physics: PhysicsWorld | undefined = needs.includes("physics")
		? registry.adapter("physics")?.create(environment)
		: undefined;
	const charts = needs.includes("charts")
		? registry.adapter("charts")?.create(environment)
		: undefined;
	const highlighter = needs.includes("highlighter")
		? registry.adapter("highlighter")?.create(environment)
		: undefined;

	const context: BlockContext = {
		animator: tracked.animator,
		theme: deck.theme,
		get motion() {
			return deck.motion;
		},
		assets: deck.assets,
		events: deck.events,
		stage: deck.stage,
		...(physics === undefined ? {} : { physics }),
		...(charts === undefined ? {} : { charts }),
		...(highlighter === undefined ? {} : { highlighter }),
	};
	return {
		context,
		finishAnimations: tracked.finishAll,
		destroy() {
			physics?.destroy();
		},
	};
}
