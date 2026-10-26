// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../contracts/block-definition";
import type { BlockSource } from "../contracts/block-source";
import type { Reporter } from "./reporter";

function describeError(error: unknown): string {
	try {
		if (error instanceof Error) return error.message || error.name;
		return String(error);
	} catch {
		return typeof error;
	}
}

/**
 * Hands a block's source to its definition and returns the model.
 *
 * The contract forbids `parse` to throw, but a block is third-party code: if it
 * throws, or returns something that is not a parse result, the failure becomes
 * error `E201` and the block is shown as text (`null` model) instead of
 * stopping the parser.
 */
export function runBlockParse(
	definition: BlockDefinition,
	source: BlockSource,
	reporter: Reporter,
): unknown {
	try {
		const result = definition.parse(source);
		const diagnostics = [...result.diagnostics];
		const model = result.model ?? null;
		reporter.add(diagnostics);
		return model;
	} catch (error) {
		reporter.report("E201", source.location, {
			type: source.type,
			reason: describeError(error),
		});
		return null;
	}
}
