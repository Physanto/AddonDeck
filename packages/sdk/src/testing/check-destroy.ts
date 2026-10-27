// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ContractCheck } from "./contract-check";
import type { BlockCase, ContractSubject } from "./contract-subject";
import { describeThrown } from "./describe-thrown";
import { missingDom, mountCase, settle } from "./mount-case";
import { trackLeaks } from "./track-leaks";

/** Plays the block as a presentation would, destroys it and lists what it left behind. */
async function leftovers(
	subject: ContractSubject,
	block: BlockCase,
): Promise<string[]> {
	const { body, head } = document;
	const before = { body: body.childNodes.length, head: head.childNodes.length };
	const tracker = trackLeaks();
	try {
		const mounted = mountCase(subject, block.model);
		const { host, instance, context } = mounted;
		const bodyWithHost = before.body + 1;
		try {
			instance.setState(block.steps);
			if (block.steps > 0) {
				instance.setState(block.steps - 1);
				await settle(subject, () =>
					instance.play(block.steps - 1, block.steps),
				);
			}
			instance.destroy();
		} catch (error) {
			host.remove();
			return [`destroy could not be checked: ${describeThrown(error)}`];
		}

		const left: string[] = [...tracker.leaks()];
		if (host.childNodes.length > 0) {
			left.push(`${host.childNodes.length} node(s) in the block element`);
		}
		const subscriptions = context.events.listenerCount();
		if (subscriptions > 0)
			left.push(`${subscriptions} event bus subscription(s)`);
		if (body.childNodes.length !== bodyWithHost) {
			left.push(
				`${body.childNodes.length - bodyWithHost} node(s) in the document body`,
			);
		}
		if (head.childNodes.length !== before.head) {
			left.push(
				`${head.childNodes.length - before.head} node(s) in the document head`,
			);
		}
		host.remove();
		return left;
	} finally {
		tracker.restore();
	}
}

/** `destroy` leaves no nodes, listeners, timers, frames or subscriptions. */
export const destroyCleansUp: ContractCheck = {
	id: "destroy-cleans-up",
	title: "destroy leaves no nodes, listeners or timers",
	async run(subject) {
		const dom = missingDom();
		if (dom !== null) return [dom];
		const failures: string[] = [];
		for (const block of subject.cases) {
			try {
				for (const leftover of await leftovers(subject, block)) {
					failures.push(`${block.label}: destroy left ${leftover}`);
				}
			} catch (error) {
				failures.push(
					`mount threw on ${block.label}: ${describeThrown(error)}`,
				);
			}
		}
		return failures;
	},
};
