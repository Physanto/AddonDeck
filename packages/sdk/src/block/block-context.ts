// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ChartRenderer } from "../adapters/chart-renderer";
import type { Highlighter } from "../adapters/highlighter";
import type { PhysicsWorld } from "../adapters/physics-world";
import type { Animator } from "../animation/animator";
import type { AssetResolver } from "../services/asset-resolver";
import type { EventBus } from "../services/event-bus";
import type { MotionTokens } from "../services/motion-tokens";
import type { StageInfo } from "../services/stage-info";
import type { ThemeTokens } from "../services/theme-tokens";

/**
 * The services the runtime gives a block when mounting it. A block uses only
 * the ones it needs.
 *
 * The optional services are present only when the block declares them in
 * `needs` (`physics`, `charts`, `highlighter`), because the exporter includes
 * their libraries only for decks that use them.
 *
 * `animator` and `motion` follow the motion personality in effect, which can
 * change while the block is mounted (when the system starts asking for
 * reduced motion), so read them when animating instead of keeping them.
 */
export interface BlockContext {
	/** Animates the block's elements in `play`. */
	readonly animator: Animator;
	/** Values of the active theme, for code that cannot read CSS variables. */
	readonly theme: ThemeTokens;
	/** Durations and easings to animate with. */
	readonly motion: MotionTokens;
	/** Turns references such as `emoji:dog` into URLs. */
	readonly assets: AssetResolver;
	/** Events between blocks and from the runtime. */
	readonly events: EventBus;
	/** Size and scale of the stage. */
	readonly stage: StageInfo;
	/** A physics world of the block's own. Present when `needs` includes `physics`. */
	readonly physics?: PhysicsWorld;
	/** Present when `needs` includes `charts`. */
	readonly charts?: ChartRenderer;
	/** Present when `needs` includes `highlighter`. */
	readonly highlighter?: Highlighter;
}
