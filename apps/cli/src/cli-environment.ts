// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { PartialDiagnosticMessages } from "@addondeck/core";
import type {
	ArtifactSource,
	PartialExportMessages,
} from "@addondeck/exporter";
import type { PartialCliMessages } from "./messages/cli-messages";

/** Where `addondeck` runs: its folder, its output and its texts. */
export interface CliEnvironment {
	/** The folder relative paths on the command line start from. */
	readonly cwd: string;
	/** Writes one line of results. */
	readonly stdout: (line: string) => void;
	/** Writes one line about problems. */
	readonly stderr: (line: string) => void;
	/** Compiled artifacts; by default, the installed packages of artifacts. */
	readonly artifacts?: ArtifactSource;
	/** Command line messages of the active language. */
	readonly messages?: PartialCliMessages;
	/** Exporter messages of the active language. */
	readonly exportMessages?: PartialExportMessages;
	/** Parser messages of the active language. */
	readonly diagnosticMessages?: PartialDiagnosticMessages;
}
