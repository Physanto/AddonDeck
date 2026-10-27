// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { afterAll, describe, expect, it } from "vitest";
import { checkBlockContract } from "./check-block-contract";
import { CONTRACT_CHECK_IDS } from "./contract-check-id";
import {
	BROKEN_REVEAL_BLOCKS,
	cleanUpLeaks,
	REVEAL_OPTIONS,
} from "./fixtures/broken-reveal-blocks";

afterAll(cleanUpLeaks);

async function failingChecks(
	options: Parameters<typeof checkBlockContract>[0],
): Promise<string[]> {
	const report = await checkBlockContract(options);
	return report.checks
		.filter((check) => check.failures.length > 0)
		.map((check) => check.id);
}

describe("checkBlockContract", () => {
	it("passes a block that follows the contract", async () => {
		const report = await checkBlockContract(REVEAL_OPTIONS);
		expect(report.checks.flatMap((check) => check.failures)).toEqual([]);
		expect(report.passed).toBe(true);
		expect(report.checks.map((check) => check.id)).toEqual([
			...CONTRACT_CHECK_IDS,
		]);
	});

	it("covers every rule with a block that breaks it", () => {
		const broken = new Set(BROKEN_REVEAL_BLOCKS.map((block) => block.breaks));
		expect(CONTRACT_CHECK_IDS.filter((id) => !broken.has(id))).toEqual([]);
	});

	it.each(
		BROKEN_REVEAL_BLOCKS.map((block, index) => [
			`${block.breaks} (${index})`,
			block,
		]),
	)("detects a block that breaks %s", async (_, block) => {
		expect(await failingChecks(block.options)).toEqual([block.breaks]);
		expect((await checkBlockContract(block.options)).passed).toBe(false);
	});
});
