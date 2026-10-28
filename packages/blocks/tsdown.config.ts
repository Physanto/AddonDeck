// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "tsdown";
import { artifactManifest } from "../../tooling/build/artifact-manifest-plugin.ts";

const SOURCES = new URL("./src/", import.meta.url);

// A block is any folder of src/ with a definition.ts, so adding a block is
// adding a folder.
const BLOCKS = readdirSync(SOURCES, { withFileTypes: true })
	.filter(
		(entry) =>
			entry.isDirectory() &&
			existsSync(new URL(`${entry.name}/definition.ts`, SOURCES)),
	)
	.map((entry) => entry.name)
	.sort();

const SCRIPT = "addondeck-block:";

/**
 * The entry of each block's classic script: a module that registers the
 * block's definition and view with the page global of the runtime.
 */
const blockScripts = {
	name: "addondeck-block-scripts",
	resolveId(id: string): string | null {
		return id.startsWith(SCRIPT) ? `\0${id}` : null;
	},
	load(id: string): string | null {
		if (!id.startsWith(`\0${SCRIPT}`)) return null;
		const folder = new URL(`${id.slice(SCRIPT.length + 1)}/`, SOURCES);
		const path = (file: string): string =>
			JSON.stringify(fileURLToPath(new URL(file, folder)));
		return [
			`import { definition } from ${path("definition.ts")};`,
			`import { view } from ${path("view.ts")};`,
			`AddonDeck.register({ kind: "block", definition, view });`,
		].join("\n");
	},
};

const modules: UserConfig = {
	entry: Object.fromEntries([
		["index", "src/index.ts"],
		...BLOCKS.flatMap((name) => [
			[`${name}/definition`, `src/${name}/definition.ts`],
			[`${name}/view`, `src/${name}/view.ts`],
		]),
	]),
	platform: "browser",
	target: "es2022",
	fixedExtension: false,
	copy: BLOCKS.map((name) => ({
		from: `src/${name}/styles.css`,
		to: `dist/${name}`,
	})),
	plugins: [
		artifactManifest(
			new URL("./package.json", import.meta.url),
			BLOCKS.map((name) => ({
				kind: "block",
				name,
				script: `browser/${name}.iife.js`,
				styles: `${name}/styles.css`,
			})),
		),
	],
};

// Classic scripts, one per block, that an exported deck inlines only when it
// uses the block: decks open from file://, where module scripts are blocked
// (ADR 002). Each carries the parts of core and sdk it uses.
const scripts: UserConfig[] = BLOCKS.map((name) => ({
	entry: { [`browser/${name}`]: `${SCRIPT}${name}` },
	platform: "browser",
	target: "es2022",
	format: "iife",
	deps: { alwaysBundle: [/^@addondeck\//] },
	inputOptions: {
		resolve: {
			conditionNames: ["@addondeck/source", "import", "browser", "default"],
		},
	},
	plugins: [blockScripts],
	dts: false,
	minify: true,
	clean: false,
}));

export default defineConfig([modules, ...scripts]);
