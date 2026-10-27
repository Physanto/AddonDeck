// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { afterEach, describe, expect, it, vi } from "vitest";
import { reportToConsole } from "./runtime-issue";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("reportToConsole", () => {
	it("logs errors as errors and warnings as warnings", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		reportToConsole({ severity: "error", message: "broken" });
		reportToConsole({ severity: "warning", message: "odd" });
		expect(error).toHaveBeenCalledExactlyOnceWith("broken");
		expect(warn).toHaveBeenCalledExactlyOnceWith("odd");
	});
});
