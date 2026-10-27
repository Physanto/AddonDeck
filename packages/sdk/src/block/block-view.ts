// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockContext } from "./block-context";
import type { BlockInstance } from "./block-instance";

/**
 * The visual part of a block: how to draw its model. Runs only in the browser.
 *
 * The pure part, {@link BlockDefinition}, reads the text; the view never
 * parses. Both share the same `type` and model.
 *
 * @typeParam M - The model the block's definition builds.
 *
 * @example
 * ```ts
 * const quoteView: BlockView<{ text: string }> = {
 *   type: "quote",
 *   mount(model, el) {
 *     const quote = document.createElement("blockquote");
 *     quote.className = "adk-quote";
 *     quote.textContent = model.text;
 *     el.append(quote);
 *     return {
 *       setState: () => {},
 *       play: async () => {},
 *       destroy: () => quote.remove(),
 *     };
 *   },
 * };
 * ```
 */
export interface BlockView<M = unknown> {
	/** The same type as the block's definition. */
	readonly type: string;
	/**
	 * Draws the block inside `el`, at step 0.
	 *
	 * @param model - The model the definition's `parse` returned; never `null`.
	 * @param el - An empty element that belongs to the block. Everything the block draws goes inside it.
	 * @param ctx - The runtime services.
	 * @returns The instance the runtime uses to change steps and to remove the block.
	 */
	mount(model: M, el: HTMLElement, ctx: BlockContext): BlockInstance;
}
