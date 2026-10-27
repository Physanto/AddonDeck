// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Colors of a theme, as CSS colors. */
export interface ThemeColors {
	/** Slide background. */
	readonly bg: string;
	/** Background of cards, panels and other raised surfaces. */
	readonly surface: string;
	readonly text: string;
	/** Secondary text, such as captions. */
	readonly muted: string;
	readonly primary: string;
	readonly accent: string;
	/** Success, correct or positive values. */
	readonly good: string;
	/** Errors, wrong or negative values. */
	readonly bad: string;
}

/** Font families of a theme. */
export interface ThemeFonts {
	readonly heading: string;
	readonly body: string;
	readonly code: string;
}

/**
 * The values of the active theme.
 *
 * In CSS, blocks use the theme variables (`--color-primary`, `--font-heading`…)
 * and never these values. They are here for code that cannot read CSS
 * variables, such as drawing on a canvas or configuring a chart.
 */
export interface ThemeTokens {
	/** Theme id, such as `paper`. */
	readonly id: string;
	readonly colors: ThemeColors;
	readonly fonts: ThemeFonts;
	/** Corner radius of surfaces, in pixels. */
	readonly radius: number;
}
