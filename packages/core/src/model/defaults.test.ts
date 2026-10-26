// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import {
	DEFAULT_DECK_META,
	DEFAULT_SLIDE_OPTIONS,
	FORMAT_VERSION,
	HEADER_KEYS,
	MOTION_PERSONALITIES,
	SLIDE_LAYOUTS,
	SLIDE_TRANSITIONS,
} from "./defaults";

describe("format defaults", () => {
	it("defaults to the current format version", () => {
		expect(DEFAULT_DECK_META.format).toBe(FORMAT_VERSION);
	});

	it("has a default for every header key", () => {
		expect(Object.keys(DEFAULT_DECK_META).sort()).toEqual(
			[...HEADER_KEYS].sort(),
		);
	});

	it("uses default values that are among the allowed ones", () => {
		expect(MOTION_PERSONALITIES).toContain(DEFAULT_DECK_META.motion);
		expect(SLIDE_TRANSITIONS).toContain(DEFAULT_SLIDE_OPTIONS.transition);
		expect(SLIDE_LAYOUTS).toContain(DEFAULT_SLIDE_OPTIONS.layout);
	});

	it("shows the watermark unless the deck turns it off", () => {
		expect(DEFAULT_DECK_META.watermark).toBe(true);
	});
});
