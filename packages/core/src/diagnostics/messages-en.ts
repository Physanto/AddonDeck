// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DiagnosticMessages } from "./diagnostic-messages";

/** English diagnostic messages, the fallback for every other language. */
export const EN_DIAGNOSTIC_MESSAGES: DiagnosticMessages = {
	E101: "This deck uses format {version}, but only format {supported} is supported. It is read as format {supported}.",
	E102: '"{value}" is not a valid format version. Use a whole number, such as "format: 1".',
	E201: "The {type} block could not be read ({reason}). It is shown as text.",
	E202: 'The id "{id}" is already used on line {firstLine}.',
	E203: '"{id}" is not a valid id. Start with a letter and use only letters, digits, "-" and "_".',
	E204: 'No block on this slide has the id "{id}".',
	W301: 'Unknown header key "{key}"; it is ignored.',
	W302: '"{key}" was already set on line {firstLine}; this value replaces it.',
	W303: '"{value}" is not a valid value for "{key}", so it is ignored.',
	W304: 'Unknown block "{keyword}"; it is shown as text.',
	W305: 'This looks like a {type} block, but the line does not end with ":"; it is shown as text.',
	W306: '"{keyword}:" only works at the start of a slide; here it is shown as text.',
	W307: '"@{step}" needs at least two spaces before it to be a step annotation; it is shown as text.',
	W308: 'Unknown slide option "{option}"; it is ignored.',
	W309: '"{value}" is not a valid value for the slide option "{option}"; "{fallback}" is used instead.',
	W310: '"@{step}" is not a valid step. Steps are whole numbers starting at 1, so the annotation is ignored.',
	W311: "The code fence opened on line {openLine} is never closed; it ends with the slide.",
	W312: "This line is indented less than the rest of the block.",
	W313: '"notes:" has no indented text below it.',
	W314: '"{word}" has no value. Slide options are written as key=value, so it is ignored.',
	I401: 'There is no "format:" line, so format {supported} is assumed.',
	I402: "This slide has no content, so it is skipped.",
	I403: '"{keyword}:" is followed by text, so the line is shown as text. To start a block, put its content on the next lines, indented.',
	didYouMean: 'Did you mean "{suggestion}"?',
};
