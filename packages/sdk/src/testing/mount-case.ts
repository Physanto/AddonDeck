// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockInstance } from "../block/block-instance";
import type { ContractSubject } from "./contract-subject";
import type { TestContext } from "./create-test-context";
import { describeThrown } from "./describe-thrown";

// Captured when the module loads, so the leak tracker never sees the suite's own timer.
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;

/** A block mounted in its own element, attached to the document. */
export interface MountedCase {
	readonly host: HTMLElement;
	readonly instance: BlockInstance;
	readonly context: TestContext;
	/** The block element and everything inside it, as HTML. */
	snapshot(): string;
	/** Destroys the instance, ignoring errors, and detaches the element. */
	remove(): void;
}

/**
 * Explains why the view checks cannot run, or returns `null` when they can.
 */
export function missingDom(): string | null {
	return typeof document === "undefined"
		? "the view checks need a DOM: add `// @vitest-environment happy-dom` to the test file"
		: null;
}

/** Mounts the view in a new element. Throws what `mount` throws. */
export function mountCase(
	subject: ContractSubject,
	model: unknown,
): MountedCase {
	const host = document.createElement("div");
	document.body.append(host);
	const context = subject.createContext();
	let instance: BlockInstance;
	try {
		instance = subject.options.view.mount(model, host, context);
	} catch (error) {
		host.remove();
		throw error;
	}
	return {
		host,
		instance,
		context,
		snapshot: () => host.outerHTML,
		remove() {
			try {
				instance.destroy();
			} catch {
				// The destroy check reports it.
			}
			host.remove();
		},
	};
}

/** How long `play` may take by default before it counts as stuck. */
const PLAY_TIMEOUT = 2000;

/**
 * Awaits an animation of the block.
 *
 * @returns Why it failed, or `null` when it finished in time.
 */
export async function settle(
	subject: ContractSubject,
	run: () => Promise<void>,
): Promise<string | null> {
	const limit = subject.options.playTimeout ?? PLAY_TIMEOUT;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<string>((resolve) => {
		timer = realSetTimeout(
			() => resolve(`did not finish within ${limit} ms`),
			limit,
		);
	});
	try {
		const done = Promise.resolve()
			.then(run)
			.then(
				() => null,
				(error: unknown) => `threw: ${describeThrown(error)}`,
			);
		return await Promise.race([done, timeout]);
	} finally {
		realClearTimeout(timer);
	}
}

/** Where two snapshots first differ, with a little context, for failure messages. */
export function describeDifference(expected: string, actual: string): string {
	let index = 0;
	while (index < expected.length && expected[index] === actual[index]) index++;
	const start = Math.max(0, index - 30);
	const excerpt = (text: string): string =>
		JSON.stringify(text.slice(start, index + 50));
	return `expected …${excerpt(expected)}… but got …${excerpt(actual)}…`;
}
