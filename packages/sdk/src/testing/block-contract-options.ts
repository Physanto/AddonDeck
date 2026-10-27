// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition, LanguagePack } from "@addondeck/core";
import type { BlockView } from "../block/block-view";
import type { TestContext } from "./create-test-context";

/** An example deck of a block, usually read from its `examples/` folder. */
export interface BlockExample {
	/** File name or another label, used in failure messages. */
	readonly name: string;
	/** The deck text. */
	readonly source: string;
}

/**
 * What the block contract suite checks: one block, its examples and its documentation.
 *
 * @typeParam M - The model of the block.
 */
export interface BlockContractOptions<M = unknown> {
	/** The pure part of the block. */
	readonly definition: BlockDefinition<M>;
	/** The visual part of the block. */
	readonly view: BlockView<M>;
	/** Example decks. Each must use the block and be free of errors and warnings. */
	readonly examples: readonly BlockExample[];
	/** Contents of the block's `docs.md`. */
	readonly docs: string;
	/**
	 * Translations of `docs.md`, by language tag: the contents of `docs.<language>.md`,
	 * or `null` to mark one as pending.
	 */
	readonly translations?: Readonly<Record<string, string | null>>;
	/** Language packs that add aliases for the block; each needs an entry in `translations`. */
	readonly languagePacks?: readonly LanguagePack[];
	/** Other blocks the examples use, such as the target of a `→ id`. */
	readonly blocks?: readonly BlockDefinition[];
	/** Creates the context of each mount. Defaults to {@link createTestContext}. */
	readonly createContext?: () => TestContext;
	/**
	 * Milliseconds `play` may take before it counts as stuck. With the instant
	 * animator it should end at once; defaults to 2000.
	 */
	readonly playTimeout?: number;
}
