// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readBlockHeader } from "./read-block-header";

describe("readBlockHeader", () => {
	it("reads keyword, arguments and options of a header ending with a colon", () => {
		const header = readBlockHeader(
			'code python id=client caption="Two words" :',
		);
		expect(header).toMatchObject({
			keyword: "code",
			args: [{ text: "python" }],
			options: [
				{ name: "id", value: "client" },
				{ name: "caption", value: "Two words" },
			],
			ending: "colon",
		});
	});

	it("tells text after the colon apart", () => {
		expect(readBlockHeader("Sequence: the order matters")?.ending).toBe("text");
	});

	it("tells a missing colon apart", () => {
		expect(readBlockHeader("sequence id=pay")?.ending).toBe("none");
	});

	it("rejects lines that cannot be a header", () => {
		expect(readBlockHeader(": nothing before")).toBeNull();
		expect(readBlockHeader("id=x:")).toBeNull();
		expect(readBlockHeader('image alt="open:')).toBeNull();
	});
});
