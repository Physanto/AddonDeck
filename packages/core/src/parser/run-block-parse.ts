// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../contracts/block-definition";
import type { BlockSource } from "../contracts/block-source";
import { describeError } from "../diagnostics/describe-error";
import type { Reporter } from "./reporter";

/**
 * Hands a block's source to its definition and returns the model.
 *
 * The contract forbids `parse` to throw, but a block is third-party code: if it
 * throws, or returns something that is not a parse result, the failure becomes
 * error `E201` and the block is shown as text (`null` model) instead of
 * stopping the parser. `steps` is called once here for the same reason: a
 * block that cannot list its steps cannot be played, so it is also shown as text.
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
		if (model !== null) {
			const steps: unknown = definition.steps(model);
			if (!Array.isArray(steps)) throw new TypeError("steps is not a list");
		}
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
