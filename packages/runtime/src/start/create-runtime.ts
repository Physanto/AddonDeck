// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	compileStepPlan,
	type Deck,
	type Diagnostic,
	type PartialDiagnosticMessages,
	parse,
} from "@addondeck/core";
import {
	type BlockContext,
	createInstantAnimator,
	type ResolvedAsset,
	type Unsubscribe,
} from "@addondeck/sdk";
import type { EmbeddedAssets } from "../assets/read-embedded-assets";
import { createEventBus } from "../context/create-event-bus";
import {
	DEFAULT_MOTION_TOKENS,
	DEFAULT_THEME_TOKENS,
} from "../context/default-tokens";
import {
	type IssueReporter,
	type RuntimeIssue,
	reportToConsole,
} from "../issues/runtime-issue";
import {
	createTranslator,
	type Translate,
} from "../messages/create-translator";
import type { PartialRuntimeMessages } from "../messages/runtime-messages";
import { bindHash } from "../navigation/bind-hash";
import { bindKeyboard } from "../navigation/bind-keyboard";
import { bindPointer } from "../navigation/bind-pointer";
import {
	createNavigator,
	type Navigator,
} from "../navigation/create-navigator";
import type { NavigationActions } from "../navigation/navigation-actions";
import { toggleFullscreen } from "../navigation/toggle-fullscreen";
import type { PluginRegistry } from "../registry/plugin-registry";
import { createSlideRenderer } from "../slides/create-slide-renderer";
import { createStage, type Stage } from "../stage/create-stage";

/** What {@link createRuntime} needs to show a deck. */
export interface RuntimeOptions {
	/** The element the deck fills. */
	readonly root: HTMLElement;
	/** The `.deck` text. */
	readonly source: string;
	/** The blocks and adapters available to the deck. */
	readonly registry: PluginRegistry;
	/** Assets the deck refers to, by reference. */
	readonly assets?: EmbeddedAssets;
	/** Runtime messages of the active language. */
	readonly messages?: PartialRuntimeMessages;
	/** Parser messages of the active language. */
	readonly diagnosticMessages?: PartialDiagnosticMessages;
	/** Receives each problem once; by default they go to the console. */
	readonly report?: IssueReporter;
}

/** A deck being shown. */
export interface Runtime {
	readonly deck: Deck;
	/** What the parser found, followed by what the step plans found. */
	readonly diagnostics: readonly Diagnostic[];
	readonly navigator: Navigator;
	readonly stage: Stage;
	/** Removes the deck from the page and stops listening to input. */
	destroy(): void;
}

/** Each problem is reported once, although its slide mounts again. */
function reportOnce(report: IssueReporter): IssueReporter {
	const seen = new Set<string>();
	return (issue) => {
		if (seen.has(issue.message)) return;
		seen.add(issue.message);
		report(issue);
	};
}

function toIssue(diagnostic: Diagnostic, translate: Translate): RuntimeIssue {
	// An unknown block in an exported deck is almost always a block whose
	// script was not included, so it is reported as such.
	if (diagnostic.code === "W304") {
		return {
			severity: "error",
			message: translate("unregisteredBlock", {
				line: diagnostic.line,
				keyword: String(diagnostic.params.keyword),
			}),
		};
	}
	return {
		severity: diagnostic.severity === "error" ? "error" : "warning",
		message: translate("diagnostic", {
			line: diagnostic.line,
			column: diagnostic.column,
			message: diagnostic.message,
		}),
	};
}

/**
 * Parses a deck and shows it inside `root`, ready to navigate with the
 * keyboard, clicks, swipes and the address hash.
 *
 * @example
 * ```ts
 * const registry = createPluginRegistry();
 * const runtime = createRuntime({ root, source: "# Hello", registry });
 * runtime.navigator.next();
 * runtime.destroy();
 * ```
 */
export function createRuntime(options: RuntimeOptions): Runtime {
	const { root, source, registry } = options;
	const document = root.ownerDocument;
	const window = document.defaultView;
	const translate = createTranslator(options.messages);
	const report = reportOnce(options.report ?? reportToConsole);
	const blocks = registry.blocks();

	const parsed = parse(source, {
		registry: blocks,
		messages: options.diagnosticMessages,
	});
	const { deck } = parsed;
	const diagnostics = [...parsed.diagnostics];
	const clickCounts = deck.slides.map((slide) => {
		const plan = compileStepPlan(slide, blocks, {
			messages: options.diagnosticMessages,
		});
		diagnostics.push(...plan.diagnostics);
		return plan.clicks.length;
	});
	for (const diagnostic of diagnostics) {
		if (diagnostic.severity !== "info") report(toIssue(diagnostic, translate));
	}

	const stage = createStage(root);
	const theme = DEFAULT_THEME_TOKENS;
	const motion = DEFAULT_MOTION_TOKENS;
	const assets = options.assets ?? new Map<string, ResolvedAsset>();
	const context: BlockContext = {
		animator:
			registry.adapter("animator")?.create({ theme, motion }) ??
			createInstantAnimator(),
		theme,
		motion,
		assets: { resolve: (reference) => assets.get(reference) ?? null },
		events: createEventBus(),
		stage: stage.info,
	};
	const renderer = createSlideRenderer({
		deck,
		stage: stage.element,
		label: (slide) =>
			translate("slideLabel", {
				number: slide.index + 1,
				total: deck.slides.length,
			}),
		registry,
		context,
		translate,
		report,
	});

	const navigator = createNavigator(clickCounts);
	const actions: NavigationActions = {
		next: () => navigator.next(),
		prev: () => navigator.prev(),
		first: () => navigator.first(),
		last: () => navigator.last(),
		toggleFullscreen: () => toggleFullscreen(document),
	};
	const bindings: Unsubscribe[] = [];
	// The hash may open another slide, so it is read before the first one is drawn.
	if (window !== null) bindings.push(bindHash(window, navigator));
	renderer.show(navigator.position.slide);
	bindings.push(
		navigator.subscribe((position, previous) => {
			if (position.slide !== previous.slide) renderer.show(position.slide);
		}),
		bindKeyboard(document, actions),
		bindPointer(stage.viewport, actions),
	);

	return {
		deck,
		diagnostics,
		navigator,
		stage,
		destroy() {
			for (const unbind of bindings) unbind();
			renderer.destroy();
			stage.destroy();
		},
	};
}
