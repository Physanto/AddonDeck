// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Width of a tab when measuring indentation, as the specification defines. */
const TAB_WIDTH = 2;

function isIndentCharacter(character: string | undefined): boolean {
	return character === " " || character === "\t";
}

/** Whether a line starts with a space or a tab. */
export function isIndented(line: string): boolean {
	return isIndentCharacter(line[0]);
}

/** Whether a line has nothing but whitespace. */
export function isBlank(line: string): boolean {
	return line.trim() === "";
}

/** Width of the leading spaces and tabs of a line, counting a tab as two spaces. */
export function indentWidth(line: string): number {
	let width = 0;
	for (const character of line) {
		if (character === " ") width += 1;
		else if (character === "\t") width += TAB_WIDTH;
		else break;
	}
	return width;
}

/**
 * Removes leading spaces and tabs from a line until at least `width` columns
 * of indentation are gone, keeping any deeper indentation.
 */
export function removeIndent(line: string, width: number): string {
	let removed = 0;
	let index = 0;
	while (removed < width && isIndentCharacter(line[index])) {
		removed += line[index] === "\t" ? TAB_WIDTH : 1;
		index++;
	}
	return line.slice(index);
}
