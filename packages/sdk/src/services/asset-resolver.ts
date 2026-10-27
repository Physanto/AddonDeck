// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Kinds of asset a reference can point to. */
export type AssetKind =
	| "emoji"
	| "icon"
	| "image"
	| "video"
	| "background"
	| "font";

/** An asset ready to use in the page. */
export interface ResolvedAsset {
	/** What the asset is, which decides how to show it. */
	readonly kind: AssetKind;
	/** URL to use in `src` or CSS, usually a `data:` URL embedded in the exported file. */
	readonly url: string;
	/** Credit to show when the asset's license asks for attribution. */
	readonly credit?: string;
}

/**
 * Finds the assets that deck text refers to, such as `🐕`, `emoji:dog`,
 * `icon:lucide/heart` or `image:photo.jpg`.
 *
 * Resolving is synchronous: by the time a block is mounted, the exporter or
 * the Studio has already embedded every asset the deck uses.
 */
export interface AssetResolver {
	/**
	 * @param reference - The reference as written in the deck.
	 * @returns The asset, or `null` when the reference names nothing known.
	 */
	resolve(reference: string): ResolvedAsset | null;
}
