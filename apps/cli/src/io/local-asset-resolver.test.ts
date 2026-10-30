// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createLocalAssetResolver } from "./local-asset-resolver";

/** A deck folder with images, and files beside it that must stay out. */
function deckFolder(): string {
	const root = mkdtempSync(join(tmpdir(), "addondeck-assets-"));
	const deck = join(root, "deck");
	mkdirSync(join(deck, "assets"), { recursive: true });
	mkdirSync(join(deck, "photos"));
	writeFileSync(join(deck, "team.PNG"), Uint8Array.of(1, 2));
	writeFileSync(join(deck, "photos", "trip.jpg"), Uint8Array.of(3));
	writeFileSync(join(deck, "assets", "train.svg"), "<svg/>");
	writeFileSync(join(deck, "assets", "team.png"), Uint8Array.of(9));
	writeFileSync(join(deck, "assets", "clip.webm"), Uint8Array.of(4));
	writeFileSync(join(deck, "notes.txt"), "text");
	writeFileSync(join(root, "outside.png"), Uint8Array.of(5));
	symlinkSync(join(root, "outside.png"), join(deck, "link.png"));
	return deck;
}

describe("createLocalAssetResolver", () => {
	it("reads an image relative to the deck's folder", async () => {
		const assets = createLocalAssetResolver(deckFolder());
		expect(await assets.resolve("image:team.PNG")).toEqual({
			kind: "image",
			mediaType: "image/png",
			bytes: Uint8Array.of(1, 2),
		});
		expect(await assets.resolve("image:photos/trip.jpg")).toMatchObject({
			mediaType: "image/jpeg",
			bytes: Uint8Array.of(3),
		});
	});

	it("looks in the assets folder after the deck's folder", async () => {
		const assets = createLocalAssetResolver(deckFolder());
		expect(await assets.resolve("image:train.svg")).toMatchObject({
			kind: "image",
			mediaType: "image/svg+xml",
		});
		expect(await assets.resolve("image:clip.webm")).toMatchObject({
			kind: "video",
			mediaType: "video/webm",
		});
		expect((await assets.resolve("image:team.PNG"))?.bytes).toEqual(
			Uint8Array.of(1, 2),
		);
	});

	it("never reads outside the deck's folder", async () => {
		const deck = deckFolder();
		const assets = createLocalAssetResolver(deck);
		expect(await assets.resolve("image:../outside.png")).toBeNull();
		expect(
			await assets.resolve(`image:${join(deck, "..", "outside.png")}`),
		).toBeNull();
		expect(await assets.resolve("image:link.png")).toBeNull();
	});

	it("finds nothing for other files, missing files and other references", async () => {
		const assets = createLocalAssetResolver(deckFolder());
		expect(await assets.resolve("image:notes.txt")).toBeNull();
		expect(await assets.resolve("image:missing.png")).toBeNull();
		expect(await assets.resolve("url:https://example.com/a.png")).toBeNull();
		expect(await assets.resolve("emoji:dog")).toBeNull();
	});
});
