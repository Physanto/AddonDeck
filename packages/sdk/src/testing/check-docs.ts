// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { ContractCheck } from "./contract-check";

/** `docs.md` has content and names the block. */
export const docsExist: ContractCheck = {
	id: "docs-exist",
	title: "docs.md describes the block",
	async run({ options: { docs, definition } }) {
		if (docs.trim() === "") return ["docs.md is empty"];
		return docs.includes(definition.type)
			? []
			: [`docs.md never mentions the block keyword "${definition.type}"`];
	},
};

/** There is an example, and every example uses the block and is free of errors and warnings. */
export const examplesAreValid: ContractCheck = {
	id: "examples-are-valid",
	title: "every example uses the block and has no errors or warnings",
	async run({ examples, options: { definition } }) {
		if (examples.length === 0) return ["the block has no examples"];
		const failures: string[] = [];
		for (const example of examples) {
			for (const diagnostic of example.diagnostics) {
				if (diagnostic.severity === "info") continue;
				failures.push(
					`${example.name}, line ${diagnostic.line}: ${diagnostic.code} ${diagnostic.message}`,
				);
			}
			const used = example.deck.slides.some((slide) =>
				slide.content.some(
					(node) =>
						node.kind === "block" &&
						node.type === definition.type &&
						node.model !== null,
				),
			);
			if (!used) {
				failures.push(
					`${example.name} has no "${definition.type}" block that could be read`,
				);
			}
		}
		return failures;
	},
};

/** Each language pack that adds aliases for the block has a translation of the docs, or marks it as pending. */
export const translationsExist: ContractCheck = {
	id: "translations-exist",
	title: "language packs have a translation of docs.md or mark it as pending",
	async run({
		options: { languagePacks = [], translations = {}, definition },
	}) {
		const failures: string[] = [];
		for (const pack of languagePacks) {
			if ((pack.blocks?.[definition.type] ?? []).length === 0) continue;
			const translation = translations[pack.language];
			if (translation === null) continue;
			if (translation === undefined) {
				failures.push(
					`language pack "${pack.language}" adds aliases for "${definition.type}" but docs.${pack.language}.md is missing; add it, or mark it as pending with null`,
				);
			} else if (translation.trim() === "") {
				failures.push(`docs.${pack.language}.md is empty`);
			}
		}
		return failures;
	},
};
