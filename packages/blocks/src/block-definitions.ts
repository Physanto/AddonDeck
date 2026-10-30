// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockDefinition } from "@addondeck/sdk";
import { definition as image } from "./image/definition";
import { definition as list } from "./list/definition";
import { definition as text } from "./text/definition";

/**
 * The definitions of every built-in block, to parse decks with outside the
 * browser: `createBlockRegistry(BLOCK_DEFINITIONS)`. They are pure, so
 * importing them loads no view and touches no DOM.
 */
export const BLOCK_DEFINITIONS: readonly BlockDefinition[] = [
	text,
	list,
	image,
];
