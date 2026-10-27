// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { sortByPosition } from "../diagnostics/sort-by-position";
import type { Section } from "../model/section";
import type { Slide } from "../model/slide";
import { isBlank } from "../text/indentation";
import { splitLines } from "../text/split-lines";
import { migrateToCurrent } from "./format-migrations";
import type { HeaderContext } from "./parse-context";
import type { ParseOptions, ParseOutput } from "./parse-options";
import { createReporter } from "./reporter";
import { scanHeader } from "./scan-header";
import { type ScannedSlide, type SectionStart, scanSlide } from "./scan-slide";
import { type RawSlide, splitSlides } from "./split-slides";

/**
 * Parses `.deck` text into a deck and its diagnostics.
 *
 * The parser never throws, whatever the text: every problem becomes a
 * diagnostic and the deck is the best reading of what was written. The same
 * text and options always give the same result. Block bodies are read by the
 * blocks in the registry; core itself knows no block.
 *
 * @param source - The deck text.
 * @param options - The block registry, and optionally a message catalog and the installed resources.
 * @returns The deck and every diagnostic, sorted by position.
 *
 * @example
 * ```ts
 * const registry = createBlockRegistry([sequence]);
 * const { deck, diagnostics } = parse("# Hello\n\n---\n\n## Second slide", { registry });
 * deck.slides.length; // 2
 * diagnostics[0]?.code; // "I401": no format line, version 1 is assumed
 * ```
 */
export function parse(source: string, options: ParseOptions): ParseOutput {
	const installed = options.installed ?? {};
	const original = splitLines(source);
	const declared = scanHeader(original, {
		registry: options.registry,
		reporter: createReporter(undefined),
		installed,
	}).declaredFormat;
	const lines = migrateToCurrent(original, declared);

	const reporter = createReporter(options.messages);
	const headerContext: HeaderContext = {
		registry: options.registry,
		reporter,
		installed,
	};
	const header = scanHeader(lines, headerContext);
	const context = {
		...headerContext,
		meta: header.meta,
		ids: new Map<string, number>(),
	};

	const sections: Section[] = [];
	const slides: Slide[] = [];
	let pending: SectionStart | undefined;
	let title = header.meta.title;

	for (const raw of splitSlides(lines, header.end)) {
		const scanned = scanSlide(raw, context);
		pending = scanned.sections.at(-1) ?? pending;
		if (scanned.empty) {
			if (!isSilentlyEmpty(raw)) reporter.report("I402", scanned.location, {});
			continue;
		}
		if (pending !== undefined) {
			sections.push({
				index: sections.length,
				title: pending.title,
				firstSlide: slides.length,
				location: pending.location,
			});
			pending = undefined;
		}
		if (title === "") title = scanned.firstHeading ?? "";
		slides.push(toSlide(scanned, slides.length, sections.length - 1));
	}

	return {
		deck: {
			meta: { ...header.meta, title },
			header: header.entries,
			sections,
			slides,
		},
		diagnostics: sortByPosition(reporter.diagnostics),
	};
}

function toSlide(scanned: ScannedSlide, index: number, section: number): Slide {
	return {
		index,
		section: section < 0 ? null : section,
		options: scanned.options,
		content: scanned.content,
		notes: scanned.notes,
		location: scanned.location,
	};
}

/**
 * Blank space before the first separator or after the last one is not a
 * slide the author meant to write, so skipping it is not worth a remark.
 */
function isSilentlyEmpty(slide: RawSlide): boolean {
	return slide.edge && slide.lines.every((line) => isBlank(line.raw));
}
