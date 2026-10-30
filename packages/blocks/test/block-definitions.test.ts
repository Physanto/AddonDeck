// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createBlockRegistry, parse } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { BLOCK_DEFINITIONS } from "../src/index";

const SOURCES = join(import.meta.dirname, "../src");

describe("BLOCK_DEFINITIONS", () => {
	it("lists every folder the build finds a block in", () => {
		const folders = readdirSync(SOURCES, { withFileTypes: true })
			.filter(
				(entry) =>
					entry.isDirectory() &&
					existsSync(join(SOURCES, entry.name, "definition.ts")),
			)
			.map((entry) => entry.name)
			.sort();
		expect(
			BLOCK_DEFINITIONS.map((definition) => definition.type).sort(),
		).toEqual(folders);
	});

	it("parses a deck without a browser", () => {
		const { diagnostics } = parse(
			'format: 1\n\n- one\n- two\n\nimage a.png alt="":',
			{
				registry: createBlockRegistry(BLOCK_DEFINITIONS),
			},
		);
		expect(diagnostics.filter((d) => d.severity !== "info")).toEqual([]);
	});
});
