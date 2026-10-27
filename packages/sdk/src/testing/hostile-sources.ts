// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockSource, SourceLine } from "@addondeck/core";

/** A block source with a label for failure messages. */
export interface LabeledSource {
	readonly label: string;
	readonly source: BlockSource;
}

const GARBAGE = "  @0 → ??? :: [[{ \"' \\ \u0000 ￿ 💥";

function mapText(
	source: BlockSource,
	change: (text: string) => string,
): readonly SourceLine[] {
	return source.body.map((line) => {
		const text = change(line.text);
		return { line: line.line, raw: text, text };
	});
}

/**
 * Variations of a valid block source that a careless or hurried author could
 * write, to check that `parse` survives them: empty and truncated bodies,
 * reordered lines, stray symbols, odd headers and very long lines.
 */
export function hostileSources(original: LabeledSource): LabeledSource[] {
	const { label, source } = original;
	const next = source.location.line + 1;
	const variants: [string, BlockSource][] = [
		["an empty body", { ...source, body: [] }],
		[
			"truncated lines",
			{
				...source,
				body: mapText(source, (text) =>
					text.slice(0, Math.ceil(text.length / 2)),
				),
			},
		],
		["lines in reverse order", { ...source, body: [...source.body].reverse() }],
		["blank lines", { ...source, body: mapText(source, () => "") }],
		[
			"stray symbols",
			{ ...source, body: mapText(source, (text) => text + GARBAGE) },
		],
		[
			"tabs and spaces",
			{ ...source, body: mapText(source, (text) => `\t ${text}\t`) },
		],
		[
			"an odd header",
			{
				...source,
				id: null,
				args: ["", "%%", "\u0000"],
				options: [
					{ key: "", name: "", value: "", location: source.location },
					{ key: "x", name: "X", value: GARBAGE, location: source.location },
				],
			},
		],
		[
			"a very long line",
			{
				...source,
				body: [
					{ line: next, raw: GARBAGE.repeat(400), text: GARBAGE.repeat(400) },
				],
			},
		],
	];
	return variants.map(([variant, changed]) => ({
		label: `${label} with ${variant}`,
		source: changed,
	}));
}
