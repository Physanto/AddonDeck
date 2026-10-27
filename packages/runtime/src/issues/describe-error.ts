// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** A short description of something a block threw, for a message. */
export function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
