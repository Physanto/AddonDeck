// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockNode,
	type BlockRegistry,
	type BlockSource,
	compileStepPlan,
	createBlockRegistry,
	type Deck,
	type Diagnostic,
	parse,
} from "@addondeck/core";
import type { BlockContractOptions } from "./block-contract-options";
import { createTestContext, type TestContext } from "./create-test-context";
import type { LabeledSource } from "./hostile-sources";

/** An example after parsing it and compiling its step plans. */
export interface ParsedExample {
	readonly name: string;
	readonly deck: Deck;
	/** Diagnostics of the parser and of every step plan. */
	readonly diagnostics: readonly Diagnostic[];
}

/** A block of an example the views are mounted with. */
export interface BlockCase {
	readonly label: string;
	readonly model: unknown;
	/** Steps the definition offers for the model; 0 when `steps` fails. */
	readonly steps: number;
}

/** Everything the checks need, prepared once from the options. */
export interface ContractSubject {
	readonly options: BlockContractOptions;
	readonly registry: BlockRegistry;
	readonly examples: readonly ParsedExample[];
	/** Sources of the block in the examples, or a minimal one when there are none. */
	readonly sources: readonly LabeledSource[];
	readonly cases: readonly BlockCase[];
	readonly createContext: () => TestContext;
}

function toSource(node: BlockNode): BlockSource {
	const { kind: _kind, model: _model, ...source } = node;
	return source;
}

function countSteps(options: BlockContractOptions, model: unknown): number {
	try {
		const steps: unknown = options.definition.steps(model);
		return Array.isArray(steps) ? steps.length : 0;
	} catch {
		return 0;
	}
}

/** Parses the examples and collects the block's sources and models. */
export function prepareSubject(options: BlockContractOptions): ContractSubject {
	const { definition } = options;
	const registry = createBlockRegistry(
		[definition, ...(options.blocks ?? [])],
		options.languagePacks === undefined
			? {}
			: { languagePacks: options.languagePacks },
	);
	const examples: ParsedExample[] = [];
	const sources: LabeledSource[] = [];
	const cases: BlockCase[] = [];

	for (const example of options.examples) {
		const { deck, diagnostics } = parse(example.source, { registry });
		const plans = deck.slides.flatMap(
			(slide) => compileStepPlan(slide, registry).diagnostics,
		);
		examples.push({
			name: example.name,
			deck,
			diagnostics: [...diagnostics, ...plans],
		});
		for (const slide of deck.slides) {
			for (const node of slide.content) {
				if (node.kind !== "block" || node.type !== definition.type) continue;
				const label = `${example.name}, line ${node.location.line}`;
				sources.push({ label, source: toSource(node) });
				if (node.model !== null) {
					cases.push({
						label,
						model: node.model,
						steps: countSteps(options, node.model),
					});
				}
			}
		}
	}

	if (sources.length === 0) {
		sources.push({
			label: "a minimal block",
			source: {
				type: definition.type,
				keyword: definition.type,
				id: null,
				args: [],
				options: [],
				body: [{ line: 2, raw: "  item", text: "item" }],
				location: { line: 1, column: 1 },
			},
		});
	}

	return {
		options,
		registry,
		examples,
		sources,
		cases,
		createContext: options.createContext ?? (() => createTestContext()),
	};
}
