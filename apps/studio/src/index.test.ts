// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@addondeck/studio", () => {
	it("exposes its package name", () => {
		expect(PACKAGE_NAME).toBe("@addondeck/studio");
	});
});
