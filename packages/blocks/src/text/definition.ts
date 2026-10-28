// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockDefinition,
	createBlockDiagnostic,
	type Diagnostic,
	type MarkdownDocument,
	parseMarkdown,
} from "@addondeck/sdk";
import { TEXT_MESSAGES } from "./messages";

/** What the text block draws: its Markdown, read into blocks. */
export interface TextModel {
	readonly markdown: MarkdownDocument;
}

/**
 * Markdown, shown at once except for the lines with a step annotation, which
 * appear one per step.
 *
 * The text of a slide uses this block implicitly; `text:` with an indented
 * body uses it explicitly, for example to give the text an id.
 */
export const definition: BlockDefinition<TextModel> = {
	type: "text",
	aliases: [],
	version: "1.0.0",
	needs: ["animator"],
	parse(source) {
		const { document, diagnostics } = parseMarkdown(source.body);
		const ignored: Diagnostic[] = [
			...source.args.map((name) =>
				createBlockDiagnostic(TEXT_MESSAGES, "TEXT-W01", source.location, {
					name,
				}),
			),
			...source.options.map((option) =>
				createBlockDiagnostic(TEXT_MESSAGES, "TEXT-W01", option.location, {
					name: option.name,
				}),
			),
		];
		return {
			model: { markdown: document },
			diagnostics: [...ignored, ...diagnostics],
		};
	},
	steps: (model) =>
		model.markdown.annotated.map(({ annotation }) => ({
			at: annotation.step,
			triggers: annotation.triggers,
			location: annotation.location,
		})),
};
