// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Kinds of adapter a block can ask for. The exporter includes an adapter, and
 * the library behind it, only when a block of the deck needs it.
 */
export type AdapterKind = "animator" | "physics" | "charts" | "highlighter";
