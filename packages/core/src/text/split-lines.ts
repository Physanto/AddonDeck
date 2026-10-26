// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

const BYTE_ORDER_MARK = "﻿";
const LINE_BREAK = /\r\n|\r|\n/;

/**
 * Splits deck text into lines, dropping a leading byte order mark and reading
 * `\r\n` and `\r` as `\n`. Empty text is one empty line.
 */
export function splitLines(source: string): readonly string[] {
	const text = source.startsWith(BYTE_ORDER_MARK) ? source.slice(1) : source;
	return text.split(LINE_BREAK);
}
