// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Keys of the command line text catalog. */
export type CliMessageKey =
	| "help"
	| "missingCommand"
	| "unknownCommand"
	| "missingFile"
	| "extraArgument"
	| "unknownOption"
	| "missingValue"
	| "unexpectedValue"
	| "fileNotFound"
	| "unreadableFile"
	| "outputIsInput"
	| "unwritableOutput"
	| "error"
	| "warning"
	| "info"
	| "diagnostic"
	| "noProblems"
	| "oneError"
	| "errors"
	| "oneWarning"
	| "warnings"
	| "summary"
	| "wrote"
	| "wroteDespiteErrors"
	| "notWritten";

/**
 * A complete command line text catalog for one language.
 *
 * Messages are templates: `{name}` is replaced with the parameter `name`.
 */
export type CliMessages = Readonly<Record<CliMessageKey, string>>;

/** A catalog from a language pack; missing messages fall back to English. */
export type PartialCliMessages = Partial<CliMessages>;
