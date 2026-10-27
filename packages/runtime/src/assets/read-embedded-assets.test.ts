// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readEmbeddedAssets } from "./read-embedded-assets";

describe("readEmbeddedAssets", () => {
	it("reads assets by reference", () => {
		const { assets, error, invalid } = readEmbeddedAssets(
			JSON.stringify({
				"image:logo.png": { kind: "image", url: "data:image/png;base64,AA" },
				"emoji:dog": { kind: "emoji", url: "data:,dog", credit: "Someone" },
			}),
		);
		expect(error).toBeNull();
		expect(invalid).toEqual([]);
		expect(assets.get("image:logo.png")).toEqual({
			kind: "image",
			url: "data:image/png;base64,AA",
		});
		expect(assets.get("emoji:dog")?.credit).toBe("Someone");
	});

	it("treats blank text as no assets", () => {
		expect(readEmbeddedAssets("  \n").assets.size).toBe(0);
		expect(readEmbeddedAssets("").error).toBeNull();
	});

	it("reports text that is not a JSON object", () => {
		expect(readEmbeddedAssets("{oops").error).toEqual(expect.any(String));
		expect(readEmbeddedAssets("[]").error).toBe("not a JSON object");
		expect(readEmbeddedAssets("null").error).toBe("not a JSON object");
		expect(readEmbeddedAssets("{oops").assets.size).toBe(0);
	});

	it("leaves out entries that are not assets and names them", () => {
		const { assets, invalid } = readEmbeddedAssets(
			JSON.stringify({
				good: { kind: "icon", url: "data:," },
				noUrl: { kind: "icon" },
				badKind: { kind: "sound", url: "data:," },
				badCredit: { kind: "icon", url: "data:,", credit: 3 },
				text: "data:,",
			}),
		);
		expect([...assets.keys()]).toEqual(["good"]);
		expect(invalid).toEqual(["noUrl", "badKind", "badCredit", "text"]);
	});
});
