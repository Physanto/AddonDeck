// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** File name of the manifest at the root of a package of artifacts. */
export const MANIFEST_FILE = "manifest.json";

/** Version of the manifest layout this exporter reads. */
export const MANIFEST_VERSION = 1;

/** What a piece of an exported page is. */
export type ArtifactPieceKind = "runtime" | "block" | "adapter" | "theme";

const PIECE_KINDS: readonly string[] = [
	"runtime",
	"block",
	"adapter",
	"theme",
] satisfies readonly ArtifactPieceKind[];

/**
 * One piece an exported page can include, with the compiled files it brings.
 * Paths are relative to the package of artifacts.
 */
export interface ArtifactPiece {
	readonly kind: ArtifactPieceKind;
	/** Block type, adapter kind or theme name; `runtime` for the runtime. */
	readonly name: string;
	/** A classic script; blocks and adapters register themselves when it runs. */
	readonly script?: string;
	readonly styles?: string;
}

/**
 * What a package of compiled artifacts offers to the exporter. The build of
 * each package writes it as `manifest.json` next to its files.
 *
 * @example
 * ```json
 * {
 *   "manifest": 1,
 *   "name": "@addondeck/blocks",
 *   "version": "0.1.0",
 *   "pieces": [
 *     { "kind": "block", "name": "list", "script": "browser/list.iife.js", "styles": "list/styles.css" }
 *   ]
 * }
 * ```
 */
export interface ArtifactManifest {
	readonly manifest: typeof MANIFEST_VERSION;
	/** npm name of the package. */
	readonly name: string;
	readonly version: string;
	readonly pieces: readonly ArtifactPiece[];
}

type JsonObject = Readonly<Record<string, unknown>>;

function isObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
	return value === undefined || typeof value === "string";
}

function toPiece(value: unknown): ArtifactPiece | null {
	if (!isObject(value)) return null;
	const { kind, name, script, styles } = value;
	if (typeof kind !== "string" || !PIECE_KINDS.includes(kind)) return null;
	if (typeof name !== "string" || name === "") return null;
	if (!isOptionalString(script) || !isOptionalString(styles)) return null;
	if (script === undefined && styles === undefined) return null;
	return {
		kind: kind as ArtifactPieceKind,
		name,
		...(script === undefined ? {} : { script }),
		...(styles === undefined ? {} : { styles }),
	};
}

/**
 * Reads the text of a `manifest.json`.
 *
 * @returns The manifest, or why it cannot be used.
 */
export function readArtifactManifest(
	json: string,
): { readonly manifest: ArtifactManifest } | { readonly error: string } {
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch (thrown) {
		return { error: thrown instanceof Error ? thrown.message : String(thrown) };
	}
	if (!isObject(data)) return { error: "not a JSON object" };
	if (data.manifest !== MANIFEST_VERSION) {
		return { error: `unsupported manifest version ${String(data.manifest)}` };
	}
	const { name, version, pieces } = data;
	if (typeof name !== "string" || typeof version !== "string") {
		return { error: "missing name or version" };
	}
	if (!Array.isArray(pieces)) return { error: '"pieces" is not a list' };
	const read: ArtifactPiece[] = [];
	for (const [index, value] of pieces.entries()) {
		const piece = toPiece(value);
		if (piece === null) return { error: `piece ${index + 1} is not valid` };
		read.push(piece);
	}
	return {
		manifest: { manifest: MANIFEST_VERSION, name, version, pieces: read },
	};
}
