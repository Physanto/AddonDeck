// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readArtifactManifest } from "@addondeck/exporter";
import { describe, expect, it } from "vitest";
import {
	artifactManifest,
	createArtifactManifest,
} from "./artifact-manifest-plugin";

const PIECES = [
	{
		kind: "block",
		name: "list",
		script: "browser/list.iife.js",
		styles: "list/styles.css",
	},
] as const;

describe("artifactManifest", () => {
	it("names and versions the manifest after the package", () => {
		expect(
			createArtifactManifest(
				'{"name": "@x/blocks", "version": "1.2.3"}',
				PIECES,
			),
		).toEqual({
			manifest: 1,
			name: "@x/blocks",
			version: "1.2.3",
			pieces: PIECES,
		});
	});

	it("emits a manifest the exporter reads", () => {
		const emitted: { fileName: string; source: string }[] = [];
		const plugin = artifactManifest(
			new URL("../package.json", import.meta.url),
			PIECES,
		);
		plugin.generateBundle.call({
			emitFile: (file) => {
				emitted.push(file);
				return file.fileName;
			},
		});
		expect(emitted.map((file) => file.fileName)).toEqual(["manifest.json"]);
		const read = readArtifactManifest(emitted[0]?.source ?? "");
		expect(read).toEqual({
			manifest: {
				manifest: 1,
				name: "@addondeck/tooling",
				version: "0.0.0",
				pieces: PIECES,
			},
		});
	});
});
