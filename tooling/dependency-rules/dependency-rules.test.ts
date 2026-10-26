// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { fileURLToPath } from "node:url";
import { cruise, type IViolation } from "dependency-cruiser";
import extractDepcruiseOptions from "dependency-cruiser/config-utl/extract-depcruise-options";
import { beforeAll, describe, expect, it } from "vitest";

const CONFIG_FILE = fileURLToPath(
	new URL("../../.dependency-cruiser.mjs", import.meta.url),
);
const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));

interface Finding {
	readonly rule: string;
	readonly from: string;
	readonly to: string;
}

async function cruiseFixtures(): Promise<Finding[]> {
	const options = await extractDepcruiseOptions(CONFIG_FILE);
	const result = await cruise(["packages"], {
		...options,
		baseDir: FIXTURES_DIR,
		validate: true,
	});
	if (typeof result.output === "string") {
		throw new Error("Expected a structured cruise result");
	}
	return result.output.summary.violations.map((violation: IViolation) => ({
		rule: violation.rule.name,
		from: violation.from,
		to: violation.to,
	}));
}

describe("dependency rules", () => {
	let findings: Finding[];

	beforeAll(async () => {
		findings = await cruiseFixtures();
	});

	it("rejects core importing another workspace package", () => {
		expect(findings).toContainEqual({
			rule: "core-boundaries",
			from: "packages/core/src/index.ts",
			to: "packages/sdk/src/index.ts",
		});
	});

	it("rejects a block importing another block", () => {
		expect(findings).toContainEqual({
			rule: "no-cross-block",
			from: "packages/blocks/src/list/definition.ts",
			to: "packages/blocks/src/table/definition.ts",
		});
	});

	it("allows a dependency that points inward", () => {
		expect(
			findings.filter((finding) =>
				finding.from.startsWith("packages/runtime/"),
			),
		).toEqual([]);
	});

	it("reports nothing beyond the planted violations", () => {
		expect(findings).toHaveLength(2);
	});
});
