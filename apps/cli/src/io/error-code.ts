// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** The system's code for a failed file operation, such as `EACCES`. */
export function errorCode(thrown: unknown): string {
	if (thrown instanceof Error && "code" in thrown) return String(thrown.code);
	return String(thrown);
}
