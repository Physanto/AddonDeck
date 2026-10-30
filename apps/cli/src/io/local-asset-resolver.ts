// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import type { AssetFile, AssetResolver } from "@addondeck/exporter";
import { isInside } from "./is-inside";
import { mediaTypeOf } from "./media-types";

const LOCAL = /^image:(.+)$/i;

/** Where a deck's images are looked for, in order, inside its folder. */
export const ASSET_FOLDERS: readonly string[] = [".", "assets"];

/**
 * Resolves `image:<path>` references to files of the deck's folder: first
 * relative to it, then to its `assets/` folder, where uploaded images are
 * kept by name.
 *
 * Only images and videos the page can show are read, and never from outside
 * the deck's folder, symbolic links included: a deck from elsewhere cannot
 * embed other files of the computer in the page. Everything else, such as
 * `url:` and catalog references, is not found.
 *
 * @param folder - The folder of the `.deck` file.
 */
export function createLocalAssetResolver(folder: string): AssetResolver {
	const read = async (file: string): Promise<AssetFile | null> => {
		const type = mediaTypeOf(file);
		if (type === null) return null;
		try {
			const [root, real] = await Promise.all([
				realpath(folder),
				realpath(file),
			]);
			if (!isInside(root, real)) return null;
			return { ...type, bytes: new Uint8Array(await readFile(real)) };
		} catch {
			return null;
		}
	};
	return {
		async resolve(reference) {
			const path = LOCAL.exec(reference)?.[1];
			if (path === undefined) return null;
			for (const place of ASSET_FOLDERS) {
				const found = await read(resolve(folder, place, path));
				if (found !== null) return found;
			}
			return null;
		},
	};
}
