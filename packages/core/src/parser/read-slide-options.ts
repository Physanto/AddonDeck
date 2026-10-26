// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	DEFAULT_SLIDE_OPTIONS,
	SLIDE_LAYOUTS,
	SLIDE_TRANSITIONS,
} from "../model/defaults";
import type { SlideOptions } from "../model/slide-options";
import { closestKeyword } from "../text/closest-keyword";
import { normalizeKeyword } from "../text/normalize-keyword";
import { isBackground } from "./header-values";
import type { SlideContext } from "./parse-context";
import { readHeaderTokens } from "./read-header-tokens";

/** Slide options with every field writable, while a slide is being read. */
export type MutableSlideOptions = {
	-readonly [K in keyof SlideOptions]: SlideOptions[K];
};

const SLIDE_OPTION_KEYS: readonly string[] = Object.keys(DEFAULT_SLIDE_OPTIONS);

function includes<T extends string>(
	values: readonly T[],
	value: string,
): value is T {
	return (values as readonly string[]).includes(value);
}

/**
 * Reads the `key=value` pairs of a `slide:` line into `options`. Later lines
 * and later pairs override earlier ones.
 *
 * @param line - The whole `slide:` line, without trailing whitespace.
 * @param start - Index where the options start, just after the colon.
 */
export function readSlideOptions(
	line: string,
	lineNumber: number,
	start: number,
	options: MutableSlideOptions,
	context: SlideContext,
): void {
	const { reporter } = context;
	for (const token of readHeaderTokens(line, start, false).tokens) {
		const location = { line: lineNumber, column: token.column };
		if (token.kind === "word") {
			reporter.report("W314", location, { word: token.text });
			continue;
		}

		const key = normalizeKeyword(token.name);
		const value = normalizeKeyword(token.value);
		const invalid = (fallback: string): void => {
			reporter.report("W309", location, {
				option: token.name,
				value: token.value,
				fallback,
			});
		};
		switch (key) {
			case "transition":
				if (includes(SLIDE_TRANSITIONS, value)) options.transition = value;
				else invalid(DEFAULT_SLIDE_OPTIONS.transition);
				break;
			case "layout":
				if (includes(SLIDE_LAYOUTS, value)) options.layout = value;
				else invalid(DEFAULT_SLIDE_OPTIONS.layout);
				break;
			case "background":
				if (isBackground(token.value, context.installed.backgrounds)) {
					options.background = token.value;
				} else {
					invalid(context.meta.background ?? context.meta.theme);
				}
				break;
			default:
				reporter.report(
					"W308",
					location,
					{ option: token.name },
					closestKeyword(key, SLIDE_OPTION_KEYS),
				);
		}
	}
}
