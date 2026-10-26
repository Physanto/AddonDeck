// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Keywords in another language, added to the canonical English ones without
 * changing the parser or any block.
 *
 * @example
 * ```ts
 * const spanish: LanguagePack = {
 *   language: "es",
 *   blocks: { sequence: ["secuencia"], code: ["código"] },
 * };
 * ```
 */
export interface LanguagePack {
	/** Language tag of the pack, such as `es`. */
	readonly language: string;
	/**
	 * Extra aliases for block types, by canonical type. Aliases of types that are
	 * not installed are ignored.
	 */
	readonly blocks?: Readonly<Record<string, readonly string[]>>;
}
