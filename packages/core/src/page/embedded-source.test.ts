// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
	escapeEmbeddedSource,
	unescapeEmbeddedSource,
} from "./embedded-source";

describe("escapeEmbeddedSource", () => {
	it("keeps a closing tag in the text from closing the script", () => {
		expect(escapeEmbeddedSource("a </script> b </SCRIPT")).toBe(
			"a <\\/script> b <\\/SCRIPT",
		);
	});

	it("escapes the start of an HTML comment", () => {
		expect(escapeEmbeddedSource("<!--<script>")).toBe("<\\!--<script>");
	});

	it("escapes a backslash after < so the text reads back the same", () => {
		expect(escapeEmbeddedSource("<\\/")).toBe("<\\\\/");
		expect(unescapeEmbeddedSource("<\\\\/")).toBe("<\\/");
	});

	it("leaves other text as it is", () => {
		expect(escapeEmbeddedSource("a < b, <b>, x\\/y")).toBe("a < b, <b>, x\\/y");
	});

	it("reads back any text and never leaves </ or <! in it", () => {
		const text = fc.stringMatching(/^[<>/!\\a-z -]*$/);
		fc.assert(
			fc.property(text, (source) => {
				const escaped = escapeEmbeddedSource(source);
				expect(escaped).not.toMatch(/<[/!]/);
				expect(unescapeEmbeddedSource(escaped)).toBe(source);
			}),
			{ numRuns: 1000 },
		);
	});
});
