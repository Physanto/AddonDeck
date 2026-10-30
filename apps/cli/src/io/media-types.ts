// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { extname } from "node:path";
import type { EmbeddedAssetKind } from "@addondeck/exporter";

/** What a local file is embedded as. */
export interface MediaType {
	readonly kind: EmbeddedAssetKind;
	readonly mediaType: string;
}

const BY_EXTENSION: Readonly<Record<string, MediaType>> = {
	".png": { kind: "image", mediaType: "image/png" },
	".jpg": { kind: "image", mediaType: "image/jpeg" },
	".jpeg": { kind: "image", mediaType: "image/jpeg" },
	".gif": { kind: "image", mediaType: "image/gif" },
	".webp": { kind: "image", mediaType: "image/webp" },
	".avif": { kind: "image", mediaType: "image/avif" },
	".svg": { kind: "image", mediaType: "image/svg+xml" },
	".mp4": { kind: "video", mediaType: "video/mp4" },
	".webm": { kind: "video", mediaType: "video/webm" },
};

/**
 * The media type of a file the exported page can show, by its extension, or
 * `null` for any other file.
 */
export function mediaTypeOf(path: string): MediaType | null {
	return BY_EXTENSION[extname(path).toLowerCase()] ?? null;
}
