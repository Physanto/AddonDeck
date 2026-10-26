// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DiagnosticCode } from "./diagnostic-codes";

/** Keys of the diagnostic text catalog: every code plus shared phrases. */
export type DiagnosticMessageKey = DiagnosticCode | "didYouMean";

/**
 * A complete diagnostic text catalog for one language.
 *
 * Messages are templates: `{name}` is replaced with the parameter `name`.
 */
export type DiagnosticMessages = Readonly<Record<DiagnosticMessageKey, string>>;

/** A catalog from a language pack; missing messages fall back to English. */
export type PartialDiagnosticMessages = Partial<DiagnosticMessages>;
