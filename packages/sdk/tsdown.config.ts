// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/testing/index.ts"],
	platform: "neutral",
	target: "es2022",
	fixedExtension: false,
});
