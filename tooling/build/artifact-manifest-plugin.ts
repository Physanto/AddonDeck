// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readFileSync } from "node:fs";
import type { ArtifactManifest, ArtifactPiece } from "@addondeck/exporter";

/** The part of a bundler's plugin context the plugin uses. */
interface EmitContext {
	emitFile(file: { type: "asset"; fileName: string; source: string }): string;
}

/** A bundler plugin that adds `manifest.json` to the output. */
export interface ArtifactManifestPlugin {
	readonly name: string;
	generateBundle(this: EmitContext): void;
}

/**
 * The manifest of a package of artifacts, named and versioned after its
 * `package.json`.
 */
export function createArtifactManifest(
	packageJson: string,
	pieces: readonly ArtifactPiece[],
): ArtifactManifest {
	const { name, version } = JSON.parse(packageJson) as {
		name: string;
		version: string;
	};
	return { manifest: 1, name, version, pieces };
}

/**
 * Writes the manifest the exporter reads to learn which compiled file holds
 * each runtime, block, adapter or theme of the package.
 *
 * @param packageJson - Location of the package's `package.json`.
 */
export function artifactManifest(
	packageJson: URL,
	pieces: readonly ArtifactPiece[],
): ArtifactManifestPlugin {
	return {
		name: "addondeck-artifact-manifest",
		generateBundle() {
			const manifest = createArtifactManifest(
				readFileSync(packageJson, "utf8"),
				pieces,
			);
			this.emitFile({
				type: "asset",
				fileName: "manifest.json",
				source: `${JSON.stringify(manifest, null, "\t")}\n`,
			});
		},
	};
}
