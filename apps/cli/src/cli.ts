#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

// The `addondeck` executable.

import process from "node:process";
import { run } from "./run";

process.exitCode = await run(process.argv.slice(2), {
	cwd: process.cwd(),
	stdout: (line) => process.stdout.write(`${line}\n`),
	stderr: (line) => process.stderr.write(`${line}\n`),
});
