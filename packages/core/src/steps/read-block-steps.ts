// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../contracts/block-definition";
import { describeError } from "../diagnostics/describe-error";
import type { BlockNode } from "../model/block-node";
import type { SourceLocation } from "../model/source-location";
import type { Reporter } from "../parser/reporter";
import { normalizeKeyword } from "../text/normalize-keyword";
import type { ParticipantStep } from "./participant";

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
	return typeof value === "object" && value !== null;
}

function isLocation(value: unknown): value is SourceLocation {
	return (
		isRecord(value) &&
		typeof value.line === "number" &&
		typeof value.column === "number"
	);
}

function readStep(value: unknown, fallback: SourceLocation): ParticipantStep {
	const step = isRecord(value) ? value : {};
	const at =
		typeof step.at === "number" && Number.isSafeInteger(step.at) && step.at >= 1
			? step.at
			: null;
	const location = isLocation(step.location) ? step.location : fallback;
	const ids = Array.isArray(step.triggers) ? step.triggers : [];
	return {
		at,
		triggers: ids
			.filter((id): id is string => typeof id === "string")
			.map((id) => ({
				id: normalizeKeyword(id),
				location,
				reportUnknown: true,
			})),
		location,
	};
}

/**
 * The steps a block offers, as its definition lists them.
 *
 * The definition is third-party code, so what it returns is checked: an
 * invalid `at` follows the default order, and a step without location points
 * at the block header. If `steps` throws, the block offers no steps and the
 * failure becomes error `E201`.
 */
export function readBlockSteps(
	node: BlockNode,
	definition: BlockDefinition,
	reporter: Reporter,
): ParticipantStep[] {
	if (node.model === null) return [];
	try {
		const steps: unknown = definition.steps(node.model);
		if (!Array.isArray(steps)) throw new TypeError("steps is not a list");
		return steps.map((step: unknown) => readStep(step, node.location));
	} catch (error) {
		reporter.report("E201", node.location, {
			type: node.type,
			reason: describeError(error),
		});
		return [];
	}
}
