// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { mountWatermark } from "./mount-watermark";

describe("mountWatermark", () => {
	it("adds the badge to the stage with its text", () => {
		const stage = document.createElement("div");
		const badge = mountWatermark(stage, "Made with AddonDeck");
		expect(badge.parentElement).toBe(stage);
		expect(badge.className).toBe("adk-watermark");
		expect(badge.textContent).toBe("Made with AddonDeck");
	});
});
