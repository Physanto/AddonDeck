// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Examples must stay valid: they are what users and language models copy.

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "../src/index";
import { createTestRegistry } from "./support/test-registry";

const EXAMPLES = new URL("../../../examples/", import.meta.url);
const names = readdirSync(EXAMPLES).filter((name) => name.endsWith(".deck"));

describe("examples", () => {
	it("are present", () => {
		expect(names.length).toBeGreaterThan(0);
	});

	it.each(names)("%s parses without diagnostics", (name) => {
		const source = readFileSync(new URL(name, EXAMPLES), "utf8");
		const { deck, diagnostics } = parse(source, {
			registry: createTestRegistry(),
		});
		expect(diagnostics).toEqual([]);
		expect(deck).toMatchSnapshot();
	});
});
