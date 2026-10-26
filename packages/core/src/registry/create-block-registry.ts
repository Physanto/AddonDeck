// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../contracts/block-definition";
import { STRUCTURE_KEYWORDS } from "../parser/structure-keywords";
import { normalizeKeyword } from "../text/normalize-keyword";
import type { BlockRegistry } from "./block-registry";
import type { LanguagePack } from "./language-pack";

/** Optional parts of a block registry. */
export interface CreateBlockRegistryOptions {
	/** Language packs whose block aliases are added. Every pack is active at once. */
	readonly languagePacks?: readonly LanguagePack[];
}

/**
 * Creates the registry the parser uses to recognize blocks.
 *
 * Core knows no concrete block: whoever calls the parser decides which blocks
 * are installed. Types and aliases are normalized, so `Sequence` and `séquence`
 * both resolve to `sequence`.
 *
 * Conflicting keywords are a mistake in a block or a language pack, not in a
 * deck, so they throw instead of producing diagnostics.
 *
 * @param definitions - The installed blocks.
 * @param options - Language packs with extra aliases.
 * @returns A registry to pass to {@link parse}.
 * @throws Error when two blocks, or a block and a pack, claim the same keyword,
 * or when a block uses a keyword reserved by the format (`section`, `slide`, `notes`).
 *
 * @example
 * ```ts
 * const registry = createBlockRegistry([sequence, code], {
 *   languagePacks: [{ language: "es", blocks: { sequence: ["secuencia"] } }],
 * });
 * registry.resolve("Secuencia")?.type; // "sequence"
 * ```
 */
export function createBlockRegistry(
	definitions: readonly BlockDefinition[],
	options: CreateBlockRegistryOptions = {},
): BlockRegistry {
	const byKeyword = new Map<string, BlockDefinition>();
	const byType = new Map<string, BlockDefinition>();

	const claim = (
		keyword: string,
		definition: BlockDefinition,
		origin: string,
	): void => {
		const normalized = normalizeKeyword(keyword);
		if (normalized === "") {
			throw new Error(`${origin} declares an empty keyword.`);
		}
		if (STRUCTURE_KEYWORDS.includes(normalized)) {
			throw new Error(
				`${origin} uses "${normalized}", which the format reserves.`,
			);
		}
		const owner = byKeyword.get(normalized);
		if (owner !== undefined && owner.type !== definition.type) {
			throw new Error(
				`${origin} uses "${normalized}", which already names the block "${owner.type}".`,
			);
		}
		byKeyword.set(normalized, definition);
	};

	for (const definition of definitions) {
		const origin = `Block "${definition.type}"`;
		if (byType.has(normalizeKeyword(definition.type))) {
			throw new Error(`${origin} is registered twice.`);
		}
		byType.set(normalizeKeyword(definition.type), definition);
		claim(definition.type, definition, origin);
		for (const alias of definition.aliases) claim(alias, definition, origin);
	}

	for (const pack of options.languagePacks ?? []) {
		const origin = `Language pack "${pack.language}"`;
		for (const [type, aliases] of Object.entries(pack.blocks ?? {})) {
			const definition = byType.get(normalizeKeyword(type));
			if (definition === undefined) continue;
			for (const alias of aliases) claim(alias, definition, origin);
		}
	}

	const keywords = [...byKeyword.keys()];
	return {
		resolve: (keyword) => byKeyword.get(normalizeKeyword(keyword)),
		keywords,
	};
}
