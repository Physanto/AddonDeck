// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { type HeaderToken, readHeaderTokens } from "./read-header-tokens";

type WordToken = Extract<HeaderToken, { kind: "word" }>;
type OptionToken = Extract<HeaderToken, { kind: "option" }>;

/** A line shaped like `keyword [argument ...] [key=value ...]:`. */
export interface BlockHeader {
	/** The first word, as written. */
	readonly keyword: string;
	readonly args: readonly WordToken[];
	readonly options: readonly OptionToken[];
	/**
	 * `colon` when the line ends with the colon, `text` when text follows the
	 * colon, `none` when there is no colon.
	 */
	readonly ending: "colon" | "text" | "none";
}

/**
 * Reads a candidate block header. Returns `null` when the line cannot be one:
 * it does not start with a word, or a quoted value is never closed.
 *
 * @param line - An unindented line without trailing whitespace.
 */
export function readBlockHeader(line: string): BlockHeader | null {
	const { tokens, colonEnd, unterminated } = readHeaderTokens(line, 0, true);
	const [first, ...rest] = tokens;
	if (unterminated || first === undefined || first.kind !== "word") {
		return null;
	}

	let ending: BlockHeader["ending"] = "none";
	if (colonEnd !== null) {
		ending = line.slice(colonEnd).trim() === "" ? "colon" : "text";
	}
	return {
		keyword: first.text,
		args: rest.filter((token): token is WordToken => token.kind === "word"),
		options: rest.filter(
			(token): token is OptionToken => token.kind === "option",
		),
		ending,
	};
}
