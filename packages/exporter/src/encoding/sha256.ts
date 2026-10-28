// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// The package compiles without the DOM and Node.js types, so it declares the
// one Web Crypto method it uses. Browsers and Node.js both have it.
interface Digest {
	digest(algorithm: "SHA-256", data: Uint8Array): Promise<ArrayBuffer>;
}

/**
 * The SHA-256 hash of some bytes, in lowercase hexadecimal.
 *
 * @throws Error when the platform has no Web Crypto.
 */
export async function sha256(bytes: Uint8Array): Promise<string> {
	const subtle = (globalThis as { crypto?: { subtle?: Digest } }).crypto
		?.subtle;
	if (subtle === undefined) throw new Error("Web Crypto is not available.");
	const hash = new Uint8Array(await subtle.digest("SHA-256", bytes));
	return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}
