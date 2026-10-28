// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	AdapterKind,
	BlockNode,
	BlockRegistry,
	Deck,
	Diagnostic,
} from "@addondeck/core";
import type { ExportDiagnosticFactory } from "../messages/create-export-diagnostic";
import type { AssetUse, DeckAnalysis } from "./deck-analysis";

// The runtime draws every text of a slide with the block of this type.
const TEXT_BLOCK = "text";

function describeError(thrown: unknown): string {
	return thrown instanceof Error ? thrown.message : String(thrown);
}

function blockAssets(
	node: BlockNode,
	registry: BlockRegistry,
	diagnostic: ExportDiagnosticFactory,
): { references: readonly string[]; problem: Diagnostic | null } {
	const definition = registry.resolve(node.type);
	if (node.model === null || definition?.assets === undefined) {
		return { references: [], problem: null };
	}
	try {
		const references = definition.assets(node.model);
		if (!references.every((reference) => typeof reference === "string")) {
			throw new Error("not a list of references");
		}
		return { references, problem: null };
	} catch (thrown) {
		return {
			references: [],
			problem: diagnostic(
				"EXPORT-W02",
				{ type: node.type, reason: describeError(thrown) },
				node.location,
			),
		};
	}
}

/**
 * Analyze stage: the blocks, adapters, theme and assets a deck uses.
 *
 * The animator is needed unless the deck's motion is `minimal`, in which case
 * the runtime animates without motion; other adapters come from the `needs`
 * of the blocks drawn.
 */
export function analyzeDeck(
	deck: Deck,
	registry: BlockRegistry,
	diagnostic: ExportDiagnosticFactory,
): { readonly analysis: DeckAnalysis; readonly diagnostics: Diagnostic[] } {
	const blocks = new Set<string>();
	const adapters = new Set<AdapterKind>();
	const assets = new Map<string, AssetUse>();
	const diagnostics: Diagnostic[] = [];
	if (deck.meta.motion !== "minimal") adapters.add("animator");

	for (const slide of deck.slides) {
		for (const node of slide.content) {
			if (node.kind === "text") {
				blocks.add(TEXT_BLOCK);
				continue;
			}
			blocks.add(node.type);
			for (const need of registry.resolve(node.type)?.needs ?? []) {
				adapters.add(need);
			}
			const { references, problem } = blockAssets(node, registry, diagnostic);
			if (problem !== null) diagnostics.push(problem);
			for (const reference of references) {
				if (!assets.has(reference)) {
					assets.set(reference, { reference, location: node.location });
				}
			}
		}
	}

	return {
		analysis: {
			blocks: [...blocks].sort(),
			adapters: [...adapters].sort(),
			theme: deck.meta.theme,
			assets: [...assets.values()],
		},
		diagnostics,
	};
}
