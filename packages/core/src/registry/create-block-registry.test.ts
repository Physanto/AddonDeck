// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import type { BlockDefinition } from "../contracts/block-definition";
import { createBlockRegistry } from "./create-block-registry";

function block(type: string, aliases: readonly string[] = []): BlockDefinition {
	return {
		type,
		aliases,
		version: "1.0.0",
		parse: () => ({ model: null, diagnostics: [] }),
		steps: () => [],
	};
}

describe("createBlockRegistry", () => {
	it("resolves a block by its type and its aliases", () => {
		const timeline = block("timeline", ["line_of_time"]);
		const registry = createBlockRegistry([timeline]);
		expect(registry.resolve("timeline")).toBe(timeline);
		expect(registry.resolve("line-of-time")).toBe(timeline);
	});

	it("resolves keywords without caring about capitals or accents", () => {
		const sequence = block("sequence");
		const registry = createBlockRegistry([sequence]);
		expect(registry.resolve("SÉQUENCE")).toBe(sequence);
	});

	it("returns nothing for an unknown keyword", () => {
		expect(
			createBlockRegistry([block("code")]).resolve("graph"),
		).toBeUndefined();
	});

	it("adds the aliases of language packs", () => {
		const sequence = block("sequence");
		const registry = createBlockRegistry([sequence], {
			languagePacks: [{ language: "es", blocks: { sequence: ["secuencia"] } }],
		});
		expect(registry.resolve("Secuencia")).toBe(sequence);
		expect(registry.keywords).toEqual(["sequence", "secuencia"]);
	});

	it("ignores pack aliases for blocks that are not installed", () => {
		const registry = createBlockRegistry([block("code")], {
			languagePacks: [{ language: "es", blocks: { graph: ["grafo"] } }],
		});
		expect(registry.resolve("grafo")).toBeUndefined();
	});

	it("accepts a pack without block aliases", () => {
		const registry = createBlockRegistry([block("code")], {
			languagePacks: [{ language: "es" }],
		});
		expect(registry.keywords).toEqual(["code"]);
	});

	it("allows a block to repeat its own keyword", () => {
		const code = block("code", ["Code"]);
		expect(createBlockRegistry([code]).keywords).toEqual(["code"]);
	});

	it("rejects two blocks with the same type", () => {
		expect(() => createBlockRegistry([block("code"), block("Code")])).toThrow(
			/registered twice/,
		);
	});

	it("rejects an alias that already names another block", () => {
		expect(() =>
			createBlockRegistry([block("flow"), block("graph", ["flow"])]),
		).toThrow(/already names the block "flow"/);
	});

	it("rejects a pack alias that already names another block", () => {
		expect(() =>
			createBlockRegistry([block("flow"), block("graph")], {
				languagePacks: [{ language: "xx", blocks: { graph: ["flow"] } }],
			}),
		).toThrow(/Language pack "xx"/);
	});

	it("rejects keywords the format reserves", () => {
		expect(() => createBlockRegistry([block("notes")])).toThrow(/reserves/);
		expect(() => createBlockRegistry([block("x", ["Section"])])).toThrow(
			/reserves/,
		);
	});

	it("rejects an empty keyword", () => {
		expect(() => createBlockRegistry([block("x", [" "])])).toThrow(/empty/);
	});
});
