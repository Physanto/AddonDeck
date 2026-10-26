// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readHeaderTokens } from "./read-header-tokens";

describe("readHeaderTokens", () => {
	it("splits words and options, with their columns", () => {
		expect(readHeaderTokens("code python id=client:", 0, true)).toEqual({
			tokens: [
				{ kind: "word", text: "code", column: 1 },
				{ kind: "word", text: "python", column: 6 },
				{ kind: "option", name: "id", value: "client", column: 13 },
			],
			colonEnd: 22,
			unterminated: false,
		});
	});

	it("reads quoted values with spaces, colons and escaped quotes", () => {
		const { tokens } = readHeaderTokens(
			'image alt="Say \\"hi\\": now":',
			0,
			true,
		);
		expect(tokens[1]).toMatchObject({ name: "alt", value: 'Say "hi": now' });
	});

	it("reports a quoted value that is never closed", () => {
		const result = readHeaderTokens('image alt="open:', 0, true);
		expect(result.unterminated).toBe(true);
		expect(result.colonEnd).toBeNull();
	});

	it("keeps going past colons when asked to", () => {
		const { tokens, colonEnd } = readHeaderTokens(
			"slide: background=url:x",
			6,
			false,
		);
		expect(colonEnd).toBeNull();
		expect(tokens).toEqual([
			{ kind: "option", name: "background", value: "url:x", column: 8 },
		]);
	});

	it("reads a word that starts with an equals sign as a word", () => {
		const { tokens } = readHeaderTokens("a =b", 0, false);
		expect(tokens[1]).toEqual({ kind: "word", text: "=b", column: 3 });
	});

	it("reads an empty value", () => {
		const { tokens } = readHeaderTokens("layout= x", 0, false);
		expect(tokens[0]).toMatchObject({ kind: "option", value: "" });
	});
});
