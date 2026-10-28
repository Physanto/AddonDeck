// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import {
	type BlockMessages,
	createBlockDiagnostic,
} from "./create-block-diagnostic";

const MESSAGES: BlockMessages<"QUOTE-W01" | "QUOTE-E01"> = {
	"QUOTE-W01": {
		severity: "warning",
		message: "Unknown option `{name}`; it is {what}.",
	},
	"QUOTE-E01": { severity: "error", message: "The quote is empty." },
};

describe("createBlockDiagnostic", () => {
	it("renders the message of the code with its parameters, at the location", () => {
		expect(
			createBlockDiagnostic(
				MESSAGES,
				"QUOTE-W01",
				{ line: 4, column: 9 },
				{ name: "size" },
			),
		).toEqual({
			severity: "warning",
			code: "QUOTE-W01",
			line: 4,
			column: 9,
			message: "Unknown option `size`; it is {what}.",
			params: { name: "size" },
		});
	});

	it("takes the severity from the catalog", () => {
		const diagnostic = createBlockDiagnostic(MESSAGES, "QUOTE-E01", {
			line: 1,
			column: 1,
		});
		expect(diagnostic.severity).toBe("error");
		expect(diagnostic.params).toEqual({});
	});
});
