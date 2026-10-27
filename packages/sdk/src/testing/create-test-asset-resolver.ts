// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type {
	AssetKind,
	AssetResolver,
	ResolvedAsset,
} from "../services/asset-resolver";

const KINDS: readonly AssetKind[] = [
	"emoji",
	"icon",
	"image",
	"video",
	"background",
	"font",
];

/**
 * Creates an asset resolver that resolves every reference that is not blank,
 * to a `data:` URL that contains the reference. The kind comes from the
 * prefix (`icon:lucide/heart` is an icon); without a known prefix it is an image.
 */
export function createTestAssetResolver(): AssetResolver {
	return {
		resolve(reference): ResolvedAsset | null {
			if (reference.trim() === "") return null;
			const prefix = reference.slice(0, reference.indexOf(":"));
			const kind = KINDS.find((known) => known === prefix) ?? "image";
			return { kind, url: `data:,${encodeURIComponent(reference)}` };
		},
	};
}
