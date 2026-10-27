// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockNode, SlideNode } from "@addondeck/core";
import type { BlockContext } from "@addondeck/sdk";
import {
	type BlockServices,
	createBlockContext,
} from "../context/create-block-context";
import { describeError } from "../issues/describe-error";
import type { IssueReporter } from "../issues/runtime-issue";
import type { Translate } from "../messages/create-translator";
import type { PluginRegistry } from "../registry/plugin-registry";
import type { TimelineBlock } from "../steps/create-step-timeline";
import { mountPlaceholder, rawLines } from "./mount-placeholder";

/** What {@link mountNode} needs besides the content. */
export interface MountNodeOptions {
	readonly registry: PluginRegistry;
	/** The services every block shares; each block gets its own context built from them. */
	readonly context: BlockContext;
	readonly translate: Translate;
	readonly report: IssueReporter;
}

/** A block drawn on a slide. */
export interface MountedBlock extends TimelineBlock {
	/** Destroys the block and frees the services created for it. */
	destroy(): void;
}

function blockLines(node: BlockNode): string[] {
	return [`${node.keyword}:`, ...rawLines(node.body)];
}

/**
 * Draws one piece of slide content inside `el`.
 *
 * Content without a block to draw it gets a placeholder: text until the text
 * block exists, a block its definition could not read (the parser already
 * reported why), and a block that is missing an adapter or fails to mount,
 * which is also reported.
 *
 * The block gets a context with the adapters it declares in `needs`.
 *
 * @returns The mounted block, or `null` when a placeholder was drawn.
 */
export function mountNode(
	node: SlideNode,
	el: HTMLElement,
	options: MountNodeOptions,
): MountedBlock | null {
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
	const needs = registry.blocks().resolve(node.type)?.needs ?? [];
	// The animator falls back to one without motion, so it is never missing.
	const missing = needs.find(
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

	let services: BlockServices | null = null;
	try {
		services = createBlockContext(options.context, needs, registry);
		const instance = view.mount(node.model, el, services.context);
		const { finishAnimations, destroy } = services;
		return {
			instance,
			finishAnimations,
			destroy() {
				try {
					instance.destroy();
				} finally {
					destroy();
				}
			},
		};
	} catch (thrown) {
		services?.destroy();
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
