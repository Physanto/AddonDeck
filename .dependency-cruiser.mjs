// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Workspace packages each package may import, besides itself.
 * Dependencies always point inward, towards core and sdk; core depends on nothing.
 */
const ALLOWED_IMPORTS = {
	"packages/core": [],
	"packages/sdk": ["packages/core"],
	"packages/runtime": ["packages/core", "packages/sdk"],
	"packages/adapters": ["packages/sdk"],
	"packages/blocks": ["packages/core", "packages/sdk"],
	"packages/themes": ["packages/core"],
	"packages/assets": ["packages/core"],
	"packages/exporter": ["packages/core", "packages/assets"],
	"apps/studio": ["packages/core", "packages/exporter", "packages/runtime"],
	"apps/cli": ["packages/core", "packages/exporter"],
};

const WORKSPACE_MODULE = "^(packages|apps)/[^/]+/";
const TEST_FILE = "\\.test\\.ts$";

const boundaryRules = Object.entries(ALLOWED_IMPORTS).map(([from, allowed]) => {
	const name = from.split("/")[1];
	return {
		name: `${name}-boundaries`,
		comment: allowed.length
			? `${name} may only import ${allowed.map((p) => p.split("/")[1]).join(", ")}.`
			: `${name} must not import any other workspace package.`,
		severity: "error",
		from: { path: `^${from}/` },
		to: {
			path: WORKSPACE_MODULE,
			pathNot: [`^${from}/`, ...allowed.map((p) => `^${p}/`)],
		},
	};
});

/** @type {import("dependency-cruiser").IConfiguration} */
export default {
	forbidden: [
		...boundaryRules,
		{
			name: "no-cross-block",
			comment:
				"A block must not import another block; shared behavior belongs in the sdk.",
			severity: "error",
			from: { path: "^packages/blocks/src/([^/]+)/" },
			to: {
				path: "^packages/blocks/src/[^/]+/",
				pathNot: "^packages/blocks/src/$1/",
			},
		},
		{
			name: "no-direct-libraries",
			comment:
				"The runtime and blocks reach third-party libraries only through adapters, so the exporter can include each library only when a deck needs it.",
			severity: "error",
			from: { path: "^packages/(runtime|blocks)/", pathNot: TEST_FILE },
			to: { path: "node_modules" },
		},
		{
			name: "no-node-builtins",
			comment:
				"core and exporter also run in the browser (core inside the runtime, exporter inside the studio).",
			severity: "error",
			from: { path: "^packages/(core|exporter)/", pathNot: TEST_FILE },
			to: { dependencyTypes: ["core"] },
		},
		{
			name: "no-circular",
			severity: "error",
			from: {},
			to: { circular: true },
		},
		{
			name: "not-to-unresolvable",
			comment:
				"Every import must resolve; for workspace packages, declare them in package.json.",
			severity: "error",
			from: {},
			to: { couldNotResolve: true },
		},
		{
			name: "no-non-package-json",
			comment:
				"Source code may only import packages declared in its own package.json.",
			severity: "error",
			from: { pathNot: TEST_FILE },
			to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
		},
		{
			name: "not-to-dev-dep",
			comment: "Published code must not depend on devDependencies.",
			severity: "error",
			from: { path: WORKSPACE_MODULE, pathNot: TEST_FILE },
			to: { dependencyTypes: ["npm-dev"] },
		},
	],
	options: {
		doNotFollow: { path: "node_modules" },
		exclude: { path: "(^|/)(dist/|tsdown\\.config\\.ts$)" },
		tsPreCompilationDeps: true,
		tsConfig: { fileName: "tsconfig.base.json" },
		enhancedResolveOptions: {
			exportsFields: ["exports"],
			conditionNames: ["@addondeck/source", "import", "default"],
			extensions: [".ts", ".js", ".mjs", ".json"],
		},
		reporterOptions: {
			text: { highlightFocused: true },
		},
	},
};
