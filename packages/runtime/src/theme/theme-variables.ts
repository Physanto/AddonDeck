// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { MotionTokens, ThemeTokens } from "@addondeck/sdk";
import { CSS_EASINGS } from "./css-easing";

/**
 * The CSS variables of a theme and a motion personality, by name.
 *
 * Blocks use the theme ones (`--color-*`, `--font-*`, `--radius`); the
 * motion ones (`--adk-duration-*`, `--adk-easing-*`) are for the runtime's
 * own CSS transitions.
 *
 * @example
 * ```ts
 * themeVariables(theme, motion).get("--color-primary"); // "#2f5bd3"
 * ```
 */
export function themeVariables(
	theme: ThemeTokens,
	motion: MotionTokens,
): ReadonlyMap<string, string> {
	const variables = new Map<string, string>();
	for (const [name, value] of Object.entries(theme.colors)) {
		variables.set(`--color-${name}`, value);
	}
	for (const [name, value] of Object.entries(theme.fonts)) {
		variables.set(`--font-${name}`, value);
	}
	variables.set("--radius", `${theme.radius}px`);
	for (const [name, value] of Object.entries(motion.duration)) {
		variables.set(`--adk-duration-${name}`, `${value}ms`);
	}
	for (const [name, easing] of Object.entries(motion.easing)) {
		variables.set(`--adk-easing-${name}`, CSS_EASINGS[easing]);
	}
	return variables;
}
