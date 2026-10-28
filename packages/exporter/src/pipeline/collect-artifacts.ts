// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { Diagnostic } from "@addondeck/core";
import {
	type ArtifactPiece,
	MANIFEST_FILE,
	readArtifactManifest,
} from "../artifacts/artifact-manifest";
import type { ArtifactSource } from "../io/artifact-source";
import type { ExportDiagnosticFactory } from "../messages/create-export-diagnostic";
import type { DeckAnalysis } from "./deck-analysis";

/** The compiled files of one piece the page includes. */
export interface CollectedPiece {
	readonly name: string;
	readonly script: string | null;
	readonly styles: string | null;
}

/** What {@link collectArtifacts} gathered for a deck. */
export interface CollectedArtifacts {
	/** The runtime and its version, or `null` when its script is missing. */
	readonly runtime: (CollectedPiece & { readonly version: string }) | null;
	readonly theme: CollectedPiece | null;
	/** In the order of the analysis; a piece whose script is missing is left out. */
	readonly adapters: readonly CollectedPiece[];
	readonly blocks: readonly CollectedPiece[];
	readonly diagnostics: readonly Diagnostic[];
}

interface Offer {
	readonly pkg: string;
	readonly version: string;
	readonly piece: ArtifactPiece;
}

async function readOffers(
	source: ArtifactSource,
	diagnostic: ExportDiagnosticFactory,
	diagnostics: Diagnostic[],
): Promise<Map<string, Offer>> {
	const manifests = await Promise.all(
		source.packages.map(async (pkg) => ({
			pkg,
			json: await source.read(pkg, MANIFEST_FILE),
		})),
	);
	const offers = new Map<string, Offer>();
	for (const { pkg, json } of manifests) {
		const read =
			json === null
				? { error: `${MANIFEST_FILE} is missing` }
				: readArtifactManifest(json);
		if ("error" in read) {
			diagnostics.push(
				diagnostic("EXPORT-E02", { package: pkg, reason: read.error }),
			);
			continue;
		}
		for (const piece of read.manifest.pieces) {
			const key = `${piece.kind}:${piece.name}`;
			if (!offers.has(key)) {
				offers.set(key, { pkg, version: read.manifest.version, piece });
			}
		}
	}
	return offers;
}

/** The files of a piece, with the problems found reading them. */
interface ReadPiece extends CollectedPiece {
	readonly version: string;
	readonly problems: readonly Diagnostic[];
}

/**
 * Collect stage, artifacts: the scripts and styles of the runtime, the theme,
 * and the adapters and blocks the analysis lists, read through `source`.
 * Problems come in a fixed order, however the reads finish.
 */
export async function collectArtifacts(
	analysis: DeckAnalysis,
	source: ArtifactSource,
	diagnostic: ExportDiagnosticFactory,
): Promise<CollectedArtifacts> {
	const diagnostics: Diagnostic[] = [];
	const offers = await readOffers(source, diagnostic, diagnostics);

	const read = async (offer: Offer): Promise<ReadPiece> => {
		const problems: Diagnostic[] = [];
		const readFile = async (path: string | undefined) => {
			if (path === undefined) return null;
			const text = await source.read(offer.pkg, path);
			if (text === null) {
				problems.push(diagnostic("EXPORT-E05", { package: offer.pkg, path }));
			}
			return text;
		};
		const [script, styles] = await Promise.all([
			readFile(offer.piece.script),
			readFile(offer.piece.styles),
		]);
		return {
			name: offer.piece.name,
			script,
			styles,
			version: offer.version,
			problems,
		};
	};

	/** A block or an adapter, which is of no use without its script. */
	const readPlugin = async (
		kind: "block" | "adapter",
		name: string,
	): Promise<ReadPiece | Diagnostic> => {
		const offer = offers.get(`${kind}:${name}`);
		if (offer?.piece.script === undefined) {
			return kind === "block"
				? diagnostic("EXPORT-E03", { type: name })
				: diagnostic("EXPORT-E04", { adapter: name });
		}
		return read(offer);
	};

	const runtimeOffer = offers.get("runtime:runtime");
	const themeOffer = offers.get(`theme:${analysis.theme}`);
	const [runtime, theme, adapters, blocks] = await Promise.all([
		runtimeOffer === undefined ? null : read(runtimeOffer),
		themeOffer === undefined ? null : read(themeOffer),
		Promise.all(analysis.adapters.map((name) => readPlugin("adapter", name))),
		Promise.all(analysis.blocks.map((name) => readPlugin("block", name))),
	]);

	const pieces = (results: readonly (ReadPiece | Diagnostic)[]) => {
		const found: CollectedPiece[] = [];
		for (const result of results) {
			if ("severity" in result) {
				diagnostics.push(result);
				continue;
			}
			diagnostics.push(...result.problems);
			if (result.script !== null) found.push(toPiece(result));
		}
		return found;
	};

	if (runtime !== null) diagnostics.push(...runtime.problems);
	const usable = runtime !== null && runtime.script !== null ? runtime : null;
	if (usable === null) {
		diagnostics.push(
			diagnostic("EXPORT-E01", { packages: source.packages.join(", ") }),
		);
	}
	if (theme !== null) diagnostics.push(...theme.problems);
	const collectedAdapters = pieces(adapters);
	const collectedBlocks = pieces(blocks);
	return {
		runtime:
			usable === null ? null : { ...toPiece(usable), version: usable.version },
		theme: theme === null ? null : toPiece(theme),
		adapters: collectedAdapters,
		blocks: collectedBlocks,
		diagnostics,
	};
}

function toPiece({ name, script, styles }: CollectedPiece): CollectedPiece {
	return { name, script, styles };
}
