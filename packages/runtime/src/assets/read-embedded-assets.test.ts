// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { readEmbeddedAssets } from "./read-embedded-assets";

describe("readEmbeddedAssets", () => {
	it("reads assets by reference, each pointing at its file", () => {
		const { assets, error, invalid } = readEmbeddedAssets(
			JSON.stringify({
				files: { "sha256-a": "data:image/png;base64,AA" },
				assets: {
					"image:logo.png": { kind: "image", file: "sha256-a" },
					"image:copy.png": {
						kind: "image",
						file: "sha256-a",
						credit: "Someone",
					},
				},
			}),
		);
		expect(error).toBeNull();
		expect(invalid).toEqual([]);
		expect(assets.get("image:logo.png")).toEqual({
			kind: "image",
			url: "data:image/png;base64,AA",
		});
		expect(assets.get("image:copy.png")).toEqual({
			kind: "image",
			url: "data:image/png;base64,AA",
			credit: "Someone",
		});
	});

	it("accepts an entry that carries its own url", () => {
		const { assets } = readEmbeddedAssets(
			JSON.stringify({
				assets: { "emoji:dog": { kind: "emoji", url: "data:,dog" } },
			}),
		);
		expect(assets.get("emoji:dog")?.url).toBe("data:,dog");
	});

	it("treats blank text and an empty object as no assets", () => {
		expect(readEmbeddedAssets("  \n").assets.size).toBe(0);
		expect(readEmbeddedAssets("").error).toBeNull();
		expect(readEmbeddedAssets("{}")).toEqual({
			assets: new Map(),
			error: null,
			invalid: [],
		});
	});

	it("reports text that is not a JSON object", () => {
		expect(readEmbeddedAssets("{oops").error).toEqual(expect.any(String));
		expect(readEmbeddedAssets("[]").error).toBe("not a JSON object");
		expect(readEmbeddedAssets("null").error).toBe("not a JSON object");
		expect(readEmbeddedAssets("{oops").assets.size).toBe(0);
	});

	it("reports files or assets that are not JSON objects", () => {
		expect(readEmbeddedAssets('{"files": []}').error).toBe(
			'"files" is not a JSON object',
		);
		expect(readEmbeddedAssets('{"assets": "x"}').error).toBe(
			'"assets" is not a JSON object',
		);
	});

	it("leaves out entries that are not assets and names them", () => {
		const { assets, invalid } = readEmbeddedAssets(
			JSON.stringify({
				files: { "sha256-a": "data:,", "sha256-n": 3 },
				assets: {
					good: { kind: "icon", file: "sha256-a" },
					noUrl: { kind: "icon" },
					missingFile: { kind: "icon", file: "sha256-b" },
					inherited: { kind: "icon", file: "toString" },
					badFile: { kind: "icon", file: "sha256-n" },
					badKind: { kind: "sound", url: "data:," },
					badCredit: { kind: "icon", url: "data:,", credit: 3 },
					text: "data:,",
				},
			}),
		);
		expect([...assets.keys()]).toEqual(["good"]);
		expect(invalid).toEqual([
			"noUrl",
			"missingFile",
			"inherited",
			"badFile",
			"badKind",
			"badCredit",
			"text",
		]);
	});
});
