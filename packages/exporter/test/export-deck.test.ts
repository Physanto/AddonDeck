// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { type Diagnostic, unescapeEmbeddedSource } from "@addondeck/core";
import { describe, expect, it } from "vitest";
import { type ExportResult, exportDeck } from "../src/index";
import {
	createTestArtifacts,
	createTestIO,
	createTestRegistry,
	png,
	readPage,
} from "./support/fake-io";

type Exported = Extract<ExportResult, { ok: true }>;

async function exported(
	source: string,
	io = createTestIO(),
	force = false,
): Promise<Exported> {
	const result = await exportDeck(
		source,
		{ registry: createTestRegistry(), force },
		io,
	);
	if (!result.ok) {
		throw new Error(result.diagnostics.map((d) => d.message).join("\n"));
	}
	return result;
}

function scripts(page: Document): string[] {
	return [...page.querySelectorAll("script:not([type])")].map(
		(script) => script.textContent?.trim() ?? "",
	);
}

/** The exporter's own diagnostics, without those of the deck text. */
function problems(result: ExportResult): Diagnostic[] {
	return result.diagnostics.filter((diagnostic) =>
		diagnostic.code.startsWith("EXPORT-"),
	);
}

function codes(result: ExportResult): string[] {
	return problems(result).map((diagnostic) => diagnostic.code);
}

