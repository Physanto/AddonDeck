// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** A short text for something a block threw, for failure messages. */
export function describeThrown(error: unknown): string {
	try {
		if (error instanceof Error) return error.message || error.name;
		return String(error);
	} catch {
		return typeof error;
	}
}
