// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ArtifactSource } from "@addondeck/exporter";
import { isInside } from "./is-inside";

/** The packages of compiled artifacts an exported deck is built from. */
export const ARTIFACT_PACKAGES: readonly string[] = [
	"@addondeck/runtime",
	"@addondeck/blocks",
	"@addondeck/adapters",
];

/** How {@link createNodeArtifactSource} finds the artifacts. */
export interface NodeArtifactSourceOptions {
	/** Packages to read from, first one first; {@link ARTIFACT_PACKAGES} by default. */
	readonly packages?: readonly string[];
	/**
	 * Finds the folder that holds a package's `manifest.json`, or `null` when
	 * the package is not installed. By default Node.js resolves
	 * `<package>/manifest.json`, which each package of artifacts exports.
	 */
	readonly locate?: (pkg: string) => string | null;
}

/** The folder of an installed package's `manifest.json`, as Node.js resolves it. */
export function locateInstalledArtifacts(pkg: string): string | null {
	try {
		return dirname(fileURLToPath(import.meta.resolve(`${pkg}/manifest.json`)));
	} catch {
		return null;
	}
}

/**
 * Reads compiled artifacts from disk, for the exporter.
 *
 * A file that is missing, unreadable or outside its package's folder reads
 * as `null`, which the exporter reports.
 */
export function createNodeArtifactSource(
	options: NodeArtifactSourceOptions = {},
): ArtifactSource {
	const locate = options.locate ?? locateInstalledArtifacts;
	const folders = new Map<string, string | null>();
	const folderOf = (pkg: string): string | null => {
		if (!folders.has(pkg)) folders.set(pkg, locate(pkg));
		return folders.get(pkg) ?? null;
	};
	return {
		packages: options.packages ?? ARTIFACT_PACKAGES,
		async read(pkg, path) {
			const folder = folderOf(pkg);
			if (folder === null) return null;
			const file = resolve(folder, path);
			if (!isInside(folder, file)) return null;
			try {
				return await readFile(file, "utf8");
			} catch {
				return null;
			}
		},
	};
}
