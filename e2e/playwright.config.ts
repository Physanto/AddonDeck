// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { defineConfig, devices } from "@playwright/test";

const CI = process.env.CI !== undefined;

// Each example deck is exported with the built command line, then opened from
// file:// in the three browser engines, as a double click would open it.
export default defineConfig({
	testDir: ".",
	testMatch: "*.spec.ts",
	globalSetup: "./export-examples.ts",
	forbidOnly: CI,
	reporter: CI ? [["github"], ["list"]] : "list",
	use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
});
