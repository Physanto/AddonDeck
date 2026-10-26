// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLine } from "../model/source-line";
import type { SourceLocation } from "../model/source-location";
import type { BlockOption } from "./block-option";

/**
 * What a block definition receives to parse: its header, split into parts, and
 * its body exactly as written.
 */
export interface BlockSource {
	/** Canonical block type, such as `sequence`, whatever alias was written. */
	readonly type: string;
	/** The keyword as written in the header. */
	readonly keyword: string;
	/** Normalized value of the `id=` option, or `null` when the block has none. */
	readonly id: string | null;
	/** Bare words of the header, in order, such as `python` in `code python:`. */
	readonly args: readonly string[];
	/** `key=value` options of the header, in order, without `id`. */
	readonly options: readonly BlockOption[];
	/** Body lines, without trailing blank lines. Empty when the block has no body. */
	readonly body: readonly SourceLine[];
	/** Location of the block header. */
	readonly location: SourceLocation;
}
