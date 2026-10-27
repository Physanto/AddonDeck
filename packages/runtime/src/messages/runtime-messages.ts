// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/** Keys of the runtime text catalog. */
export type RuntimeMessageKey =
	| "missingRoot"
	| "missingSource"
	| "invalidAssets"
	| "invalidAsset"
	| "unregisteredBlock"
	| "missingAdapter"
	| "blockFailed"
	| "diagnostic"
	| "slideLabel";

/**
 * A complete runtime text catalog for one language.
 *
 * Messages are templates: `{name}` is replaced with the parameter `name`.
 */
export type RuntimeMessages = Readonly<Record<RuntimeMessageKey, string>>;

/** A catalog from a language pack; missing messages fall back to English. */
export type PartialRuntimeMessages = Partial<RuntimeMessages>;
