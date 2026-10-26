// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { defineConfig } from "vitest/config";

// Workspace packages export their TypeScript sources under this condition, so tests
// run without building first. Setting conditions replaces Vite's defaults, which are
// repeated here.
const SOURCE_CONDITION = "@addondeck/source";

export default defineConfig({
	resolve: {
		conditions: [
			SOURCE_CONDITION,
			"module",
			"browser",
			"development|production",
		],
	},
	ssr: {
		resolve: {
			conditions: [
				SOURCE_CONDITION,
				"module",
				"node",
				"development|production",
			],
		},
	},
	test: {
		projects: [
			{
				extends: true,
				test: { name: "packages", include: ["packages/*/src/**/*.test.ts"] },
			},
			{
				extends: true,
				test: { name: "apps", include: ["apps/*/src/**/*.test.ts"] },
			},
			{
				extends: true,
				test: { name: "tooling", include: ["tooling/**/*.test.ts"] },
			},
		],
	},
});
