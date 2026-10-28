// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { toBase64 } from "./to-base64";

// Present in browsers and Node.js; the package compiles without their types.
declare function btoa(data: string): string;

const bytes = (text: string): Uint8Array =>
	Uint8Array.from(text, (char) => char.charCodeAt(0));

describe("toBase64", () => {
	it("pads the last group", () => {
		expect(toBase64(bytes(""))).toBe("");
		expect(toBase64(bytes("f"))).toBe("Zg==");
		expect(toBase64(bytes("fo"))).toBe("Zm8=");
		expect(toBase64(bytes("foo"))).toBe("Zm9v");
		expect(toBase64(bytes("foobar"))).toBe("Zm9vYmFy");
	});

	it("encodes any bytes as the platform does", () => {
		fc.assert(
			fc.property(fc.uint8Array({ maxLength: 64 }), (data) => {
				expect(toBase64(data)).toBe(btoa(String.fromCharCode(...data)));
			}),
		);
	});
});
