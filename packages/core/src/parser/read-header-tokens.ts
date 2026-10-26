// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** A bare word or a `key=value` option from a block header or a `slide:` line. */
export type HeaderToken =
	| { readonly kind: "word"; readonly text: string; readonly column: number }
	| {
			readonly kind: "option";
			readonly name: string;
			readonly value: string;
			readonly column: number;
	  };

/** The tokens of a line and how the line ended. */
export interface HeaderTokens {
	readonly tokens: readonly HeaderToken[];
	/** Index just after the unquoted `:` that ended the tokens, or `null` when the line ran out first. */
	readonly colonEnd: number | null;
	/** Whether a quoted value was still open at the end of the line. */
	readonly unterminated: boolean;
}

function isSpace(character: string | undefined): boolean {
	return character !== undefined && /\s/.test(character);
}

/**
 * Splits a line into words and `key=value` options, starting at `start`.
 *
 * A value in double quotes may contain spaces and colons; `\"` stands for a
 * quote. With `stopAtColon`, an unquoted `:` ends the tokens, as it does in a
 * block header.
 */
export function readHeaderTokens(
	line: string,
	start: number,
	stopAtColon: boolean,
): HeaderTokens {
	const tokens: HeaderToken[] = [];
	const endsWord = (character: string | undefined): boolean =>
		character === undefined ||
		isSpace(character) ||
		(stopAtColon && character === ":");
	let index = start;
	let unterminated = false;

	while (index < line.length) {
		while (isSpace(line[index])) index++;
		if (index >= line.length) break;
		if (stopAtColon && line[index] === ":") {
			return { tokens, colonEnd: index + 1, unterminated };
		}

		const tokenStart = index;
		while (!endsWord(line[index]) && line[index] !== "=") index++;
		if (line[index] !== "=" || index === tokenStart) {
			while (!endsWord(line[index])) index++;
			tokens.push({
				kind: "word",
				text: line.slice(tokenStart, index),
				column: tokenStart + 1,
			});
			continue;
		}

		const name = line.slice(tokenStart, index);
		index++;
		let value = "";
		if (line[index] === '"') {
			index++;
			while (index < line.length && line[index] !== '"') {
				if (line[index] === "\\" && line[index + 1] === '"') {
					value += '"';
					index += 2;
				} else {
					value += line[index];
					index++;
				}
			}
			if (index >= line.length) unterminated = true;
			else index++;
		} else {
			const valueStart = index;
			while (!endsWord(line[index])) index++;
			value = line.slice(valueStart, index);
		}
		tokens.push({ kind: "option", name, value, column: tokenStart + 1 });
	}

	return { tokens, colonEnd: null, unterminated };
}
