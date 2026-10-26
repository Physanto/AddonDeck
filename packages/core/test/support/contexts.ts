// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { DEFAULT_DECK_META } from "../../src/model/defaults";
import type { SourceLine } from "../../src/model/source-line";
import type {
	HeaderContext,
	SlideContext,
} from "../../src/parser/parse-context";
import type { InstalledResources } from "../../src/parser/parse-options";
import { createReporter } from "../../src/parser/reporter";
import type { RawSlide } from "../../src/parser/split-slides";
import type { BlockRegistry } from "../../src/registry/block-registry";
import { createTestRegistry } from "./test-registry";

/** A header context with the test registry and a fresh reporter. */
export function createHeaderContext(
	installed: InstalledResources = {},
	registry: BlockRegistry = createTestRegistry(),
): HeaderContext {
	return { registry, reporter: createReporter(undefined), installed };
}

/** A slide context with default deck settings. */
export function createSlideContext(
	installed: InstalledResources = {},
	registry: BlockRegistry = createTestRegistry(),
): SlideContext {
	return {
		...createHeaderContext(installed, registry),
		meta: DEFAULT_DECK_META,
		ids: new Map(),
	};
}

/** Source lines numbered from `firstLine`, as the slide stage receives them. */
export function sourceLines(text: string, firstLine = 1): SourceLine[] {
	return text
		.split("\n")
		.map((raw, index) => ({ line: firstLine + index, raw, text: raw }));
}

/** A raw slide made of the given text. */
export function rawSlide(text: string, edge = false): RawSlide {
	return { lines: sourceLines(text), startLine: 1, edge };
}

/** The codes of a list of diagnostics, in order. */
export function codes(diagnostics: readonly { code: string }[]): string[] {
	return diagnostics.map((diagnostic) => diagnostic.code);
}
