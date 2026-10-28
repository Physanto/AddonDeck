// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// Written here because btoa needs a binary string, which is slow to build for
// large files, and Uint8Array.prototype.toBase64 is not in every browser yet.

const ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Encodes bytes as base64, with padding. */
export function toBase64(bytes: Uint8Array): string {
	const out: string[] = [];
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i] ?? 0;
		const b = bytes[i + 1];
		const c = bytes[i + 2];
		const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
		out.push(
			ALPHABET.charAt(triple >> 18),
			ALPHABET.charAt((triple >> 12) & 63),
			b === undefined ? "=" : ALPHABET.charAt((triple >> 6) & 63),
			c === undefined ? "=" : ALPHABET.charAt(triple & 63),
		);
	}
	return out.join("");
}
