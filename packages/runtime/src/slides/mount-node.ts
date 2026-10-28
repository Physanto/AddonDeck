// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockNode, SlideNode, TextNode } from "@addondeck/core";
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
 * Reads a text with the registered `text` block, as if it were written as
 * `text:` with the same lines. The parser already reported the problems of
 * its step annotations, so the diagnostics are dropped.
 *
 * @returns The model, or `null` when there is no text block or it fails.
 */
function readText(node: TextNode, registry: PluginRegistry): unknown {
	const definition = registry.blocks().resolve("text");
	if (definition === undefined) return null;
	try {
		return definition.parse({
			type: "text",
			keyword: "text",
			id: null,
			args: [],
			options: [],
			body: node.lines,
			location: node.location,
		}).model;
	} catch {
		return null;
	}
}

/**
 * Draws one piece of slide content inside `el`.
 *
 * Text is drawn by the `text` block, like a block written as `text:`.
 * Content without a block to draw it gets a placeholder: text while no text
 * block is registered, a block its definition could not read (the parser
 * already reported why), and a block that is missing an adapter or fails to
 * mount, which is also reported.
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
	const { registry, translate, report } = options;
	const type = node.kind === "text" ? "text" : node.type;
	const model = node.kind === "text" ? readText(node, registry) : node.model;
	const lines = (): string[] =>
		node.kind === "text" ? rawLines(node.lines) : blockLines(node);
	const view = registry.view(type);
	if (view === undefined || model === null) {
		mountPlaceholder(el, { type, lines: lines() });
		return null;
	}

	const line = node.location.line;
	const needs = registry.blocks().resolve(type)?.needs ?? [];
	// The animator falls back to one without motion, so it is never missing.
	const missing = needs.find(
		(kind) => kind !== "animator" && registry.adapter(kind) === undefined,
	);
	if (missing !== undefined) {
		const error = translate("missingAdapter", {
			line,
			type,
			adapter: missing,
		});
		report({ severity: "error", message: error });
		mountPlaceholder(el, { type, lines: lines(), error });
		return null;
	}

	let services: BlockServices | null = null;
	try {
		services = createBlockContext(options.context, needs, registry);
		const instance = view.mount(model, el, services.context);
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
			type,
			reason: describeError(thrown),
		});
		report({ severity: "error", message: error });
		mountPlaceholder(el, { type, lines: lines(), error });
		return null;
	}
}
