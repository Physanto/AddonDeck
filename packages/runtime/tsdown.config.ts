// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { defineConfig } from "tsdown";
import { artifactManifest } from "../../tooling/build/artifact-manifest-plugin.ts";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		platform: "browser",
		target: "es2022",
		fixedExtension: false,
		copy: [{ from: "src/runtime.css", to: "dist" }],
		plugins: [
			artifactManifest(new URL("./package.json", import.meta.url), [
				{
					kind: "runtime",
					name: "runtime",
					script: "browser.iife.js",
					styles: "runtime.css",
				},
			]),
		],
	},
	{
		// Classic script: exported decks load the runtime from file://, where
		// module scripts are blocked (ADR 002). It carries core and sdk inside,
		// since a page has nothing to import them from, built from their sources.
		entry: { browser: "src/browser.ts" },
		platform: "browser",
		target: "es2022",
		format: "iife",
		globalName: "AddonDeck",
		deps: { alwaysBundle: [/^@addondeck\//] },
		inputOptions: {
			resolve: {
				conditionNames: ["@addondeck/source", "import", "browser", "default"],
			},
		},
		dts: false,
		minify: true,
		clean: false,
	},
]);
