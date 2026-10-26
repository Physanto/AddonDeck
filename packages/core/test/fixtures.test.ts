// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Each fixture is named after the diagnostic code it must produce; together
// they cover every code the format defines.

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_CODES, parse } from "../src/index";
import { createTestRegistry } from "./support/test-registry";

const FIXTURES = new URL("fixtures/", import.meta.url);
const names = readdirSync(FIXTURES).filter((name) => name.endsWith(".deck"));

function codeOf(name: string): string {
	return name.slice(0, name.indexOf("-"));
}

describe("fixtures", () => {
	it("cover every diagnostic code", () => {
		const covered = new Set(names.map(codeOf));
		expect(
			Object.keys(DIAGNOSTIC_CODES).filter((code) => !covered.has(code)),
		).toEqual([]);
	});

	it.each(names)("%s produces only its code", (name) => {
		const source = readFileSync(new URL(name, FIXTURES), "utf8");
		const { diagnostics } = parse(source, { registry: createTestRegistry() });
		expect(diagnostics.length).toBeGreaterThan(0);
		expect(new Set(diagnostics.map((diagnostic) => diagnostic.code))).toEqual(
			new Set([codeOf(name)]),
		);
	});
});
