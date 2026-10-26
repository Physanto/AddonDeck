// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { extractStepAnnotations } from "../annotations/extract-step-annotations";
import { DEFAULT_SLIDE_OPTIONS } from "../model/defaults";
import type { SlideNode } from "../model/slide-node";
import type { SlideOptions } from "../model/slide-options";
import type { SourceLine } from "../model/source-line";
import type { SourceLocation } from "../model/source-location";
import type { SpeakerNotes } from "../model/speaker-notes";
import { closestKeyword } from "../text/closest-keyword";
import { isBlank, isIndented } from "../text/indentation";
import { normalizeKeyword } from "../text/normalize-keyword";
import { buildBlockNode } from "./build-block-node";
import { closesFence, type Fence, readFence } from "./fence";
import type { SlideContext } from "./parse-context";
import { readBlockHeader } from "./read-block-header";
import { readLevelOneHeading } from "./read-heading";
import { readIndentedBody } from "./read-indented-body";
import { type KeyValueLine, readKeyValueLine } from "./read-key-value-line";
import {
	type MutableSlideOptions,
	readSlideOptions,
} from "./read-slide-options";
import type { RawSlide } from "./split-slides";
import {
	NOTES_KEYWORD,
	SECTION_KEYWORD,
	STRUCTURE_KEYWORDS,
} from "./structure-keywords";

/** A `section:` directive found at the start of a slide. */
export interface SectionStart {
	readonly title: string;
	readonly location: SourceLocation;
}

/** A slide after reading its lines, before sections and indexes are assigned. */
export interface ScannedSlide {
	/** Whether the slide has no text, blocks or notes. */
	readonly empty: boolean;
	readonly sections: readonly SectionStart[];
	readonly options: SlideOptions;
	readonly content: readonly SlideNode[];
	readonly notes: SpeakerNotes | null;
	readonly location: SourceLocation;
	/** Text of the first level-1 heading outside code fences, if any. */
	readonly firstHeading: string | null;
}

interface Trigger {
	readonly id: string;
	readonly location: SourceLocation;
}

interface OpenFence extends Fence {
	readonly location: SourceLocation;
}

/**
 * Reads the lines of one slide: leading directives, text, blocks, notes and
 * comments, in that order of precedence. Every line ends up somewhere; what
 * cannot be read as structure is text.
 */
