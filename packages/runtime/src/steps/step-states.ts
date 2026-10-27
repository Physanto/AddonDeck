// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { StepClick } from "@addondeck/core";

/**
 * The local step of every content node that takes part in a slide's plan,
 * after its first `step` clicks: the `to` of the node's last advance among
 * them, or 0 when it has not advanced yet.
 *
 * @example
 * ```ts
 * const clicks = [[{ node: 0, from: 0, to: 1 }], [{ node: 1, from: 0, to: 2 }]];
 * stepStates(clicks, 1); // Map { 0 => 1, 1 => 0 }
 * ```
 */
export function stepStates(
	clicks: readonly StepClick[],
	step: number,
): Map<number, number> {
	const states = new Map<number, number>();
	clicks.forEach((click, index) => {
		for (const advance of click) {
			const current = states.get(advance.node) ?? 0;
			states.set(advance.node, index < step ? advance.to : current);
		}
	});
	return states;
}
