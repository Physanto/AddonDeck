// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta, HeaderKey, MotionPersonality } from "./deck-meta";
import type {
	SlideLayout,
	SlideOptions,
	SlideTransition,
} from "./slide-options";

/** The format version this package reads and writes. */
export const FORMAT_VERSION = 1;

/** Header keys in the order the specification lists them. */
export const HEADER_KEYS: readonly HeaderKey[] = [
	"format",
	"title",
	"author",
	"language",
	"theme",
	"motion",
	"color",
	"accent",
	"font",
	"background",
	"watermark",
];

/** Every motion personality, the default first. */
export const MOTION_PERSONALITIES: readonly MotionPersonality[] = [
	"smooth",
	"energetic",
	"elegant",
	"minimal",
];

/** Every slide transition. */
export const SLIDE_TRANSITIONS: readonly SlideTransition[] = [
	"none",
	"fade",
	"slide",
	"zoom",
];

/** Every slide layout, the default first. */
export const SLIDE_LAYOUTS: readonly SlideLayout[] = [
	"auto",
	"columns",
	"rows",
];

/** Deck settings used for every header key that is missing or invalid. */
export const DEFAULT_DECK_META: DeckMeta = {
	format: FORMAT_VERSION,
	title: "",
	author: "",
	language: "en",
	theme: "paper",
	motion: "smooth",
	color: null,
	accent: null,
	font: null,
	background: null,
	watermark: true,
};

/** Slide options used when a slide has no `slide:` directive. */
export const DEFAULT_SLIDE_OPTIONS: SlideOptions = {
	background: null,
	transition: "fade",
	layout: "auto",
};
