// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AdapterKind } from "./adapter-kind";
import type { BlockSource } from "./block-source";
import type { ParseResult } from "./parse-result";
import type { StepDef } from "./step-def";

/**
 * The pure part of a block: how to read its text and which steps it offers.
 *
 * It never touches the DOM, so the parser, the command line and the exporter can
 * use it in Node.js as well as in the browser. Drawing belongs to the block's view.
 *
 * @typeParam M - The model the block builds from its source.
 *
 * @example
 * ```ts
 * const quote: BlockDefinition<{ text: string }> = {
 *   type: "quote",
 *   aliases: [],
 *   version: "1.0.0",
 *   parse: (source) => ({
 *     model: { text: source.body.map((line) => line.text).join("\n") },
 *     diagnostics: [],
 *   }),
 *   steps: () => [],
 * };
 * ```
 */
export interface BlockDefinition<M = unknown> {
	/** Canonical English keyword of the block, such as `sequence`. */
	readonly type: string;
	/** Other English keywords for the block. Language packs add more without changing the block. */
	readonly aliases: readonly string[];
	/** Version of the block, in semver. */
	readonly version: string;
	/** Adapters the block uses; the exporter includes only those. */
	readonly needs?: readonly AdapterKind[];
	/**
	 * Reads the block's source. Must never throw: report problems as diagnostics.
	 */
	parse(source: BlockSource): ParseResult<M>;
	/** Steps the block offers, in order of appearance. */
	steps(model: M): readonly StepDef[];
	/**
	 * References of the assets the block shows, such as `image:team.jpg`. The
	 * exporter embeds only these, so a block that leaves it out gets no assets.
	 */
	assets?(model: M): readonly string[];
}
