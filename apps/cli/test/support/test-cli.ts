// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactSource } from "@addondeck/exporter";
import { type CliEnvironment, type ExitCode, run } from "../../src/index";

type PackageFiles = Record<string, string>;

function pack(
	name: string,
	pieces: readonly { kind: string; name: string; script: string }[],
): PackageFiles {
	return {
		"manifest.json": JSON.stringify({
			manifest: 1,
			name,
			version: "1.2.3",
			pieces,
		}),
		...Object.fromEntries(
			pieces.map((piece) => [
				piece.script,
				`AddonDeck.register("${piece.kind}:${piece.name}");`,
			]),
		),
	};
}

/** Stand-ins for the compiled runtime, built-in blocks and animator. */
export function createTestArtifacts(): ArtifactSource {
	const packages: Record<string, PackageFiles> = {
		"@addondeck/runtime": pack("@addondeck/runtime", [
			{ kind: "runtime", name: "runtime", script: "browser.iife.js" },
		]),
		"@addondeck/blocks": pack(
			"@addondeck/blocks",
			["text", "list", "image"].map((name) => ({
				kind: "block",
				name,
				script: `browser/${name}.iife.js`,
			})),
		),
		"@addondeck/adapters": pack("@addondeck/adapters", [
			{ kind: "adapter", name: "animator", script: "browser/animator.iife.js" },
		]),
	};
	return {
		packages: Object.keys(packages),
		read: async (pkg, path) => packages[pkg]?.[path] ?? null,
	};
}

/** A new folder with the given files. */
export function folderWith(files: Record<string, string | Uint8Array>): string {
	const folder = mkdtempSync(join(tmpdir(), "addondeck-cli-"));
	for (const [name, contents] of Object.entries(files)) {
		writeFileSync(join(folder, name), contents);
	}
	return folder;
}

/** What one run of `addondeck` printed and how it ended. */
export interface CliRun {
	readonly code: ExitCode;
	readonly stdout: string[];
	readonly stderr: string[];
}

/** Runs `addondeck` in `cwd` with the test artifacts. */
export async function runCli(
	cwd: string,
	args: string[],
	extra: Partial<CliEnvironment> = {},
): Promise<CliRun> {
	const stdout: string[] = [];
	const stderr: string[] = [];
	const code = await run(args, {
		cwd,
		stdout: (line) => stdout.push(line),
		stderr: (line) => stderr.push(line),
		artifacts: createTestArtifacts(),
		...extra,
	});
	return { code, stdout, stderr };
}
