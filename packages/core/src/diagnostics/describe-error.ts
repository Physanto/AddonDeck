// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * A short text for something a block threw, to show in error `E201`.
 * Never throws itself, even for values whose conversion to text throws.
 */
export function describeError(error: unknown): string {
	try {
		if (error instanceof Error) return error.message || error.name;
		return String(error);
	} catch {
		return typeof error;
	}
}
