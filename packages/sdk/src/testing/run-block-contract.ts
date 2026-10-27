// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import type { BlockContractOptions } from "./block-contract-options";
import { CONTRACT_CHECKS } from "./contract-checks";
import { prepareSubject } from "./contract-subject";

/**
 * Registers the block contract suite with Vitest: one test per rule, inside a
 * `describe` named after the block.
 *
 * Every block runs it from its test file, which needs a DOM:
 *
 * - `parse` never throws, and its diagnostics have a line inside the block;
 * - `steps` lists valid steps;
 * - `mount` shows step 0, `setState` is idempotent and goes back correctly,
 *   and `play` ends in the same state as `setState`;
 * - `destroy` leaves no nodes, listeners, timers or subscriptions;
 * - `docs.md` exists, every example is valid, and language packs have
 *   translations or mark them as pending.
 *
 * @param options - The block, its examples and its documentation.
 *
 * @example
 * ```ts
 * // @vitest-environment happy-dom
 * import { runBlockContract } from "@addondeck/sdk/testing";
 * import docs from "./docs.md?raw";
 * import payment from "./examples/payment.deck?raw";
 * import { sequence } from "./definition";
 * import { sequenceView } from "./view";
 *
 * runBlockContract({
 *   definition: sequence,
 *   view: sequenceView,
 *   examples: [{ name: "payment.deck", source: payment }],
 *   docs,
 * });
 * ```
 */
export function runBlockContract<M>(options: BlockContractOptions<M>): void {
	describe(`${options.definition.type} block contract`, () => {
		for (const check of CONTRACT_CHECKS) {
			it(check.title, async () => {
				const subject = prepareSubject(options as BlockContractOptions);
				expect(await check.run(subject)).toEqual([]);
			});
		}
	});
}
