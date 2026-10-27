// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { toCssValue } from "./to-css-value";

describe("toCssValue", () => {
	it("adds the default unit of each property to numbers", () => {
		expect(toCssValue("width", 120)).toBe("120px");
		expect(toCssValue("x", -4)).toBe("-4px");
		expect(toCssValue("rotate", 90)).toBe("90deg");
		expect(toCssValue("opacity", 0.5)).toBe("0.5");
		expect(toCssValue("draw", 1)).toBe("1");
		expect(toCssValue("--progress", 0.5)).toBe("0.5");
	});

	it("returns strings as written", () => {
		expect(toCssValue("width", "50%")).toBe("50%");
	});
});
