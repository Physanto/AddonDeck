// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// The format specification is written by hand; these tests keep its tables in
// step with the constants the parser uses.

import { readFileSync } from "node:fs";
import {
	DEFAULT_DECK_META,
	DEFAULT_SLIDE_OPTIONS,
	DIAGNOSTIC_CODES,
	HEADER_KEYS,
	MOTION_PERSONALITIES,
	SLIDE_LAYOUTS,
	SLIDE_TRANSITIONS,
} from "@addondeck/core";
import { describe, expect, it } from "vitest";

const SPEC = readFileSync(
	new URL("../../docs/format/v1.md", import.meta.url),
	"utf8",
);

/** Returns the rows of the first table after a heading, as lists of cells. */
function tableAfter(heading: string): string[][] {
	const start = SPEC.indexOf(`\n${heading}\n`);
	if (start === -1) throw new Error(`Heading not found: ${heading}`);
	const lines = SPEC.slice(start).split("\n");
	const first = lines.findIndex((line) => line.startsWith("|"));
	const rows: string[][] = [];
	for (const line of lines.slice(first + 2)) {
		if (!line.startsWith("|")) break;
		rows.push(
			line
				.split("|")
				.slice(1, -1)
				.map((cell) => cell.trim()),
		);
	}
	return rows;
}

/** Returns the words written in backticks in a table cell. */
function codeWords(cell: string | undefined): string[] {
	return [...(cell ?? "").matchAll(/`([^`]+)`/g)].map(
		(match) => match[1] ?? "",
	);
}

function rowFor(rows: string[][], key: string): string[] {
	const row = rows.find((cells) => codeWords(cells[0])[0] === key);
	if (row === undefined) throw new Error(`Row not found: ${key}`);
	return row;
}

describe("format specification", () => {
	it("lists every diagnostic code the parser can report, and no other", () => {
		const section =
			SPEC.split("\n## Diagnostics\n")[1]?.split("\n## ")[0] ?? "";
		const listed = [...section.matchAll(/^\| `([EWI]\d{3})` \|/gm)].map(
			(match) => match[1],
		);
		expect(listed).toEqual(Object.keys(DIAGNOSTIC_CODES));
	});

	it("documents every header key", () => {
		const keys = tableAfter("### Header keys").map(
			(cells) => codeWords(cells[0])[0],
		);
		expect(keys).toEqual([...HEADER_KEYS]);
	});

	it("documents the header defaults the parser uses", () => {
		const rows = tableAfter("### Header keys");
		expect(codeWords(rowFor(rows, "format")[2])).toEqual([
			String(DEFAULT_DECK_META.format),
		]);
		expect(codeWords(rowFor(rows, "language")[2])).toEqual([
			DEFAULT_DECK_META.language,
		]);
		expect(codeWords(rowFor(rows, "theme")[2])).toEqual([
			DEFAULT_DECK_META.theme,
		]);
		expect(codeWords(rowFor(rows, "motion")[2])).toEqual([
			DEFAULT_DECK_META.motion,
		]);
		expect(codeWords(rowFor(rows, "watermark")[2])).toEqual([
			DEFAULT_DECK_META.watermark ? "on" : "off",
		]);
	});

	it("documents the motion personalities", () => {
		expect(
			codeWords(rowFor(tableAfter("### Header keys"), "motion")[1]),
		).toEqual([...MOTION_PERSONALITIES]);
	});

	it("documents the slide options with their values and defaults", () => {
		const rows = tableAfter("### `slide:`");
		expect(codeWords(rowFor(rows, "transition")[1])).toEqual([
			...SLIDE_TRANSITIONS,
		]);
		expect(codeWords(rowFor(rows, "transition")[2])).toEqual([
			DEFAULT_SLIDE_OPTIONS.transition,
		]);
		expect(codeWords(rowFor(rows, "layout")[1])).toEqual([...SLIDE_LAYOUTS]);
		expect(codeWords(rowFor(rows, "layout")[2])).toEqual([
			DEFAULT_SLIDE_OPTIONS.layout,
		]);
	});
});
