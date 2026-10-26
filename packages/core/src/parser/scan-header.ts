// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta, HeaderEntry, HeaderKey } from "../model/deck-meta";
import {
	DEFAULT_DECK_META,
	FORMAT_VERSION,
	HEADER_KEYS,
	MOTION_PERSONALITIES,
} from "../model/defaults";
import { closestKeyword } from "../text/closest-keyword";
import { isBlank } from "../text/indentation";
import { normalizeKeyword } from "../text/normalize-keyword";
import {
	isBackground,
	isColor,
	isInstalled,
	isLanguageTag,
	readSwitch,
} from "./header-values";
import type { HeaderContext } from "./parse-context";
import { type KeyValueLine, readKeyValueLine } from "./read-key-value-line";
import { isSeparator } from "./split-slides";
import { STRUCTURE_KEYWORDS } from "./structure-keywords";

/** The header of a deck and where the first slide starts. */
export interface HeaderScan {
	/** Settings with defaults applied. `title` is empty when the header has none. */
	readonly meta: DeckMeta;
	readonly entries: readonly HeaderEntry[];
	/** The `format` value as written when it was a positive integer, else `null`. */
	readonly declaredFormat: number | null;
	/** Index of the first line after the header. */
	readonly end: number;
}

type MutableMeta = { -readonly [K in keyof DeckMeta]: DeckMeta[K] };

const POSITIVE_INTEGER = /^\d+$/;

function isHeaderKey(key: string): key is HeaderKey {
	return (HEADER_KEYS as readonly string[]).includes(key);
}

function isMotion(value: string): value is DeckMeta["motion"] {
	return (MOTION_PERSONALITIES as readonly string[]).includes(value);
}

/**
 * Reads the header: the `key: value` lines at the start of the deck, ignoring
 * blank lines and comments. It ends at the first other line or at `---`.
 *
 * A key close to a header key (`titel:`) stays in the header, ignored with
 * `W301`, so a typo does not turn the rest of the settings into slide text.
 * Exact block and directive keywords never count as close keys.
 */
export function scanHeader(
	lines: readonly string[],
	context: HeaderContext,
): HeaderScan {
	const { reporter, registry } = context;
	const meta: MutableMeta = { ...DEFAULT_DECK_META };
	const entries: HeaderEntry[] = [];
	const firstLines = new Map<HeaderKey, number>();
	let declaredFormat: number | null = null;
	let index = 0;

	const invalid = (entry: KeyValueLine, line: number): void => {
		reporter.report(
			"W303",
			{ line, column: entry.valueColumn },
			{ key: entry.keyword, value: entry.value },
		);
	};

	for (; index < lines.length; index++) {
		const raw = (lines[index] ?? "").trimEnd();
		const line = index + 1;
		if (isBlank(raw) || raw.startsWith("//")) continue;
		if (isSeparator(raw)) break;
		const entry = readKeyValueLine(raw);
		if (entry === null) break;

		const { key } = entry;
		if (!isHeaderKey(key)) {
			if (STRUCTURE_KEYWORDS.includes(key) || registry.resolve(key)) break;
			const suggestion = closestKeyword(key, HEADER_KEYS);
			if (suggestion === null) break;
			reporter.report(
				"W301",
				{ line, column: 1 },
				{ key: entry.keyword },
				suggestion,
			);
			continue;
		}

		const firstLine = firstLines.get(key);
		if (firstLine === undefined) {
			firstLines.set(key, line);
		} else {
			reporter.report(
				"W302",
				{ line, column: 1 },
				{ key: entry.keyword, firstLine },
			);
		}
		entries.push({
			key,
			keyword: entry.keyword,
			value: entry.value,
			location: { line, column: 1 },
		});

		const { value } = entry;
		const location = { line, column: entry.valueColumn };
		switch (key) {
			case "format": {
				const version = Number(value);
				if (!POSITIVE_INTEGER.test(value) || version < 1) {
					declaredFormat = null;
					reporter.report("E102", location, { value });
				} else {
					declaredFormat = version;
					if (version > FORMAT_VERSION) {
						reporter.report("E101", location, {
							version: value,
							supported: FORMAT_VERSION,
						});
					}
				}
				break;
			}
			case "title":
				meta.title = value;
				break;
			case "author":
				meta.author = value;
				break;
			case "language":
				if (isLanguageTag(value)) meta.language = value;
				else invalid(entry, line);
				break;
			case "theme": {
				const theme = normalizeKeyword(value);
				if (theme !== "" && isInstalled(theme, context.installed.themes)) {
					meta.theme = theme;
				} else {
					invalid(entry, line);
				}
				break;
			}
			case "motion": {
				const motion = normalizeKeyword(value);
				if (isMotion(motion)) meta.motion = motion;
				else invalid(entry, line);
				break;
			}
			case "color":
			case "accent":
				if (isColor(value)) meta[key] = value;
				else invalid(entry, line);
				break;
			case "font":
				if (value !== "" && isInstalled(value, context.installed.fonts)) {
					meta.font = value;
				} else {
					invalid(entry, line);
				}
				break;
			case "background":
				if (isBackground(value, context.installed.backgrounds)) {
					meta.background = value;
				} else {
					invalid(entry, line);
				}
				break;
			case "watermark": {
				const watermark = readSwitch(value);
				if (watermark === null) invalid(entry, line);
				else meta.watermark = watermark;
				break;
			}
		}
	}

	if (!firstLines.has("format")) {
		reporter.report(
			"I401",
			{ line: 1, column: 1 },
			{ supported: FORMAT_VERSION },
		);
	}
	return { meta, entries, declaredFormat, end: index };
}
