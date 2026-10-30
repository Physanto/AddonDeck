// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { describe, expect, it } from "vitest";
import { EN_CLI_MESSAGES, EXIT_CODE } from "../src/index";
import { folderWith, runCli } from "./support/test-cli";

describe("addondeck", () => {
	it("prints its help with the commands and the exit codes", async () => {
		const { code, stdout } = await runCli(folderWith({}), ["--help"]);
		expect(code).toBe(EXIT_CODE.ok);
		expect(stdout).toEqual([EN_CLI_MESSAGES.help]);
		expect(stdout[0]).toContain(
			"Exit codes: 0 done, 1 the deck has errors, 2 wrong usage.",
		);
	});

	it("reports wrong usage on the error output, or as JSON when asked", async () => {
		const cwd = folderWith({});
		expect(await runCli(cwd, ["publish", "talk.deck"])).toEqual({
			code: EXIT_CODE.usage,
			stdout: [],
			stderr: [
				'Unknown command "publish". Run "addondeck --help" to see the commands.',
			],
		});
		const { code, stdout } = await runCli(cwd, ["check", "--json"]);
		expect(code).toBe(EXIT_CODE.usage);
		expect(JSON.parse(stdout[0] ?? "")).toEqual({
			schema: 1,
			command: "check",
			ok: false,
			usage:
				'The check command needs a .deck file, as in "addondeck check talk.deck".',
		});
	});

	it("speaks the active language, falling back to English", async () => {
		const cwd = folderWith({ "talk.deck": "format: 9\n\n# Hola\n" });
		const { stdout } = await runCli(cwd, ["check", "talk.deck"], {
			messages: {
				error: "error",
				diagnostic: "{location} → {severity} {code}: {message}",
				summary: "{file}: {errors} y {warnings}.",
				oneError: "1 error",
				warnings: "{count} avisos",
			},
			diagnosticMessages: { E101: "Versión {version} desconocida." },
			exportMessages: {},
		});
		expect(stdout[0]).toMatch(
			/^talk\.deck:1:\d+ → error E101: Versión 9 desconocida\.$/,
		);
		expect(stdout.at(-1)).toBe("talk.deck: 1 error y 0 avisos.");
	});
});
