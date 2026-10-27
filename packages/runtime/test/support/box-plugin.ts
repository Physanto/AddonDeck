// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AdapterKind, BlockPlugin, StepDef } from "@addondeck/sdk";

/** Model of the test block: one entry per body line. */
export interface BoxModel {
	readonly lines: readonly string[];
}

/** What the test block did, in order, as `mount:<first line>` and `destroy:<first line>`. */
export type BoxLog = string[];

/** Options of {@link createBoxPlugin}. */
export interface BoxPluginOptions {
	readonly type?: string;
	readonly aliases?: readonly string[];
	readonly needs?: readonly AdapterKind[];
	/** The view throws when mounting a box whose first line is this. */
	readonly failOn?: string;
}

/**
 * A block for tests, `box:`. Each body line is a step; a box whose first
 * argument is `broken` cannot be read.
 */
export function createBoxPlugin(
	log: BoxLog = [],
	options: BoxPluginOptions = {},
): BlockPlugin<BoxModel> {
	const type = options.type ?? "box";
	return {
		kind: "block",
		definition: {
			type,
			aliases: options.aliases ?? [],
			version: "1.0.0",
			...(options.needs === undefined ? {} : { needs: options.needs }),
			parse: (source) => ({
				model:
					source.args[0] === "broken"
						? null
						: { lines: source.body.map((line) => line.text) },
				diagnostics: [],
			}),
			steps: (model) =>
				model.lines.map(
					(): StepDef => ({ at: null, triggers: [], location: null }),
				),
		},
		view: {
			type,
			mount(model, el) {
				const name = model.lines[0] ?? "";
				if (name === options.failOn) throw new Error(`cannot draw ${name}`);
				const box = el.ownerDocument.createElement("div");
				box.className = "test-box";
				box.textContent = model.lines.join("\n");
				el.append(box);
				log.push(`mount:${name}`);
				return {
					setState: () => {},
					play: async () => {},
					destroy: () => {
						box.remove();
						log.push(`destroy:${name}`);
					},
				};
			},
		},
	};
}
