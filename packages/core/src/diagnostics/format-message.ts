// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DiagnosticParams } from "./diagnostic";

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Replaces each `{name}` in a message template with the parameter `name`.
 * Placeholders without a parameter are left as written, so a missing value is
 * visible instead of silently empty.
 */
export function formatMessage(
	template: string,
	params: DiagnosticParams,
): string {
	return template.replace(PLACEHOLDER, (placeholder, name: string) => {
		const value = params[name];
		return value === undefined ? placeholder : String(value);
	});
}
