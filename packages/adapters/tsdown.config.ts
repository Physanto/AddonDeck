// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";
import { artifactManifest } from "../../tooling/build/artifact-manifest-plugin.ts";

const SCRIPT = "addondeck-adapter:animator-anime";

/**
 * The entry of the animator's classic script: a module that registers the
 * anime.js animator with the page global of the runtime.
 */
const animatorScript = {
	name: "addondeck-adapter-scripts",
	resolveId(id: string): string | null {
		return id === SCRIPT ? `\0${id}` : null;
	},
	load(id: string): string | null {
		if (id !== `\0${SCRIPT}`) return null;
		const entry = fileURLToPath(
			new URL("./src/animator-anime/index.ts", import.meta.url),
		);
		return [
			`import { createAnimeAnimator } from ${JSON.stringify(entry)};`,
			`AddonDeck.register({ kind: "adapter", adapter: "animator", create: ({ motion }) => createAnimeAnimator({ motion }) });`,
		].join("\n");
	},
};

// The MIT license asks for its notice in every copy, so the script starts
// with it, as recorded in licenses/.
const ANIME_LICENSE = readFileSync(
	new URL("../../licenses/animejs.txt", import.meta.url),
	"utf8",
)
	.trim()
	.replaceAll("*/", "* /");

export default defineConfig([
	{
		entry: ["src/index.ts", "src/animator-anime/index.ts"],
		platform: "browser",
		target: "es2022",
		fixedExtension: false,
		plugins: [
			artifactManifest(new URL("./package.json", import.meta.url), [
				{
					kind: "adapter",
					name: "animator",
					script: "browser/animator-anime.iife.js",
				},
			]),
		],
	},
	{
		// Classic script that an exported deck inlines unless its motion is
		// minimal: decks open from file://, where module scripts are blocked
		// (ADR 002). It carries anime.js.
		entry: { "browser/animator-anime": SCRIPT },
		platform: "browser",
		target: "es2022",
		format: "iife",
		deps: { alwaysBundle: [/^@addondeck\//, /^animejs(\/|$)/] },
		inputOptions: {
			resolve: {
				conditionNames: ["@addondeck/source", "import", "browser", "default"],
			},
		},
		plugins: [animatorScript],
		banner: `/*! anime.js\n\n${ANIME_LICENSE}\n*/`,
		dts: false,
		minify: true,
		clean: false,
	},
]);
