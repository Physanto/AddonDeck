// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	ARTIFACT_PACKAGES,
	createNodeArtifactSource,
	locateInstalledArtifacts,
} from "./node-artifact-source";

function artifacts(): string {
	const root = mkdtempSync(join(tmpdir(), "addondeck-artifacts-"));
	mkdirSync(join(root, "dist", "browser"), { recursive: true });
	writeFileSync(join(root, "dist", "manifest.json"), "{}");
	writeFileSync(join(root, "dist", "browser", "list.iife.js"), "list();");
	writeFileSync(join(root, "secret.txt"), "no");
	return join(root, "dist");
}

describe("createNodeArtifactSource", () => {
	it("reads from the runtime, blocks and adapters by default", () => {
		expect(createNodeArtifactSource().packages).toEqual(ARTIFACT_PACKAGES);
		expect(ARTIFACT_PACKAGES).toEqual([
			"@addondeck/runtime",
			"@addondeck/blocks",
			"@addondeck/adapters",
		]);
	});

	it("reads the files of a package from the folder of its manifest", async () => {
		const folder = artifacts();
		const asked: string[] = [];
		const source = createNodeArtifactSource({
			packages: ["@x/blocks"],
			locate: (pkg) => {
				asked.push(pkg);
				return folder;
			},
		});
		expect(source.packages).toEqual(["@x/blocks"]);
		expect(await source.read("@x/blocks", "manifest.json")).toBe("{}");
		expect(await source.read("@x/blocks", "browser/list.iife.js")).toBe(
			"list();",
		);
		expect(asked).toEqual(["@x/blocks"]);
	});

	it("reads a missing file, a file outside the package or an unknown package as null", async () => {
		const folder = artifacts();
		const source = createNodeArtifactSource({
			locate: (pkg) => (pkg === "@x/blocks" ? folder : null),
		});
		expect(await source.read("@x/blocks", "browser/none.js")).toBeNull();
		expect(await source.read("@x/blocks", "../secret.txt")).toBeNull();
		expect(await source.read("@x/blocks", "browser")).toBeNull();
		expect(await source.read("@x/other", "manifest.json")).toBeNull();
	});
});

describe("locateInstalledArtifacts", () => {
	it("finds the build folder of an installed package of artifacts", () => {
		// The folder may be reached through the workspace link and may not be
		// built yet, so only the package it belongs to is compared.
		const folder = locateInstalledArtifacts("@addondeck/runtime");
		expect(folder).not.toBeNull();
		expect(basename(folder ?? "")).toBe("dist");
		expect(realpathSync(dirname(folder ?? ""))).toBe(
			realpathSync(
				fileURLToPath(new URL("../../../../packages/runtime", import.meta.url)),
			),
		);
	});

	it("finds nothing for a package that is not installed", () => {
		expect(locateInstalledArtifacts("@addondeck/none")).toBeNull();
	});
});
