// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import {
	type BlockDefinition,
	type BlockRegistry,
	createBlockRegistry,
} from "@addondeck/core";
import type {
	ArtifactPiece,
	ArtifactSource,
	AssetFile,
	AssetResolver,
	ExportIO,
} from "../../src/index";

function block(
	type: string,
	extra: Partial<BlockDefinition<string[]>> = {},
): BlockDefinition<string[]> {
	return {
		type,
		aliases: [],
		version: "1.0.0",
		parse: (source) => ({ model: [...source.args], diagnostics: [] }),
		steps: () => [],
		...extra,
	};
}

/**
 * Blocks shaped like the built-in ones: `image` names its first argument as
 * an asset, `chart` needs the charts adapter, `quote` has no artifacts,
 * `broken` fails to list its assets, `strange` lists something else and
 * `ordered` has a step per argument, played at the click it names.
 */
export function createTestRegistry(): BlockRegistry {
	return createBlockRegistry([
		block("text"),
		block("list"),
		block("image", {
			assets: (args) => args.map((name) => `image:${name}`),
		}),
		block("chart", { needs: ["charts"] }),
		block("quote"),
		block("broken", {
			assets: () => {
				throw new Error("no assets today");
			},
		}),
		block("strange", { assets: () => [3] as unknown as string[] }),
		block("ordered", {
			steps: (args) =>
				args.map((at) => ({
					at: Number(at),
					triggers: [],
					location: { line: 1, column: 1 },
				})),
		}),
	]);
}

/** Files of one package of artifacts, by path. */
export type PackageFiles = Record<string, string>;

function manifest(name: string, pieces: readonly ArtifactPiece[]): string {
	return JSON.stringify({ manifest: 1, name, version: "1.2.3", pieces });
}

function plugin(
	kind: "block" | "adapter",
	name: string,
	styles: boolean,
): { piece: ArtifactPiece; files: PackageFiles } {
	const script = `browser/${name}.iife.js`;
	const css = `${name}/styles.css`;
	return {
		piece: { kind, name, script, ...(styles ? { styles: css } : {}) },
		files: {
			[script]: `AddonDeck.register("${kind}:${name}");`,
			...(styles ? { [css]: `.adk-${name} { color: var(--adk-ink); }` } : {}),
		},
	};
}

function pack(
	name: string,
	parts: readonly { piece: ArtifactPiece; files: PackageFiles }[],
): PackageFiles {
	return Object.assign(
		{
			"manifest.json": manifest(
				name,
				parts.map((part) => part.piece),
			),
		},
		...parts.map((part) => part.files),
	);
}

/** Artifacts of a runtime, every test block and the animator and charts adapters. */
export function createTestArtifacts(): Record<string, PackageFiles> {
	return {
		"@addondeck/runtime": pack("@addondeck/runtime", [
			{
				piece: {
					kind: "runtime",
					name: "runtime",
					script: "browser.iife.js",
					styles: "runtime.css",
				},
				files: {
					"browser.iife.js": "var AddonDeck = { start() {} };",
					"runtime.css": ".adk-stage { inset: 0; }",
				},
			},
		]),
		"@addondeck/blocks": pack("@addondeck/blocks", [
			plugin("block", "text", true),
			plugin("block", "list", true),
			plugin("block", "image", true),
			plugin("block", "chart", false),
		]),
		"@addondeck/adapters": pack("@addondeck/adapters", [
			plugin("adapter", "animator", false),
			plugin("adapter", "charts", false),
		]),
	};
}

/** Reads artifacts from memory, in the order of `packages`. */
export function createArtifactSource(
	packages: Record<string, PackageFiles> = createTestArtifacts(),
): ArtifactSource & { readonly reads: string[] } {
	const reads: string[] = [];
	return {
		packages: Object.keys(packages),
		reads,
		read: async (pkg, path) => {
			reads.push(`${pkg}/${path}`);
			return packages[pkg]?.[path] ?? null;
		},
	};
}

/** Resolves the references given, and nothing else. */
export function createAssetResolver(
	files: Record<string, AssetFile> = {},
): AssetResolver & { readonly asked: string[] } {
	const asked: string[] = [];
	return {
		asked,
		resolve: async (reference) => {
			asked.push(reference);
			return files[reference] ?? null;
		},
	};
}

/** A PNG-typed file with the given bytes. */
export function png(...bytes: number[]): AssetFile {
	return {
		kind: "image",
		mediaType: "image/png",
		bytes: Uint8Array.from(bytes),
	};
}

export function createTestIO(
	artifacts?: Record<string, PackageFiles>,
	assets?: Record<string, AssetFile>,
): ExportIO & {
	readonly artifacts: ReturnType<typeof createArtifactSource>;
	readonly assets: ReturnType<typeof createAssetResolver>;
} {
	return {
		artifacts: createArtifactSource(artifacts),
		assets: createAssetResolver(assets),
	};
}

/** Parses an exported page as a browser would. */
export function readPage(html: string): Document {
	return new DOMParser().parseFromString(html, "text/html");
}
