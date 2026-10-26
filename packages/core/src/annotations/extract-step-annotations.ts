// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { createDiagnostic } from "../diagnostics/create-diagnostic";
import type { Diagnostic } from "../diagnostics/diagnostic";
import type { PartialDiagnosticMessages } from "../diagnostics/diagnostic-messages";
import type { SourceLine } from "../model/source-line";
import type { StepAnnotation } from "../model/step-annotation";
import { isValidId } from "../text/is-valid-id";
import { normalizeKeyword } from "../text/normalize-keyword";

/** What {@link extractStepAnnotations} found in a line. */
export interface StepAnnotationResult {
	/** The line's text without the annotation and the spaces before it. */
	readonly content: string;
	/** The annotation, or `null` when the line has none or it was invalid. */
	readonly annotation: StepAnnotation | null;
	/** `W307` for `@n` after a single space, `W310` for an invalid step. */
	readonly diagnostics: readonly Diagnostic[];
}

/** Optional parts of {@link extractStepAnnotations}. */
export interface ExtractStepAnnotationsOptions {
	/** Messages of the active language. Missing ones fall back to English. */
	readonly messages?: PartialDiagnosticMessages;
}

interface Token {
	readonly value: string;
	readonly start: number;
	readonly end: number;
}

const ARROWS = ["→", "->"];
const POSITIVE_INTEGER = /^\d+$/;
const NUMBER_LIKE = /^-?\d+$/;

function tokenize(text: string): Token[] {
	const tokens: Token[] = [];
	let index = 0;
	while (index < text.length) {
		while (index < text.length && /\s/.test(text[index] ?? "")) index++;
		const start = index;
		while (index < text.length && !/\s/.test(text[index] ?? "")) index++;
		if (index > start) {
			tokens.push({ value: text.slice(start, index), start, end: index });
		}
	}
	return tokens;
}

function arrowPrefix(value: string): string | null {
	return ARROWS.find((arrow) => value.startsWith(arrow)) ?? null;
}

interface Suffix {
	/** Index of the first token of the annotation. */
	readonly first: number;
	readonly triggers: readonly string[];
	readonly step: Token | null;
}

/**
 * Lists the ways the end of a line can be read as an annotation, longest
 * first. The caller keeps the longest one that is separated from the content
 * by enough whitespace, so `a -> b  -> c` reads as content `a -> b` plus `-> c`.
 */
function readSuffixes(tokens: readonly Token[]): Suffix[] {
	const suffixes: Suffix[] = [];
	const triggers: string[] = [];
	let index = tokens.length - 1;
	for (;;) {
		const token = tokens[index];
		if (token === undefined) break;
		const arrow = arrowPrefix(token.value);
		const previous = tokens[index - 1];
		if (arrow !== null && token.value.length > arrow.length) {
			const id = token.value.slice(arrow.length);
			if (!isValidId(id)) break;
			triggers.unshift(normalizeKeyword(id));
			index -= 1;
		} else if (
			previous !== undefined &&
			ARROWS.includes(previous.value) &&
			isValidId(token.value)
		) {
			triggers.unshift(normalizeKeyword(token.value));
			index -= 2;
		} else {
			break;
		}
		suffixes.unshift({ first: index + 1, triggers: [...triggers], step: null });
	}
	const candidate = tokens[index];
	if (candidate?.value.startsWith("@") && candidate.value.length > 1) {
		suffixes.unshift({
			first: index,
			triggers: [...triggers],
			step: candidate,
		});
	}
	return suffixes;
}

/**
 * Reads the step annotation at the end of a line: an optional `@n` followed by
 * any number of `→ id` or `-> id`, separated from the content by two or more
 * spaces or a tab.
 *
 * Core uses it for text lines; blocks use it for their body lines, so the
 * syntax works the same everywhere. A single space is not enough because
 * arrows are content in some blocks (`Customer -> Shop: Hello`), and `@n` at
 * the start of a line is left to the block.
 *
 * @param line - The line to read. Columns are reported against `line.raw`.
 * @param options - Message catalog for the diagnostics.
 * @returns The content without the annotation, the annotation and any diagnostics.
 *
 * @example
 * ```ts
 * const line = { line: 4, raw: 'print("Paid!")    @3 → network', text: 'print("Paid!")    @3 → network' };
 * extractStepAnnotations(line);
 * // { content: 'print("Paid!")', annotation: { step: 3, triggers: ["network"], location: { line: 4, column: 19 } }, diagnostics: [] }
 * ```
 */
export function extractStepAnnotations(
	line: SourceLine,
	options: ExtractStepAnnotationsOptions = {},
): StepAnnotationResult {
	const text = line.text;
	const tokens = tokenize(text);
	const suffixes = readSuffixes(tokens);
	const offset = Math.max(0, line.raw.length - text.length);
	const column = (position: number): number => offset + position + 1;
	const diagnosticOptions =
		options.messages === undefined ? {} : { messages: options.messages };
	const unchanged: StepAnnotationResult = {
		content: text.trimEnd(),
		annotation: null,
		diagnostics: [],
	};

	for (const suffix of suffixes) {
		const before = tokens[suffix.first - 1];
		const first = tokens[suffix.first];
		if (before === undefined || first === undefined) continue;
		const gap = text.slice(before.end, first.start);
		if (gap.length < 2 && !gap.includes("\t")) continue;

		const content = text.slice(0, before.end);
		const location = { line: line.line, column: column(first.start) };
		if (suffix.step === null) {
			return {
				content,
				annotation: { step: null, triggers: suffix.triggers, location },
				diagnostics: [],
			};
		}
		const written = suffix.step.value.slice(1);
		const step = Number(written);
		if (
			!POSITIVE_INTEGER.test(written) ||
			step < 1 ||
			!Number.isSafeInteger(step)
		) {
			return {
				content,
				annotation: null,
				diagnostics: [
					createDiagnostic(
						"W310",
						{ line: line.line, column: column(suffix.step.start) },
						{ step: written },
						diagnosticOptions,
					),
				],
			};
		}
		return {
			content,
			annotation: { step, triggers: suffix.triggers, location },
			diagnostics: [],
		};
	}

	const longest = suffixes[0];
	const step = longest?.step?.value.slice(1);
	if (
		longest !== undefined &&
		longest.triggers.length === 0 &&
		step !== undefined &&
		NUMBER_LIKE.test(step) &&
		tokens[longest.first - 1] !== undefined
	) {
		return {
			...unchanged,
			diagnostics: [
				createDiagnostic(
					"W307",
					{ line: line.line, column: column(longest.step?.start ?? 0) },
					{ step },
					diagnosticOptions,
				),
			],
		};
	}
	return unchanged;
}
