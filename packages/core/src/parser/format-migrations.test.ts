// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { FORMAT_MIGRATIONS, migrateToCurrent } from "./format-migrations";

describe("migrateToCurrent", () => {
	const lines = ["format: 1", "# Hello"];

	it("has no migrations while format 1 is the only version", () => {
		expect(FORMAT_MIGRATIONS).toEqual([]);
		expect(migrateToCurrent(lines, 1)).toBe(lines);
	});

	it("leaves the lines alone when no version was declared", () => {
		expect(
			migrateToCurrent(lines, null, [{ from: 0, migrate: () => [] }]),
		).toBe(lines);
	});

	it("applies, in order, the migrations from the declared version up to the current one", () => {
		const migrations = [
			{ from: 0, migrate: (input: readonly string[]) => [...input, "from 0"] },
			{ from: 1, migrate: (input: readonly string[]) => [...input, "from 1"] },
		];
		expect(migrateToCurrent(lines, 0, migrations)).toEqual([
			...lines,
			"from 0",
		]);
	});
});
