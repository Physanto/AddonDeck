// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "../contracts/block-definition";
import type { BlockOption } from "../contracts/block-option";
import type { BlockSource } from "../contracts/block-source";
import type { BlockNode } from "../model/block-node";
import type { SourceLine } from "../model/source-line";
import { isValidId } from "../text/is-valid-id";
import { normalizeKeyword } from "../text/normalize-keyword";
import type { SlideContext } from "./parse-context";
import type { BlockHeader } from "./read-block-header";
import { runBlockParse } from "./run-block-parse";

const ID_OPTION = "id";

/**
 * Builds a block from its header and body, checks its id and lets the block's
 * definition read it.
 *
 * An invalid id (`E203`) is dropped; a repeated one (`E202`) is kept, so the
 * block still works, but the error blocks exporting until it is fixed.
 */
export function buildBlockNode(
	definition: BlockDefinition,
	header: BlockHeader,
	body: readonly SourceLine[],
	lineNumber: number,
	context: SlideContext,
): BlockNode {
	const { reporter, ids } = context;
	const options: BlockOption[] = [];
	let id: string | null = null;

	for (const option of header.options) {
		const location = { line: lineNumber, column: option.column };
		const key = normalizeKeyword(option.name);
		if (key !== ID_OPTION) {
			options.push({ key, name: option.name, value: option.value, location });
			continue;
		}
		if (!isValidId(option.value)) {
			reporter.report("E203", location, { id: option.value });
			id = null;
			continue;
		}
		id = normalizeKeyword(option.value);
		const firstLine = ids.get(id);
		if (firstLine === undefined) ids.set(id, lineNumber);
		else reporter.report("E202", location, { id: option.value, firstLine });
	}

	const source: BlockSource = {
		type: definition.type,
		keyword: header.keyword,
		id,
		args: header.args.map((arg) => arg.text),
		options,
		body,
		location: { line: lineNumber, column: 1 },
	};
	const model = runBlockParse(definition, source, reporter);
	return { kind: "block", ...source, model };
}
