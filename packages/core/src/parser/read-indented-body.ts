// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "../model/source-line";
import {
	indentWidth,
	isBlank,
	isIndented,
	removeIndent,
} from "../text/indentation";
import type { Reporter } from "./reporter";

/** The lines of a block body or of notes, and where the slide continues. */
export interface IndentedBody {
	/** Body lines without the base indentation and without trailing blank lines. */
	readonly lines: readonly SourceLine[];
	/** Index of the first slide line after the body. */
	readonly end: number;
}

/**
 * Reads the indented lines that follow a block header or `notes:`, up to the
 * first non-blank line without indentation.
 *
 * The first non-blank line sets the base indentation, which is removed from
 * every line. A line indented less than the base keeps its content and gets
 * warning `W312`.
 */
export function readIndentedBody(
	lines: readonly SourceLine[],
	start: number,
	reporter: Reporter,
): IndentedBody {
	let end = start;
	for (let index = start; index < lines.length; index++) {
		const raw = lines[index]?.raw ?? "";
		if (isBlank(raw)) continue;
		if (!isIndented(raw)) break;
		end = index + 1;
	}

	const taken = lines.slice(start, end);
	const base = indentWidth(taken.find((line) => !isBlank(line.raw))?.raw ?? "");
	const body = taken.map((line): SourceLine => {
		if (isBlank(line.raw)) return { ...line, text: "" };
		if (indentWidth(line.raw) >= base) {
			return { ...line, text: removeIndent(line.raw, base) };
		}
		reporter.report("W312", { line: line.line, column: 1 }, {});
		return { ...line, text: line.raw.trimStart() };
	});
	return { lines: body, end };
}
