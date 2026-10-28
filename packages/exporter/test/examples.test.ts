// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

// The example decks of the repository, exported with stand-ins for the
// compiled artifacts and the image files of examples/assets/.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unescapeEmbeddedSource } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { exportDeck } from "../src/index";
import {
	createArtifactSource,
	createTestRegistry,
	readPage,
} from "./support/fake-io";

// The test DOM replaces the global URL, so paths are built without it.
const EXAMPLES = join(import.meta.dirname, "../../../examples");

function example(name: string): string {
	return readFileSync(join(EXAMPLES, name), "utf8");
}

describe("the example decks", () => {
	it("exports hello.deck with the runtime, the animator and the text block only", async () => {
		const source = example("hello.deck");
		const result = await exportDeck(
			source,
			{ registry: createTestRegistry() },
			{
				artifacts: createArtifactSource(),
				assets: { resolve: async () => null },
			},
		);
		if (!result.ok) throw new Error("hello.deck did not export");
		expect(result.diagnostics).toEqual([]);
		expect(result.analysis).toEqual({
			blocks: ["text"],
			adapters: ["animator"],
			theme: "paper",
			assets: [],
		});
		const page = readPage(result.html);
		expect(page.title).toBe("Hello, AddonDeck");
		expect(page.documentElement.lang).toBe("en");
		expect(page.getElementById("addondeck-assets")).toBeNull();
		expect(page.querySelectorAll("script")).toHaveLength(5);
		expect(
			unescapeEmbeddedSource(
				page.getElementById("addondeck-source")?.textContent ?? "",
			),
		).toBe(source);
	});

	it("embeds the images of trains.deck from examples/assets/", async () => {
		const result = await exportDeck(
			example("trains.deck"),
			{ registry: createTestRegistry() },
			{
				artifacts: createArtifactSource(),
				assets: {
					resolve: async (reference) => ({
						kind: "image",
						mediaType: "image/svg+xml",
						bytes: readFileSync(
							join(EXAMPLES, "assets", reference.replace(/^image:/, "")),
						),
					}),
				},
			},
		);
		if (!result.ok) throw new Error("trains.deck did not export");
		expect(result.analysis.assets.map((use) => use.reference)).toEqual([
			"image:landscape.svg",
			"image:train.svg",
		]);
		const json = JSON.parse(
			readPage(result.html).getElementById("addondeck-assets")?.textContent ??
				"",
		);
		expect(Object.keys(json.files)).toHaveLength(2);
		expect(json.assets["image:train.svg"].file).toMatch(
			/^sha256-[0-9a-f]{64}$/,
		);
		expect(json.files[json.assets["image:train.svg"].file]).toMatch(
			/^data:image\/svg\+xml;base64,/,
		);
	});
});
