// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { MotionTokens } from "@addondeck/sdk";
import { describe, expect, it } from "vitest";
import { DEFAULT_MOTION_TOKENS, MINIMAL_MOTION_TOKENS } from "./default-tokens";
import { resolveMotion } from "./resolve-motion";

describe("resolveMotion", () => {
	it("gives the personality the deck asks for", () => {
		expect(resolveMotion("smooth", false)).toBe(DEFAULT_MOTION_TOKENS);
		expect(resolveMotion("minimal", false)).toBe(MINIMAL_MOTION_TOKENS);
	});

	it("falls back to smooth for a personality that is not installed", () => {
		expect(resolveMotion("energetic", false)).toBe(DEFAULT_MOTION_TOKENS);
	});

	it("gives minimal whenever the system asks for reduced motion", () => {
		const energetic: MotionTokens = {
			...DEFAULT_MOTION_TOKENS,
			id: "energetic",
		};
		const motions = new Map([["energetic", energetic]]);
		expect(resolveMotion("energetic", false, motions)).toBe(energetic);
		expect(resolveMotion("energetic", true, motions)).toBe(
			MINIMAL_MOTION_TOKENS,
		);
	});

	it("moves nothing in the minimal personality", () => {
		expect(Object.values(MINIMAL_MOTION_TOKENS.duration)).toEqual([0, 0, 0, 0]);
		expect(MINIMAL_MOTION_TOKENS.stagger).toBe(0);
	});
});
