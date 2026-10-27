// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { fileURLToPath } from "node:url";
import { defaultClientConditions, defineConfig } from "vite";

export default defineConfig({
	root: fileURLToPath(new URL(".", import.meta.url)),
	resolve: {
		// Workspace packages are served from their sources, as in the tests.
		conditions: ["@addondeck/source", ...defaultClientConditions],
	},
});
