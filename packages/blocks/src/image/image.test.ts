// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import type { BlockOption, BlockSource } from "@addondeck/sdk";
import { createTestContext, runBlockContract } from "@addondeck/sdk/testing";
import { describe, expect, it } from "vitest";
import { definition, type ImageModel, toImageReference } from "./definition";
import docs from "./docs.md?raw";
import images from "./examples/images.deck?raw";
import { view } from "./view";

runBlockContract({
	definition,
	view,
	docs,
	examples: [{ name: "images.deck", source: images }],
});

function option(key: string, value: string): BlockOption {
	return { key, name: key, value, location: { line: 1, column: 7 } };
}

function source(header: Partial<BlockSource> = {}): BlockSource {
	return {
		type: "image",
		keyword: "image",
		id: null,
		args: [],
		options: [],
		body: [],
		location: { line: 1, column: 1 },
		...header,
	};
}

function codes(header: Partial<BlockSource>): string[] {
	return definition.parse(source(header)).diagnostics.map((d) => d.code);
}

function mount(model: ImageModel, resolves = true) {
	const el = document.createElement("div");
	const ctx = createTestContext(
		resolves ? {} : { assets: { resolve: () => null } },
	);
	const instance = view.mount(model, el, ctx);
	return { el, instance };
}

describe("image block", () => {
	it("reads the image from src= or from its first argument", () => {
		const alt = option("alt", "Team");
		expect(
			definition.parse(source({ options: [option("src", "a.png"), alt] }))
				.model,
		).toEqual({ reference: "image:a.png", alt: "Team", fit: "contain" });
		expect(
			definition.parse(
				source({ args: ["b.png"], options: [alt, option("fit", "Cover")] }),
			).model,
		).toEqual({ reference: "image:b.png", alt: "Team", fit: "cover" });
	});

	it("turns what is written into an asset reference", () => {
		expect(toImageReference("photo.jpg")).toBe("image:photo.jpg");
		expect(toImageReference("Image:photo.jpg")).toBe("Image:photo.jpg");
		expect(toImageReference("https://x.org/a.png")).toBe(
			"url:https://x.org/a.png",
		);
		expect(toImageReference("icon:lucide/heart")).toBe("icon:lucide/heart");
		expect(toImageReference("emoji:dog")).toBe("emoji:dog");
	});

	it("is an error without an image, and is shown as text", () => {
		const result = definition.parse(source({ options: [option("alt", "x")] }));
		expect(result.model).toBeNull();
		expect(result.diagnostics.map((d) => d.code)).toEqual(["IMAGE-E01"]);
		expect(codes({ options: [option("src", " ")] })).toEqual(["IMAGE-E01"]);
	});

	it("warns when the alt text is missing, but not when it is empty", () => {
		expect(codes({ args: ["a.png"] })).toEqual(["IMAGE-W03"]);
		expect(codes({ args: ["a.png"], options: [option("alt", "")] })).toEqual(
			[],
		);
	});

	it("warns about what it ignores", () => {
		const alt = option("alt", "x");
		expect(
			codes({
				args: ["a.png", "big"],
				options: [alt, option("size", "2")],
			}),
		).toEqual(["IMAGE-W01", "IMAGE-W01"]);
		expect(
			codes({ args: ["b.png"], options: [option("src", "a.png"), alt] }),
		).toEqual(["IMAGE-W01"]);
		expect(
			codes({ args: ["a.png"], options: [alt, option("fit", "fill")] }),
		).toEqual(["IMAGE-W02"]);
		expect(
			codes({
				args: ["a.png"],
				options: [alt],
				body: [{ line: 2, raw: "  extra", text: "extra" }],
			}),
		).toEqual(["IMAGE-W04"]);
	});

	it("has no steps", () => {
		expect(
			definition.steps({ reference: "image:a.png", alt: "", fit: "contain" }),
		).toEqual([]);
	});

	it("names its image as the asset to embed", () => {
		expect(
			definition.assets?.({
				reference: "image:a.png",
				alt: "",
				fit: "contain",
			}),
		).toEqual(["image:a.png"]);
	});

	it("draws the resolved image with its alt text and fit", () => {
		const { el } = mount({ reference: "image:a.png", alt: "A", fit: "cover" });
		const figure = el.querySelector("figure");
		expect(figure?.dataset.fit).toBe("cover");
		const image = el.querySelector("img");
		expect(image?.getAttribute("src")).toBe("data:,image%3Aa.png");
		expect(image?.alt).toBe("A");
	});

	it("draws a frame with the alt text and the reference when nothing resolves", () => {
		const { el } = mount(
			{ reference: "image:gone.png", alt: "<b>Gone</b>", fit: "contain" },
			false,
		);
		expect(el.querySelector("img")).toBeNull();
		const frame = el.querySelector(".adk-image-missing");
		expect(frame?.getAttribute("role")).toBe("img");
		expect(frame?.getAttribute("aria-label")).toBe("<b>Gone</b>");
		expect(frame?.textContent).toBe("<b>Gone</b>image:gone.png");
		expect(el.querySelector("b")).toBeNull();
	});

	it("removes what it drew when destroyed", async () => {
		const { el, instance } = mount({
			reference: "image:a.png",
			alt: "",
			fit: "contain",
		});
		instance.setState(1);
		await instance.play(0, 1);
		instance.destroy();
		expect(el.innerHTML).toBe("");
	});
});
