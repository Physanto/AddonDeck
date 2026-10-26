// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { isValidId } from "./is-valid-id";

describe("isValidId", () => {
	it("accepts a letter followed by letters, digits, dashes and underscores", () => {
		expect(isValidId("payment")).toBe(true);
		expect(isValidId("flow-2_b")).toBe(true);
		expect(isValidId("pagó")).toBe(true);
	});

	it("rejects ids that do not start with a letter or use other characters", () => {
		expect(isValidId("1st-flow")).toBe(false);
		expect(isValidId("-flow")).toBe(false);
		expect(isValidId("pay.ment")).toBe(false);
		expect(isValidId("")).toBe(false);
	});
});
