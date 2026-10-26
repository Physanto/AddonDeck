// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { SourceLocation } from "../model/source-location";

/** A `key=value` option from a block header. */
export interface BlockOption {
	/** Normalized key. */
	readonly key: string;
	/** The key as written. */
	readonly name: string;
	/** The value as written, without surrounding quotes. */
	readonly value: string;
	readonly location: SourceLocation;
}
