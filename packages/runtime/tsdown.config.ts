// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { defineConfig } from "tsdown";

export default defineConfig({
	platform: "browser",
	target: "es2022",
	format: {
		esm: {},
		// Classic script: exported decks load the runtime from file://, where module scripts are blocked.
		iife: { globalName: "AddonDeck" },
	},
	fixedExtension: false,
});
