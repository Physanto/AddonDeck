// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "./sha256";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("sha256", () => {
	it("hashes bytes in hexadecimal", async () => {
		expect(await sha256(Uint8Array.of(0x61, 0x62, 0x63))).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});

	it("fails without Web Crypto", async () => {
		vi.stubGlobal("crypto", undefined);
		await expect(sha256(new Uint8Array())).rejects.toThrow(
			"Web Crypto is not available.",
		);
	});
});
