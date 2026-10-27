// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { extractStepAnnotations } from "../../src/annotations/extract-step-annotations";
import type { BlockDefinition } from "../../src/contracts/block-definition";
import type { StepDef } from "../../src/contracts/step-def";
import type { SourceLine } from "../../src/model/source-line";
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

/** Test block with one step per body line, read with the shared annotation helper. */
export const REVEAL_BLOCK: BlockDefinition<readonly SourceLine[]> = {
	type: "reveal",
	aliases: [],
	version: "0.0.0",
	parse: (source) => ({ model: source.body, diagnostics: [] }),
	steps: (lines) =>
		lines.map((line): StepDef => {
			const { annotation } = extractStepAnnotations(line);
			return {
				at: annotation?.step ?? null,
				triggers: annotation?.triggers ?? [],
				location: annotation?.location ?? { line: line.line, column: 1 },
			};
		}),
};

/** The registry the fixtures and the examples are parsed with. */
export function createTestRegistry(): BlockRegistry {
	return createBlockRegistry([SEQUENCE_BLOCK, EXPLODE_BLOCK, REVEAL_BLOCK]);
}
