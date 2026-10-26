// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

const ID = /^\p{L}[\p{L}\p{N}_-]*$/u;

/** Whether a word is a valid block id: a letter, then letters, digits, `-` or `_`. */
export function isValidId(word: string): boolean {
	return ID.test(word);
}
