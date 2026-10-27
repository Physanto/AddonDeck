// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "../model/source-location";
import type { Reporter } from "../parser/reporter";
import type { Participant } from "./participant";

/** The step whose arrow plays another step, and where the arrow is written. */
interface Driver {
	readonly participant: number;
	readonly step: number;
	readonly location: SourceLocation;
}

/** Pairs the k-th arrow naming a block, in order of appearance, with that block's k-th step. */
function pairArrows(participants: readonly Participant[]): {
	readonly drivers: (Driver | undefined)[][];
	readonly targets: number[][][];
} {
	const byId = new Map<string, number>();
	participants.forEach((participant, index) => {
		if (participant.id !== null && !byId.has(participant.id)) {
			byId.set(participant.id, index);
		}
	});
	const drivers = participants.map(({ steps }) =>
		steps.map((): Driver | undefined => undefined),
	);
	const targets = participants.map(({ steps }) =>
		steps.map((): number[] => []),
	);
	const used = participants.map(() => 0);

	participants.forEach(({ steps }, participant) => {
		steps.forEach(({ triggers }, step) => {
			for (const trigger of triggers) {
				const target = byId.get(trigger.id);
				if (target === undefined) continue;
				const index = used[target] ?? 0;
				used[target] = index + 1;
				const slots = drivers[target];
				if (slots === undefined || index >= slots.length) continue;
				slots[index] = { participant, step, location: trigger.location };
				targets[participant]?.[step]?.push(target);
			}
		});
	});
	return { drivers, targets };
}

/**
 * Places every step of the slide in a click, following the rules of the
 * format specification ("Step plan"):
 *
 * - each participant plays its steps in its own order;
 * - a step without `@n` takes the click after the last one used so far;
 * - `@n` asks for click `n`, but never before the previous step of the same
 *   participant (`W315`);
 * - a step played by an arrow takes the click of the step with the arrow;
 * - steps that wait for each other in a cycle of arrows take the default
 *   order at the end.
 *
 * Clicks may have gaps; the caller compacts them.
 *
 * @returns For each participant, the click of each of its steps.
 */
export function placeSteps(
	participants: readonly Participant[],
	reporter: Reporter,
): number[][] {
	const { drivers, targets } = pairArrows(participants);
	const slots = participants.map((): number[] => []);
	const reached = participants.map(() => false);
	let cursor = 0;

	const place = (
		participant: number,
		requested: number,
		location: SourceLocation,
	): void => {
		const own = slots[participant] ?? [];
		const previous = own[own.length - 1] ?? 0;
		if (requested < previous) reporter.report("W315", location, {});
		const slot = Math.max(requested, previous);
		own.push(slot);
		cursor = Math.max(cursor, slot);
		for (const target of targets[participant]?.[own.length - 1] ?? []) {
			advance(target);
		}
	};

	// Places the next steps of a participant until one has to wait: for its
	// arrow, or, in the default order, for the reading to reach it.
	const advance = (participant: number): void => {
		const { steps } = participants[participant] as Participant;
		const own = slots[participant] ?? [];
		for (;;) {
			const index = own.length;
			const step = steps[index];
			if (step === undefined) return;
			const driver = drivers[participant]?.[index];
			if (driver !== undefined) {
				const slot = slots[driver.participant]?.[driver.step];
				if (slot === undefined) return;
				place(participant, slot, driver.location);
			} else if (!reached[participant]) {
				return;
			} else {
				place(participant, step.at ?? cursor + 1, step.location);
			}
		}
	};

	participants.forEach((_, participant) => {
		reached[participant] = true;
		advance(participant);
	});

	let waiting = true;
	while (waiting) {
		waiting = false;
		participants.forEach(({ steps }, participant) => {
			const own = slots[participant] ?? [];
			const step = steps[own.length];
			if (step === undefined) return;
			waiting = true;
			place(participant, cursor + 1, step.location);
			advance(participant);
		});
	}
	return slots;
}
