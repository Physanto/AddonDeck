// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "./source-location";

/** Canonical header keys of format version 1. */
export type HeaderKey =
	| "format"
	| "title"
	| "author"
	| "language"
	| "theme"
	| "motion"
	| "color"
	| "accent"
	| "font"
	| "background"
	| "watermark";

/** Motion personalities: how fast and lively animations are. */
export type MotionPersonality = "smooth" | "energetic" | "elegant" | "minimal";

/**
 * Deck settings from the header, with defaults applied to every key that is
 * missing or invalid.
 */
export interface DeckMeta {
	/** Format version the deck was read as. */
	readonly format: number;
	/** Document title; when the header has none, the first level-1 heading, or empty. */
	readonly title: string;
	readonly author: string;
	/** Language tag of the content, such as `en` or `pt-BR`. */
	readonly language: string;
	/** Normalized theme name. */
	readonly theme: string;
	readonly motion: MotionPersonality;
	/** Main color as written, or `null` to use the theme's. */
	readonly color: string | null;
	/** Accent color as written, or `null` to use the theme's. */
	readonly accent: string | null;
	/** Font family name, or `null` to use the theme's. */
	readonly font: string | null;
	/** Background name or color, or `null` to use the theme's. */
	readonly background: string | null;
	/** Whether the AddonDeck badge is shown. */
	readonly watermark: boolean;
}

/**
 * A header line as written, kept so that tools can edit the header without
 * losing what the author typed.
 */
export interface HeaderEntry {
	readonly key: HeaderKey;
	/** The key as written, before normalization (it may be an alias). */
	readonly keyword: string;
	/** The value as written, trimmed. */
	readonly value: string;
	readonly location: SourceLocation;
}
