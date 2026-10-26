// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../../src/contracts/block-definition";
import type { BlockRegistry } from "../../src/registry/block-registry";
import { createBlockRegistry } from "../../src/registry/create-block-registry";

/** Test block that accepts any body and keeps its lines as the model. */
export const SEQUENCE_BLOCK: BlockDefinition<readonly string[]> = {
	type: "sequence",
	aliases: [],
	version: "0.0.0",
	parse: (source) => ({
		model: source.body.map((line) => line.text),
		diagnostics: [],
	}),
	steps: () => [],
};

/** Test block that always throws while parsing, to exercise `E201`. */
export const EXPLODE_BLOCK: BlockDefinition = {
	type: "explode",
	aliases: [],
	version: "0.0.0",
	parse: () => {
		throw new Error("boom");
	},
	steps: () => [],
};

/** The registry the fixtures and the examples are parsed with. */
export function createTestRegistry(): BlockRegistry {
	return createBlockRegistry([SEQUENCE_BLOCK, EXPLODE_BLOCK]);
}
