// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type AdapterPlugin,
	createInstantAnimator,
	type Plugin,
} from "@addondeck/sdk";
import { describe, expect, it } from "vitest";
import { createBoxPlugin } from "../../test/support/box-plugin";
import { createPluginRegistry } from "./create-plugin-registry";

const animator: AdapterPlugin = {
	kind: "adapter",
	adapter: "animator",
	create: () => createInstantAnimator(),
};

describe("createPluginRegistry", () => {
	it("starts without blocks or adapters", () => {
		const registry = createPluginRegistry();
		expect(registry.blocks().keywords).toEqual([]);
		expect(registry.view("box")).toBeUndefined();
		expect(registry.adapter("animator")).toBeUndefined();
	});

	it("gives the parser the definition and the runtime the view of a block", () => {
		const registry = createPluginRegistry();
		const box = createBoxPlugin([], { aliases: ["crate"] });
		registry.register(box);
		expect(registry.blocks().resolve("Crate")).toBe(box.definition);
		expect(registry.view("box")).toBe(box.view);
	});

	it("keeps the registry the parser saw until another block arrives", () => {
		const registry = createPluginRegistry();
		registry.register(createBoxPlugin());
		const before = registry.blocks();
		registry.register(createBoxPlugin([], { type: "card" }));
		expect(before.resolve("card")).toBeUndefined();
		expect(registry.blocks().resolve("card")?.type).toBe("card");
		expect(registry.blocks().resolve("box")?.type).toBe("box");
	});

	it("finds an adapter by its kind", () => {
		const registry = createPluginRegistry();
		registry.register(animator);
		expect(registry.adapter("animator")).toBe(animator);
		expect(registry.adapter("charts")).toBeUndefined();
	});

	it("rejects a block registered twice", () => {
		const registry = createPluginRegistry();
		registry.register(createBoxPlugin());
		expect(() => registry.register(createBoxPlugin())).toThrow(
			"The box block is already registered.",
		);
	});

	it("rejects a block whose keyword another block uses, and keeps the first", () => {
		const registry = createPluginRegistry();
		registry.register(createBoxPlugin([], { aliases: ["crate"] }));
		expect(() =>
			registry.register(createBoxPlugin([], { type: "crate" })),
		).toThrow();
		expect(registry.view("crate")).toBeUndefined();
		expect(registry.blocks().resolve("crate")?.type).toBe("box");
	});

	it("rejects a view whose type differs from its definition", () => {
		const box = createBoxPlugin();
		const registry = createPluginRegistry();
		expect(() =>
			registry.register({ ...box, view: { ...box.view, type: "card" } }),
		).toThrow('The view type "card" differs from the definition type "box".');
	});

	it("rejects malformed plugins", () => {
		const registry = createPluginRegistry();
		const box = createBoxPlugin();
		const malformed: unknown[] = [
			null,
			"box",
			{},
			{ kind: "theme" },
			{ kind: "block", definition: box.definition },
			{ kind: "block", definition: box.definition, view: { type: "box" } },
			{ kind: "adapter", adapter: "sound", create: () => ({}) },
			{ kind: "adapter", adapter: "animator" },
		];
		for (const plugin of malformed) {
			expect(() => registry.register(plugin as Plugin)).toThrow();
		}
		expect(registry.blocks().keywords).toEqual([]);
		expect(registry.adapter("animator")).toBeUndefined();
	});

	it("rejects a second adapter of the same kind", () => {
		const registry = createPluginRegistry();
		registry.register(animator);
		expect(() => registry.register({ ...animator })).toThrow(
			"An animator adapter is already registered.",
		);
	});
});
