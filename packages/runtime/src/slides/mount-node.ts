// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockNode, SlideNode } from "@addondeck/core";
import type { BlockContext, BlockInstance } from "@addondeck/sdk";
import type { IssueReporter } from "../issues/runtime-issue";
import type { Translate } from "../messages/create-translator";
import type { PluginRegistry } from "../registry/plugin-registry";
import { mountPlaceholder, rawLines } from "./mount-placeholder";

/** What {@link mountNode} needs besides the content. */
export interface MountNodeOptions {
	readonly registry: PluginRegistry;
	readonly context: BlockContext;
	readonly translate: Translate;
	readonly report: IssueReporter;
}

function blockLines(node: BlockNode): string[] {
	return [`${node.keyword}:`, ...rawLines(node.body)];
}

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Draws one piece of slide content inside `el`.
 *
 * Content without a block to draw it gets a placeholder: text until the text
 * block exists, a block its definition could not read (the parser already
 * reported why), and a block that is missing an adapter or fails to mount,
 * which is also reported.
 *
 * @returns The block instance, or `null` when a placeholder was drawn.
 */
export function mountNode(
	node: SlideNode,
	el: HTMLElement,
	options: MountNodeOptions,
): BlockInstance | null {
	if (node.kind === "text") {
		mountPlaceholder(el, { type: "text", lines: rawLines(node.lines) });
		return null;
	}
	const { registry, translate, report } = options;
	const view = registry.view(node.type);
	if (view === undefined || node.model === null) {
		mountPlaceholder(el, { type: node.type, lines: blockLines(node) });
		return null;
	}

	const line = node.location.line;
	// The animator falls back to one without motion, so it is never missing.
	const missing = (registry.blocks().resolve(node.type)?.needs ?? []).find(
		(kind) => kind !== "animator" && registry.adapter(kind) === undefined,
	);
	if (missing !== undefined) {
		const error = translate("missingAdapter", {
			line,
			type: node.type,
			adapter: missing,
		});
		report({ severity: "error", message: error });
		mountPlaceholder(el, { type: node.type, lines: blockLines(node), error });
		return null;
	}

	try {
		return view.mount(node.model, el, options.context);
	} catch (thrown) {
		const error = translate("blockFailed", {
			line,
			type: node.type,
			reason: describeError(thrown),
		});
		report({ severity: "error", message: error });
		mountPlaceholder(el, { type: node.type, lines: blockLines(node), error });
		return null;
	}
}
