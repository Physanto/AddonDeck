// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { createInstantAnimator } from "../animation/create-instant-animator";
import type { BlockContext } from "../block/block-context";
import { createTestAssetResolver } from "./create-test-asset-resolver";
import { createTestEventBus, type TestEventBus } from "./create-test-event-bus";
import {
	TEST_MOTION_TOKENS,
	TEST_STAGE_INFO,
	TEST_THEME_TOKENS,
} from "./test-tokens";

/** A block context for tests, whose event bus can be inspected. */
export interface TestContext extends BlockContext {
	readonly events: TestEventBus;
}

/**
 * Creates the services a block receives, for tests: an instant animator,
 * test theme and motion tokens, a resolver that resolves every reference, an
 * inspectable event bus and a 1920×1080 stage.
 *
 * @param overrides - Services to replace, such as a fake `highlighter` for a block that needs one.
 * @returns A fresh context; nothing is shared between calls.
 *
 * @example
 * ```ts
 * const ctx = createTestContext();
 * const instance = view.mount(model, document.createElement("div"), ctx);
 * instance.destroy();
 * ctx.events.listenerCount(); // 0
 * ```
 */
export function createTestContext(
	overrides: Partial<Omit<BlockContext, "events">> = {},
): TestContext {
	return {
		animator: createInstantAnimator(),
		theme: TEST_THEME_TOKENS,
		motion: TEST_MOTION_TOKENS,
		assets: createTestAssetResolver(),
		stage: TEST_STAGE_INFO,
		...overrides,
		events: createTestEventBus(),
	};
}
