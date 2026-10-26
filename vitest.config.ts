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
		coverage: {
			provider: "v8",
			include: ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"],
			exclude: ["**/*.test.ts"],
			// Everything else builds on these packages, so each one must stay covered
			// on its own; the rest is judged by behavior, not by percentage.
			thresholds: {
				"packages/core/src/**": { lines: 90 },
				"packages/sdk/src/**": { lines: 90 },
				"packages/exporter/src/**": { lines: 90 },
			},
		},
		projects: [
			{
				extends: true,
				test: {
					name: "packages",
					include: [
						"packages/*/src/**/*.test.ts",
						"packages/*/test/**/*.test.ts",
					],
				},
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
