// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ContractCheck } from "./contract-check";
import type { BlockCase, ContractSubject } from "./contract-subject";
import { describeThrown } from "./describe-thrown";
import {
	describeDifference,
	type MountedCase,
	missingDom,
	mountCase,
	settle,
} from "./mount-case";

type Prepare = (mounted: MountedCase) => Promise<string | null> | undefined;

/**
 * Mounts a case, runs `prepare` on it and returns its snapshot, or a failure
 * message when mounting or preparing fails.
 */
async function stateAfter(
	subject: ContractSubject,
	block: BlockCase,
	prepare: Prepare,
): Promise<{ readonly html: string } | { readonly failure: string }> {
	let mounted: MountedCase;
	try {
		mounted = mountCase(subject, block.model);
	} catch (error) {
		return {
			failure: `mount threw on ${block.label}: ${describeThrown(error)}`,
		};
	}
	try {
		const problem = await prepare(mounted);
		if (problem) return { failure: `${block.label}: ${problem}` };
		return { html: mounted.snapshot() };
	} catch (error) {
		return { failure: `${block.label}: ${describeThrown(error)}` };
	} finally {
		mounted.remove();
	}
}

/**
 * Runs one comparison per step of every case: the state reached by
 * `actual` must match the one reached by `expected`.
 */
async function compareStates(
	subject: ContractSubject,
	steps: (block: BlockCase) => readonly number[],
	expected: (step: number, block: BlockCase) => Prepare,
	actual: (step: number, block: BlockCase) => Prepare,
	explain: (step: number) => string,
): Promise<string[]> {
	const dom = missingDom();
	if (dom !== null) return [dom];
	const failures: string[] = [];
	for (const block of subject.cases) {
		for (const step of steps(block)) {
			const want = await stateAfter(subject, block, expected(step, block));
			if ("failure" in want) {
				failures.push(want.failure);
				break;
			}
			const got = await stateAfter(subject, block, actual(step, block));
			if ("failure" in got) {
				failures.push(got.failure);
				break;
			}
			if (want.html !== got.html) {
				failures.push(
					`${block.label}: ${explain(step)}; ${describeDifference(want.html, got.html)}`,
				);
			}
		}
	}
	return failures;
}

function range(from: number, to: number): number[] {
	return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

const setState =
	(...steps: readonly number[]): Prepare =>
	({ instance }) => {
		for (const step of steps) instance.setState(step);
	};

/** The view and the definition describe the same block. */
export const viewMatchesDefinition: ContractCheck = {
	id: "view-matches-definition",
	title: "the view has the type of the definition",
	async run({ options: { view, definition } }) {
		return view.type === definition.type
			? []
			: [
					`the view has type "${view.type}" but the definition "${definition.type}"`,
				];
	},
};

/** `mount` draws step 0, so `setState(0)` right after it changes nothing. */
export const mountShowsStepZero: ContractCheck = {
	id: "mount-shows-step-zero",
	title: "mount shows step 0",
	run: (subject) =>
		compareStates(
			subject,
			() => [0],
			() => () => {},
			() => setState(0),
			() => "setState(0) right after mount changes the block",
		),
};

/** Calling `setState(n)` twice gives the same result as calling it once. */
export const setStateIsIdempotent: ContractCheck = {
	id: "set-state-is-idempotent",
	title: "setState is idempotent",
	run: (subject) =>
		compareStates(
			subject,
			(block) => range(0, block.steps),
			(step) => setState(step),
			(step) => setState(step, step),
			(step) => `setState(${step}) twice differs from once`,
		),
};

/** At its end, `play(n - 1, n)` leaves the block as `setState(n)` does. */
export const playMatchesSetState: ContractCheck = {
	id: "play-matches-set-state",
	title: "play ends in the same state as setState",
	run: async (subject) => {
		const single = await compareStates(
			subject,
			(block) => range(1, block.steps),
			(step) => setState(step),
			(step) =>
				async ({ instance }) => {
					instance.setState(step - 1);
					const problem = await settle(subject, () =>
						instance.play(step - 1, step),
					);
					return problem && `play(${step - 1}, ${step}) ${problem}`;
				},
			(step) =>
				`play(${step - 1}, ${step}) ends differently from setState(${step})`,
		);
		const several = await compareStates(
			subject,
			(block) => (block.steps >= 2 ? [block.steps] : []),
			(step) => setState(step),
			(step) =>
				async ({ instance }) => {
					instance.setState(0);
					const problem = await settle(subject, () => instance.play(0, step));
					return problem && `play(0, ${step}) ${problem}`;
				},
			(step) => `play(0, ${step}) ends differently from setState(${step})`,
		);
		return [...single, ...several];
	},
};

/** Going back with `setState` shows exactly the earlier step. */
export const setStateGoesBack: ContractCheck = {
	id: "set-state-goes-back",
	title: "setState goes back to earlier steps",
	run: (subject) =>
		compareStates(
			subject,
			(block) => range(0, block.steps - 1),
			(step) => setState(step),
			(step, block) => setState(Math.min(step + 2, block.steps), step),
			(step) =>
				`setState(${step}) after a later step differs from a fresh setState(${step})`,
		),
};