export function scanSlide(
	slide: RawSlide,
	context: SlideContext,
): ScannedSlide {
	const { lines } = slide;
	const { reporter, registry } = context;
	const messages = reporter.messages;
	const content: SlideNode[] = [];
	const sections: SectionStart[] = [];
	const options: MutableSlideOptions = { ...DEFAULT_SLIDE_OPTIONS };
	const notes: SourceLine[][] = [];
	const triggers: Trigger[] = [];
	let notesLocation: SourceLocation | null = null;
	let firstHeading: string | null = null;
	let text: SourceLine[] = [];
	let fence: OpenFence | null = null;
	let leading = true;

	const flushText = (): void => {
		const first = text.findIndex((line) => !isBlank(line.raw));
		if (first !== -1) {
			let last = text.length;
			while (isBlank(text[last - 1]?.raw ?? "")) last--;
			const kept = text.slice(first, last);
			const location = { line: kept[0]?.line ?? slide.startLine, column: 1 };
			content.push({ kind: "text", lines: kept, location });
		}
		text = [];
	};

	const addText = (line: SourceLine): void => {
		leading = false;
		text.push(line);
		const opener = readFence(line.raw);
		if (opener !== null) {
			const column = line.raw.length - line.raw.trimStart().length + 1;
			fence = { ...opener, location: { line: line.line, column } };
			return;
		}
		const result = extractStepAnnotations(
			line,
			messages === undefined ? {} : { messages },
		);
		reporter.add(result.diagnostics);
		const { annotation } = result;
		if (annotation !== null) {
			for (const id of annotation.triggers) {
				triggers.push({ id, location: annotation.location });
			}
		}
		firstHeading ??= readLevelOneHeading(result.content);
	};

	const applyDirective = (
		entry: KeyValueLine,
		line: SourceLine,
		trimmed: string,
	): void => {
		if (entry.key === SECTION_KEYWORD) {
			if (entry.value === "") {
				reporter.report(
					"W303",
					{ line: line.line, column: entry.valueColumn },
					{ key: entry.keyword, value: entry.value },
				);
			} else {
				sections.push({
					title: entry.value,
					location: { line: line.line, column: 1 },
				});
			}
			return;
		}
		readSlideOptions(
			trimmed,
			line.line,
			entry.valueColumn - 1,
			options,
			context,
		);
	};

	let index = 0;
	while (index < lines.length) {
		const line = lines[index] as SourceLine;
		const trimmed = line.raw.trimEnd();
		index++;

		if (fence !== null) {
			text.push(line);
			if (closesFence(fence, trimmed)) fence = null;
			continue;
		}
		if (trimmed === "") {
			if (!leading) text.push(line);
			continue;
		}
		if (isIndented(trimmed) || trimmed.startsWith("\\")) {
			addText(line);
			continue;
		}
		if (trimmed.startsWith("//")) continue;

		const entry = readKeyValueLine(trimmed);
		if (entry !== null && STRUCTURE_KEYWORDS.includes(entry.key)) {
			if (entry.key === NOTES_KEYWORD) {
				if (entry.value === "") {
					flushText();
					leading = false;
					const body = readIndentedBody(lines, index, reporter);
					index = body.end;
					if (body.lines.length === 0) {
						reporter.report("W313", { line: line.line, column: 1 }, {});
					} else {
						notes.push([...body.lines]);
						notesLocation ??= { line: line.line, column: 1 };
					}
					continue;
				}
				reporter.report(
					"I403",
					{ line: line.line, column: 1 },
					{ keyword: entry.keyword },
				);
			} else if (leading) {
				applyDirective(entry, line, trimmed);
				continue;
			} else {
				reporter.report(
					"W306",
					{ line: line.line, column: 1 },
					{ keyword: entry.keyword },
				);
			}
			addText(line);
			continue;
		}

		const header = readBlockHeader(trimmed);
		const definition =
			header === null ? undefined : registry.resolve(header.keyword);
		if (header !== null && definition !== undefined) {
			if (header.ending === "colon") {
				flushText();
				leading = false;
				const body = readIndentedBody(lines, index, reporter);
				index = body.end;
				content.push(
					buildBlockNode(definition, header, body.lines, line.line, context),
				);
				continue;
			}
			if (header.ending === "text") {
				reporter.report(
					"I403",
					{ line: line.line, column: 1 },
					{ keyword: header.keyword },
				);
			} else if (nextContentIsIndented(lines, index)) {
				reporter.report(
					"W305",
					{ line: line.line, column: 1 },
					{ type: definition.type },
				);
			}
		} else if (header !== null && header.ending === "colon") {
			const keyword = normalizeKeyword(header.keyword);
			const close = closestKeyword(keyword, [
				...registry.keywords,
				...STRUCTURE_KEYWORDS,
			]);
			const suggestion = close === keyword ? null : close;
			if (suggestion !== null || header.options.length > 0) {
				reporter.report(
					"W304",
					{ line: line.line, column: 1 },
					{ keyword: header.keyword },
					suggestion,
				);
			}
		}
		addText(line);
	}

	// `fence` is only reassigned inside `addText`, which control-flow analysis
	// does not follow, so without the cast it is typed as always `null` here.
	const openFence = fence as OpenFence | null;
	if (openFence !== null) {
		reporter.report("W311", openFence.location, {
			openLine: openFence.location.line,
		});
	}
	flushText();

	const ids = new Set<string>();
	for (const node of content) {
		if (node.kind === "block" && node.id !== null) ids.add(node.id);
	}
	for (const trigger of triggers) {
		if (!ids.has(trigger.id))
			reporter.report("E204", trigger.location, { id: trigger.id });
	}

	const firstLine =
		lines.find((line) => !isBlank(line.raw))?.line ?? slide.startLine;
	return {
		empty: content.length === 0 && notes.length === 0,
		sections,
		options,
		content,
		notes: notesLocation === null ? null : joinNotes(notes, notesLocation),
		location: { line: firstLine, column: 1 },
		firstHeading,
	};
}

function nextContentIsIndented(
	lines: readonly SourceLine[],
	start: number,
): boolean {
	const next = lines.slice(start).find((line) => !isBlank(line.raw));
	return next !== undefined && isIndented(next.raw);
}

function joinNotes(
	groups: readonly SourceLine[][],
	location: SourceLocation,
): SpeakerNotes {
	return {
		lines: groups.flat(),
		text: groups
			.map((group) => group.map((line) => line.text).join("\n"))
			.join("\n\n"),
		location,
	};
}
