// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta } from "@addondeck/core";
import type { MotionTokens, ThemeTokens, Unsubscribe } from "@addondeck/sdk";
import { MOTIONS, type MotionCatalog, resolveMotion } from "./resolve-motion";
import { resolveTheme, THEMES, type ThemeCatalog } from "./resolve-theme";
import { themeVariables } from "./theme-variables";

/** The media query of the system setting that asks for less motion. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** The theme and motion of a deck, applied as CSS variables. */
export interface ThemeEngine {
	readonly theme: ThemeTokens;
	/** The personality in effect now; it changes with the reduced motion setting. */
	readonly motion: MotionTokens;
	/** Calls `listener` after the motion personality changes. */
	subscribe(listener: (motion: MotionTokens) => void): Unsubscribe;
	/** Removes the variables and stops following the system setting. */
	destroy(): void;
}

/** What {@link createThemeEngine} needs. */
export interface ThemeEngineOptions {
	/** The element that receives the variables; everything inside it inherits them. */
	readonly element: HTMLElement;
	readonly meta: Pick<
		DeckMeta,
		"theme" | "motion" | "color" | "accent" | "font"
	>;
	readonly themes?: ThemeCatalog;
	readonly motions?: MotionCatalog;
}

/**
 * Resolves a deck's theme and motion personality and writes them as CSS
 * variables on `element`.
 *
 * The variables go on the element and not on the document, so several decks
 * in one page, as in the Studio, keep their own theme. The reduced motion
 * setting is followed while the deck is shown: turning it on switches to the
 * `minimal` personality at once.
 *
 * @example
 * ```ts
 * const engine = createThemeEngine({ element: stage.viewport, meta: deck.meta });
 * engine.motion.duration.m; // 600, or 0 with reduced motion
 * engine.destroy();
 * ```
 */
export function createThemeEngine(options: ThemeEngineOptions): ThemeEngine {
	const { element, meta } = options;
	const query =
		element.ownerDocument.defaultView?.matchMedia?.(REDUCED_MOTION_QUERY) ??
		null;
	const theme = resolveTheme(meta, options.themes ?? THEMES);
	const motionFor = (reduced: boolean): MotionTokens =>
		resolveMotion(meta.motion, reduced, options.motions ?? MOTIONS);
	let motion = motionFor(query?.matches ?? false);
	const listeners = new Set<(motion: MotionTokens) => void>();
	const written = new Set<string>();

	const apply = (): void => {
		for (const [name, value] of themeVariables(theme, motion)) {
			element.style.setProperty(name, value);
			written.add(name);
		}
	};
	const onChange = (): void => {
		const next = motionFor(query?.matches ?? false);
		if (next === motion) return;
		motion = next;
		apply();
		for (const listener of [...listeners]) listener(motion);
	};

	apply();
	query?.addEventListener("change", onChange);

	return {
		theme,
		get motion() {
			return motion;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		destroy() {
			query?.removeEventListener("change", onChange);
			listeners.clear();
			for (const name of written) element.style.removeProperty(name);
		},
	};
}
