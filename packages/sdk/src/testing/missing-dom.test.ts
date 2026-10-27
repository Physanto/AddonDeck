// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { checkBlockContract } from "./check-block-contract";
import { REVEAL_OPTIONS } from "./fixtures/broken-reveal-blocks";

describe("checkBlockContract without a DOM", () => {
	it("explains how to enable one in every view rule", async () => {
		const report = await checkBlockContract(REVEAL_OPTIONS);
		const failing = report.checks.filter((check) => check.failures.length > 0);
		expect(failing.map((check) => check.id)).toEqual([
			"mount-shows-step-zero",
			"set-state-is-idempotent",
			"play-matches-set-state",
			"set-state-goes-back",
			"destroy-cleans-up",
		]);
		// Written without the at sign: Vitest reads that directive anywhere in a test file.
		expect(failing[0]?.failures[0]).toContain("vitest-environment happy-dom");
	});
});
