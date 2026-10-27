// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { extractStepAnnotations } from "../annotations/extract-step-annotations";
import type { TextNode } from "../model/text-node";
import { closesFence, type Fence, readFence } from "../parser/fence";
import type { ParticipantStep } from "./participant";

/**
 * The steps of a text: one per annotated line, in order.
 *
 * Reads the lines the parser read annotations from, so it skips code fences.
 * Diagnostics of the annotations were already reported while parsing.
 */
export function readTextSteps(node: TextNode): ParticipantStep[] {
	const steps: ParticipantStep[] = [];
	let fence: Fence | null = null;
	for (const line of node.lines) {
		if (fence !== null) {
			if (closesFence(fence, line.raw.trimEnd())) fence = null;
			continue;
		}
		fence = readFence(line.raw);
		if (fence !== null) continue;

		const { annotation } = extractStepAnnotations(line);
		if (annotation === null) continue;
		steps.push({
			at: annotation.step,
			triggers: annotation.triggers.map((id) => ({
				id,
				location: annotation.location,
				reportUnknown: false,
			})),
			location: annotation.location,
		});
	}
	return steps;
}
