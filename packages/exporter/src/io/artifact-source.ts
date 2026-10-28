// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Where the exporter reads compiled scripts and styles from: files fetched
 * by the Studio, or read from disk by the command line.
 *
 * Each package of artifacts has a `manifest.json` at its root that lists its
 * pieces.
 */
export interface ArtifactSource {
	/**
	 * Packages of artifacts, such as `@addondeck/runtime`. When two offer the
	 * same piece, the first one listed wins.
	 */
	readonly packages: readonly string[];
	/**
	 * Reads a text file of a package.
	 *
	 * @param path - Relative to the root of the package, such as `manifest.json`.
	 * @returns The text, or `null` when the file does not exist.
	 */
	read(pkg: string, path: string): Promise<string | null>;
}