describe("exportDeck", () => {
	it("writes a page with the deck text, the runtime and a start call", async () => {
		const { html } = await exported("title: Trains\nlanguage: pt-BR\n\n# Hi");
		const page = readPage(html);
		expect(html.startsWith("<!doctype html>\n")).toBe(true);
		expect(page.documentElement.lang).toBe("pt-BR");
		expect(page.title).toBe("Trains");
		expect(
			page.querySelector('meta[name="generator"]')?.getAttribute("content"),
		).toBe("AddonDeck 1.2.3");
		expect(page.querySelector('meta[charset="utf-8"]')).not.toBeNull();
		expect(page.getElementById("addondeck")).not.toBeNull();
		expect(page.getElementById("addondeck-source")?.getAttribute("type")).toBe(
			"text/addondeck",
		);
		expect(scripts(page)).toEqual([
			"var AddonDeck = { start() {} };",
			'AddonDeck.register("adapter:animator");',
			'AddonDeck.register("block:text");',
			"AddonDeck.start();",
		]);
		expect(page.querySelector("style")?.textContent).toBe(
			"\n.adk-stage { inset: 0; }\n.adk-text { color: var(--adk-ink); }\n",
		);
	});

	it("includes only the blocks the deck uses", async () => {
		const result = await exported(
			"# One\n\nlist:\n  - a\n\n---\n\nlist:\n  - b",
		);
		const page = readPage(result.html);
		expect(result.analysis.blocks).toEqual(["list", "text"]);
		expect(scripts(page)).toEqual([
			"var AddonDeck = { start() {} };",
			'AddonDeck.register("adapter:animator");',
			'AddonDeck.register("block:list");',
			'AddonDeck.register("block:text");',
			"AddonDeck.start();",
		]);
		expect(result.html).not.toContain("block:image");
		expect(result.html).not.toContain("adk-image");
	});

	it("leaves out the text block when the deck has no text", async () => {
		const { html, analysis } = await exported("list:\n  - a");
		expect(analysis.blocks).toEqual(["list"]);
		expect(html).not.toContain("block:text");
	});

	it("includes an adapter only when a block needs it", async () => {
		const { html, analysis } = await exported("# Sales\n\nchart:");
		expect(analysis.adapters).toEqual(["animator", "charts"]);
		expect(html).toContain('AddonDeck.register("adapter:charts");');
		const plain = await exported("# Sales");
		expect(plain.html).not.toContain("adapter:charts");
	});

	it("leaves out the animator when the motion is minimal", async () => {
		const { html, analysis } = await exported("motion: minimal\n\n# Calm");
		expect(analysis.adapters).toEqual([]);
		expect(html).not.toContain("adapter:animator");
	});

	it("includes no assets in a deck without images", async () => {
		const io = createTestIO();
		const { html, analysis } = await exported("# Hi\n\nlist:\n  - a", io);
		expect(analysis.assets).toEqual([]);
		expect(io.assets.asked).toEqual([]);
		expect(readPage(html).getElementById("addondeck-assets")).toBeNull();
		expect(html).not.toContain("data:");
	});

	it("embeds each distinct file once, however many references share it", async () => {
		const io = createTestIO(undefined, {
			"image:a.png": png(1, 2, 3),
			"image:b.png": png(1, 2, 3),
			"image:c.png": { ...png(9), credit: "Photo by Ana" },
		});
		const { html } = await exported(
			"image a.png:\n\n---\n\nimage b.png:\n\n---\n\nimage a.png:\n\nimage c.png:",
			io,
		);
		expect(io.assets.asked).toEqual([
			"image:a.png",
			"image:b.png",
			"image:c.png",
		]);
		const page = readPage(html);
		const json = JSON.parse(
			page.getElementById("addondeck-assets")?.textContent ?? "",
		);
		const shared =
			"sha256-039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81";
		expect(json.files).toEqual({
			[shared]: "data:image/png;base64,AQID",
			"sha256-2b4c342f5433ebe591a1da77e013d1b72475562d48578dca8b84bac6651c3cb9":
				"data:image/png;base64,CQ==",
		});
		expect(json.assets["image:a.png"]).toEqual({ kind: "image", file: shared });
		expect(json.assets["image:b.png"]).toEqual({ kind: "image", file: shared });
		expect(json.assets["image:c.png"].credit).toBe("Photo by Ana");
		expect(html.match(/AQID/g)).toHaveLength(1);
		expect(
			page
				.querySelector('meta[name="addondeck-credits"]')
				?.getAttribute("content"),
		).toBe("Photo by Ana");
	});

	it("warns about an asset it cannot find and still exports", async () => {
		const result = await exported("# Hi\n\nimage missing.png:");
		expect(codes(result)).toEqual(["EXPORT-W01"]);
		expect(problems(result)[0]).toMatchObject({
			severity: "warning",
			line: 3,
			column: 1,
			message:
				'The asset "image:missing.png" was not found; the exported deck shows a frame in its place.',
		});
		expect(readPage(result.html).getElementById("addondeck-assets")).toBeNull();
	});

	it("warns about a block that cannot list its assets", async () => {
		const result = await exported(
			"broken:\n\nstrange:",
			createTestIO({
				...createTestArtifacts(),
				extra: {
					"manifest.json": JSON.stringify({
						manifest: 1,
						name: "extra",
						version: "1.0.0",
						pieces: [
							{ kind: "block", name: "broken", script: "b.js" },
							{ kind: "block", name: "strange", script: "s.js" },
						],
					}),
					"b.js": "",
					"s.js": "",
				},
			}),
		);
		expect(problems(result).map((d) => [d.code, d.params.reason])).toEqual([
			["EXPORT-W02", "no assets today"],
			["EXPORT-W02", "not a list of references"],
		]);
	});

	it("keeps any deck text from closing its element and reads it back the same", async () => {
		const source =
			"title: </title><script>alert(1)</script>\n\n# A </script> <!--<script> b\n\n<\\/ and </style>";
		const { html } = await exported(source);
		const page = readPage(html);
		expect(page.querySelectorAll("script")).toHaveLength(5);
		const embedded = page.getElementById("addondeck-source")?.textContent ?? "";
		expect(embedded).not.toMatch(/<\//);
		expect(unescapeEmbeddedSource(embedded)).toBe(source);
		expect(page.title).toBe("</title><script>alert(1)</script>");
		expect(page.body.lastElementChild?.textContent).toBe("AddonDeck.start();");
	});

	it("escapes the artifacts it embeds", async () => {
		const artifacts = createTestArtifacts();
		const runtime = artifacts["@addondeck/runtime"] ?? {};
		runtime["browser.iife.js"] =
			'var AddonDeck = { tag: "</script>", c: "<!--" };';
		runtime["runtime.css"] = 'a::after { content: "</style>"; }';
		const page = readPage(
			(await exported("# Hi", createTestIO(artifacts))).html,
		);
		expect(scripts(page)[0]).toBe(
			'var AddonDeck = { tag: "<\\/script>", c: "<\\x21--" };',
		);
		expect(page.querySelector("style")?.textContent).toContain(
			'content: "<\\/style>"',
		);
		expect(page.querySelectorAll("script")).toHaveLength(5);
	});

	it("escapes the embedded assets", async () => {
		const io = createTestIO(undefined, {
			"image:</script>.png": { ...png(1), credit: '<b>"Ana"</b>' },
		});
		const { html } = await exported("image </script>.png:", io);
		const page = readPage(html);
		const json = page.getElementById("addondeck-assets")?.textContent ?? "";
		expect(json).not.toContain("<");
		expect(Object.keys(JSON.parse(json).assets)).toEqual([
			"image:</script>.png",
		]);
		expect(
			page
				.querySelector('meta[name="addondeck-credits"]')
				?.getAttribute("content"),
		).toBe('<b>"Ana"</b>');
	});

	it("names an untitled deck and its author", async () => {
		const page = readPage(
			(await exported("author: Ana & Bo\n\nJust text")).html,
		);
		expect(page.title).toBe("Untitled deck");
		expect(
			page.querySelector('meta[name="author"]')?.getAttribute("content"),
		).toBe("Ana & Bo");
	});

	it("uses the messages of the active language", async () => {
		const result = await exportDeck(
			"Just text",
			{
				registry: createTestRegistry(),
				messages: {
					untitled: "Sin título",
					"EXPORT-W01": "Falta {reference}.",
				},
			},
			createTestIO(),
		);
		expect(result.ok && readPage(result.html).title).toBe("Sin título");
		const missing = await exportDeck(
			"image a.png:",
			{
				registry: createTestRegistry(),
				messages: { "EXPORT-W01": "Falta {reference}." },
			},
			createTestIO(),
		);
		expect(problems(missing)[0]?.message).toBe("Falta image:a.png.");
	});

	it("reports the problems of the step plans after those of the parser", async () => {
		const result = await exportDeck(
			"format: 1\nmotion: wobbly\n\nordered 2 1:",
			{ registry: createTestRegistry() },
			createTestIO(),
		);
		expect(result.diagnostics.map((d) => d.code)).toEqual([
			"W303",
			"W315",
			"EXPORT-E03",
		]);
	});

	it("stops at errors in the deck, without reading any artifact", async () => {
		const io = createTestIO();
		const result = await exportDeck(
			"format: 9\n\n# Hi",
			{ registry: createTestRegistry() },
			io,
		);
		expect(result.ok).toBe(false);
		expect(result.diagnostics.some((d) => d.severity === "error")).toBe(true);
		expect(io.artifacts.reads).toEqual([]);
	});

	it("exports a deck with errors when forced", async () => {
		const result = await exported("format: 9\n\n# Hi", createTestIO(), true);
		expect(result.diagnostics.some((d) => d.severity === "error")).toBe(true);
		expect(result.html).toContain("block:text");
	});

	it("stops when an adapter has no script, unless forced", async () => {
		const artifacts = createTestArtifacts();
		delete artifacts["@addondeck/adapters"];
		const result = await exportDeck(
			"# Hi",
			{ registry: createTestRegistry() },
			createTestIO(artifacts),
		);
		expect(result.ok).toBe(false);
		expect(problems(result)).toEqual([
			expect.objectContaining({
				code: "EXPORT-E04",
				severity: "error",
				line: 0,
				column: 0,
				message:
					'No script was found for the "animator" adapter, which the deck needs.',
			}),
		]);
		const forced = await exported("# Hi", createTestIO(artifacts), true);
		expect(codes(forced)).toEqual(["EXPORT-E04"]);
		expect(scripts(readPage(forced.html))).toHaveLength(3);
	});

	it("stops when a block has no script", async () => {
		const result = await exportDeck(
			"quote:",
			{ registry: createTestRegistry() },
			createTestIO(),
		);
		expect(result.ok).toBe(false);
		expect(problems(result).map((d) => d.message)).toEqual([
			"No script was found for the quote block, so the exported deck cannot draw it.",
		]);
	});

	it("names a file of a piece that cannot be read, and leaves the piece out when forced", async () => {
		const artifacts = createTestArtifacts();
		const blocks = artifacts["@addondeck/blocks"] ?? {};
		delete blocks["browser/list.iife.js"];
		delete blocks["text/styles.css"];
		const forced = await exported(
			"# Hi\n\nlist:\n  - a",
			createTestIO(artifacts),
			true,
		);
		expect(problems(forced).map((d) => d.params)).toEqual([
			{ package: "@addondeck/blocks", path: "browser/list.iife.js" },
			{ package: "@addondeck/blocks", path: "text/styles.css" },
		]);
		expect(forced.html).not.toContain("block:list");
		expect(forced.html).toContain("block:text");
		expect(forced.html).not.toContain(".adk-text");
	});

	it("reports a package of artifacts it cannot use", async () => {
		const artifacts = {
			broken: { "manifest.json": "{oops" },
			empty: {},
			...createTestArtifacts(),
		};
		const result = await exported("# Hi", createTestIO(artifacts), true);
		expect(problems(result).map((d) => [d.code, d.params.package])).toEqual([
			["EXPORT-E02", "broken"],
			["EXPORT-E02", "empty"],
		]);
		expect(problems(result)[1]?.message).toBe(
			"The artifacts of empty cannot be used: manifest.json is missing.",
		);
	});

	it("takes each piece from the first package that offers it", async () => {
		const own = {
			"manifest.json": JSON.stringify({
				manifest: 1,
				name: "own",
				version: "9.9.9",
				pieces: [{ kind: "block", name: "text", script: "text.js" }],
			}),
			"text.js": "own text",
		};
		const { html } = await exported(
			"# Hi",
			createTestIO({ own, ...createTestArtifacts() }),
		);
		expect(html).toContain("own text");
		expect(html).not.toContain("block:text");
		expect(html).not.toContain(".adk-text");
	});

	it("includes the styles of the deck's theme when a package offers them", async () => {
		const themes = {
			"manifest.json": JSON.stringify({
				manifest: 1,
				name: "themes",
				version: "1.0.0",
				pieces: [
					{ kind: "theme", name: "paper", styles: "paper.css" },
					{ kind: "theme", name: "night", styles: "night.css" },
				],
			}),
			"paper.css": ".paper {}",
			"night.css": ".night {}",
		};
		const { html } = await exported(
			"theme: night\n\n# Hi",
			createTestIO({ ...createTestArtifacts(), themes }),
		);
		expect(readPage(html).querySelector("style")?.textContent).toBe(
			"\n.adk-stage { inset: 0; }\n.night {}\n.adk-text { color: var(--adk-ink); }\n",
		);
	});

	it("cannot export without the runtime, even when forced", async () => {
		const artifacts = createTestArtifacts();
		delete artifacts["@addondeck/runtime"];
		const result = await exportDeck(
			"# Hi",
			{ registry: createTestRegistry(), force: true },
			createTestIO(artifacts),
		);
		expect(result.ok).toBe(false);
		expect(problems(result).map((d) => d.message)).toEqual([
			"No runtime script was found in @addondeck/blocks, @addondeck/adapters, so nothing can be exported. Build the runtime first.",
		]);
	});
});
