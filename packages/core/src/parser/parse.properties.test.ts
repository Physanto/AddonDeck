// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createTestRegistry } from "../../test/support/test-registry";
import { parse } from "./parse";

const registry = createTestRegistry();
const RUNS = { numRuns: 1000 };

/** Lines that exercise every part of the format, mixed with arbitrary text. */
const deckLine = fc.oneof(
	fc.constantFrom(
		"",
		"---",
		"format: 1",
		"format: 2",
		"format: x",
		"title: T",
		"titel: T",
		"theme: neon",
		"watermark: maybe",
		"section: S",
		"section:",
		"slide: layout=rows transition=zom columns",
		'slide: background="night sky',
		"notes:",
		"Notes: text",
		"sequence id=a:",
		"sequence id=1x:",
		"secuence id=b:",
		"sequence id=a",
		"Sequence: text",
		'sequence caption="open:',
		"explode:",
		"  A -> B  @1 → a",
		"    deeper",
		"\tTabbed",
		" one space",
		"- item  @2 → a",
		"- item @3",
		"- item  @0",
		"# Heading",
		"```js",
		"~~~",
		"// comment",
		"\\escaped",
		"<b>html</b>",
	),
	fc.string({ unit: "binary", maxLength: 40 }),
);

const deckText = fc
	.array(deckLine, { maxLength: 40 })
	.chain((lines) =>
		fc.constantFrom("\n", "\r\n", "\r").map((ending) => lines.join(ending)),
	);

const anyText = fc.oneof(
	fc.string({ unit: "binary", maxLength: 400 }),
	deckText,
);

describe("parse properties", () => {
	it("never throws, whatever the text", () => {
		fc.assert(
			fc.property(anyText, (text) => {
				parse(text, { registry });
			}),
			RUNS,
		);
	});

	it("is deterministic", () => {
		fc.assert(
			fc.property(anyText, (text) => {
				expect(parse(text, { registry })).toEqual(parse(text, { registry }));
			}),
			RUNS,
		);
	});

	it("reports every diagnostic inside the text", () => {
		fc.assert(
			fc.property(anyText, (text) => {
				const lineCount = text.split(/\r\n|\r|\n/).length;
				for (const diagnostic of parse(text, { registry }).diagnostics) {
					expect(diagnostic.line).toBeGreaterThanOrEqual(1);
					expect(diagnostic.line).toBeLessThanOrEqual(lineCount);
					expect(diagnostic.column).toBeGreaterThanOrEqual(1);
				}
			}),
			RUNS,
		);
	});

	it("produces plain data that survives serialization", () => {
		fc.assert(
			fc.property(anyText, (text) => {
				const { deck } = parse(text, { registry });
				expect(JSON.parse(JSON.stringify(deck))).toEqual(deck);
			}),
			RUNS,
		);
	});
});
