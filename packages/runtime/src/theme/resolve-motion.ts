// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { MotionPersonality } from "@addondeck/core";
import type { MotionTokens } from "@addondeck/sdk";
import { DEFAULT_MOTION_TOKENS, MINIMAL_MOTION_TOKENS } from "./default-tokens";

/** Installed motion personalities by id. */
export type MotionCatalog = ReadonlyMap<string, MotionTokens>;

/** The personalities the runtime ships with. */
export const MOTIONS: MotionCatalog = new Map([
	[DEFAULT_MOTION_TOKENS.id, DEFAULT_MOTION_TOKENS],
	[MINIMAL_MOTION_TOKENS.id, MINIMAL_MOTION_TOKENS],
]);

/**
 * The motion tokens for a deck's personality in the current context.
 *
 * Reduced motion always gives `minimal`, whatever the deck asks for. A
 * personality that is not installed falls back to `smooth`.
 */
export function resolveMotion(
	personality: MotionPersonality,
	reducedMotion: boolean,
	motions: MotionCatalog = MOTIONS,
): MotionTokens {
	if (reducedMotion) return MINIMAL_MOTION_TOKENS;
	return motions.get(personality) ?? DEFAULT_MOTION_TOKENS;
}
