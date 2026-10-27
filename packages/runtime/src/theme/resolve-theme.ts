// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta } from "@addondeck/core";
import type { ThemeTokens } from "@addondeck/sdk";
import { DEFAULT_THEME_TOKENS } from "./default-tokens";

/** Installed themes by id. */
export type ThemeCatalog = ReadonlyMap<string, ThemeTokens>;

/** The themes the runtime ships with. */
export const THEMES: ThemeCatalog = new Map([
	[DEFAULT_THEME_TOKENS.id, DEFAULT_THEME_TOKENS],
]);

/**
 * The theme a deck asks for, with the header's `color`, `accent` and `font`
 * written over it. An unknown theme name falls back to `paper`; the parser
 * already warned about it.
 *
 * @example
 * ```ts
 * resolveTheme({ theme: "paper", color: "#0a7", accent: null, font: "Inter" });
 * // { id: "paper", colors: { primary: "#0a7", … }, fonts: { body: "Inter, system-ui, sans-serif", … }, … }
 * ```
 */
export function resolveTheme(
	meta: Pick<DeckMeta, "theme" | "color" | "accent" | "font">,
	themes: ThemeCatalog = THEMES,
): ThemeTokens {
	const theme = themes.get(meta.theme) ?? DEFAULT_THEME_TOKENS;
	const { colors, fonts } = theme;
	// The theme's own families stay as fallbacks for a font that is not available.
	const font = (fallback: string): string =>
		meta.font === null ? fallback : `${meta.font}, ${fallback}`;
	return {
		...theme,
		colors: {
			...colors,
			primary: meta.color ?? colors.primary,
			accent: meta.accent ?? colors.accent,
		},
		fonts: {
			...fonts,
			heading: font(fonts.heading),
			body: font(fonts.body),
		},
	};
}
