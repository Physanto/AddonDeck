// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "@addondeck/core";
import { sha256 } from "../encoding/sha256";
import { toBase64 } from "../encoding/to-base64";
import type { AssetResolver, EmbeddedAssetKind } from "../io/asset-resolver";
import type { ExportDiagnosticFactory } from "../messages/create-export-diagnostic";
import type { AssetUse } from "./deck-analysis";

/** An asset reference of the deck, pointing at its embedded file. */
export interface EmbeddedAssetEntry {
	readonly kind: EmbeddedAssetKind;
	/** Key of the file in {@link CollectedAssets.files}. */
	readonly file: string;
	readonly credit?: string;
}

/** What {@link collectAssets} gathered for a deck. */
export interface CollectedAssets {
	/** Each distinct file once, as a `data:` URL, by `sha256-<hash>`. */
	readonly files: ReadonlyMap<string, string>;
	/** Each reference the deck uses, in order of first use. */
	readonly assets: ReadonlyMap<string, EmbeddedAssetEntry>;
	readonly diagnostics: readonly Diagnostic[];
}

/**
 * Collect stage, assets: resolves each reference and keeps each distinct
 * file once, by its SHA-256 hash, however many references share it.
 */
export async function collectAssets(
	uses: readonly AssetUse[],
	resolver: AssetResolver,
	diagnostic: ExportDiagnosticFactory,
): Promise<CollectedAssets> {
	const resolved = await Promise.all(
		uses.map(async (use) => {
			const file = await resolver.resolve(use.reference);
			return {
				use,
				file,
				hash: file === null ? null : await sha256(file.bytes),
			};
		}),
	);

	const files = new Map<string, string>();
	const assets = new Map<string, EmbeddedAssetEntry>();
	const diagnostics: Diagnostic[] = [];
	for (const { use, file, hash } of resolved) {
		if (file === null || hash === null) {
			diagnostics.push(
				diagnostic("EXPORT-W01", { reference: use.reference }, use.location),
			);
			continue;
		}
		const key = `sha256-${hash}`;
		if (!files.has(key)) {
			files.set(key, `data:${file.mediaType};base64,${toBase64(file.bytes)}`);
		}
		assets.set(use.reference, {
			kind: file.kind,
			file: key,
			...(file.credit === undefined ? {} : { credit: file.credit }),
		});
	}
	return { files, assets, diagnostics };
}
