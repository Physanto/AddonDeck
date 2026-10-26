// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readKeyValueLine } from "./read-key-value-line";

describe("readKeyValueLine", () => {
	it("reads the word, its normalized form and the trimmed value", () => {
		expect(readKeyValueLine("Título :  Talk: part 2")).toEqual({
			keyword: "Título",
			key: "titulo",
			value: "Talk: part 2",
			valueColumn: 11,
		});
	});

	it("reads an empty value", () => {
		expect(readKeyValueLine("notes:")).toMatchObject({
			value: "",
			valueColumn: 7,
		});
	});

	it("rejects indented lines, lines without a colon and multi-word keys", () => {
		expect(readKeyValueLine("  title: x")).toBeNull();
		expect(readKeyValueLine("title")).toBeNull();
		expect(readKeyValueLine("my title: x")).toBeNull();
		expect(readKeyValueLine(": x")).toBeNull();
	});
});
