// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AssetKind, ResolvedAsset } from "@addondeck/sdk";

const ASSET_KINDS: readonly string[] = [
	"emoji",
	"icon",
	"image",
	"video",
	"background",
	"font",
] satisfies readonly AssetKind[];

/** The assets of a deck, by the reference written in the text. */
export type EmbeddedAssets = ReadonlyMap<string, ResolvedAsset>;

/** What {@link readEmbeddedAssets} found. */
export interface EmbeddedAssetsResult {
	readonly assets: EmbeddedAssets;
	/** Why the whole JSON was unreadable, or `null`. */
	readonly error: string | null;
	/** References whose entry was not a valid asset; they are left out. */
	readonly invalid: readonly string[];
}

function toAsset(value: unknown): ResolvedAsset | null {
	if (typeof value !== "object" || value === null) return null;
	const { kind, url, credit } = value as Record<string, unknown>;
	if (typeof kind !== "string" || !ASSET_KINDS.includes(kind)) return null;
	if (typeof url !== "string") return null;
	if (credit !== undefined && typeof credit !== "string") return null;
	return {
		kind: kind as AssetKind,
		url,
		...(credit === undefined ? {} : { credit }),
	};
}

/**
 * Reads the assets the exporter embeds next to the deck text: a JSON object
 * whose keys are references and whose values are resolved assets.
 *
 * @param json - The JSON text; blank text means no assets.
 *
 * @example
 * ```ts
 * readEmbeddedAssets('{"image:logo.png": {"kind": "image", "url": "data:image/png;base64,…"}}');
 * ```
 */
export function readEmbeddedAssets(json: string): EmbeddedAssetsResult {
	const assets = new Map<string, ResolvedAsset>();
	if (json.trim() === "") return { assets, error: null, invalid: [] };
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch (thrown) {
		const error = thrown instanceof Error ? thrown.message : String(thrown);
		return { assets, error, invalid: [] };
	}
	if (typeof data !== "object" || data === null || Array.isArray(data)) {
		return { assets, error: "not a JSON object", invalid: [] };
	}
	const invalid: string[] = [];
	for (const [reference, value] of Object.entries(data)) {
		const asset = toAsset(value);
		if (asset === null) invalid.push(reference);
		else assets.set(reference, asset);
	}
	return { assets, error: null, invalid };
}
