// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { formatMessage } from "./format-message";

describe("formatMessage", () => {
	it("replaces every placeholder with its parameter", () => {
		expect(formatMessage("{a} and {b}, then {a}", { a: "x", b: 2 })).toBe(
			"x and 2, then x",
		);
	});

	it("leaves a placeholder without a parameter visible", () => {
		expect(formatMessage("Line {line}", {})).toBe("Line {line}");
	});

	it("does not interpret placeholders inside parameter values", () => {
		expect(formatMessage("{a}", { a: "{b}", b: "no" })).toBe("{b}");
	});
});
