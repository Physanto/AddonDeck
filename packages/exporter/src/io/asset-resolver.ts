// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** What an embedded asset is; the runtime accepts these kinds. */
export type EmbeddedAssetKind =
	| "emoji"
	| "icon"
	| "image"
	| "video"
	| "background"
	| "font";

/** The contents of an asset, ready to embed. */
export interface AssetFile {
	readonly kind: EmbeddedAssetKind;
	/** Media type of the bytes, such as `image/png`. */
	readonly mediaType: string;
	readonly bytes: Uint8Array;
	/** Attribution the asset's license asks for. */
	readonly credit?: string;
}

/**
 * Where the exporter gets the files of the assets a deck refers to: uploads,
 * the catalog or the web.
 *
 * Uploaded SVG files are sanitized before they reach the exporter.
 */
export interface AssetResolver {
	/**
	 * @param reference - As written in the deck, such as `image:team.jpg`.
	 * @returns The file, or `null` when nothing answers to the reference.
	 */
	resolve(reference: string): Promise<AssetFile | null>;
}
