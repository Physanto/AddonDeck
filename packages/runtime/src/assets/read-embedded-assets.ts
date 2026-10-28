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

type JsonObject = Readonly<Record<string, unknown>>;

function isObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toAsset(value: unknown, files: JsonObject): ResolvedAsset | null {
	if (!isObject(value)) return null;
	const { kind, file, credit } = value;
	if (typeof kind !== "string" || !ASSET_KINDS.includes(kind)) return null;
	if (credit !== undefined && typeof credit !== "string") return null;
	const url =
		value.url !== undefined
			? value.url
			: typeof file === "string" && Object.hasOwn(files, file)
				? files[file]
				: undefined;
	if (typeof url !== "string") return null;
	return {
		kind: kind as AssetKind,
		url,
		...(credit === undefined ? {} : { credit }),
	};
}

/**
 * Reads the assets the exporter embeds next to the deck text. The JSON holds
 * each file once, under `files`, and each reference written in the deck under
 * `assets`, pointing at its file; an entry may also carry its own `url`.
 *
 * @param json - The JSON text; blank text means no assets.
 *
 * @example
 * ```ts
 * readEmbeddedAssets(`{
 *   "files": { "sha256-…": "data:image/png;base64,…" },
 *   "assets": { "image:logo.png": { "kind": "image", "file": "sha256-…" } }
 * }`);
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
	if (!isObject(data)) {
		return { assets, error: "not a JSON object", invalid: [] };
	}
	const files = data.files ?? {};
	const entries = data.assets ?? {};
	if (!isObject(files)) {
		return { assets, error: '"files" is not a JSON object', invalid: [] };
	}
	if (!isObject(entries)) {
		return { assets, error: '"assets" is not a JSON object', invalid: [] };
	}
	const invalid: string[] = [];
	for (const [reference, value] of Object.entries(entries)) {
		const asset = toAsset(value, files);
		if (asset === null) invalid.push(reference);
		else assets.set(reference, asset);
	}
	return { assets, error: null, invalid };
}
