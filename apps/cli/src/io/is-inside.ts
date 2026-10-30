// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { isAbsolute, relative } from "node:path";

/** Whether `path` is `folder` or lies somewhere below it; both absolute. */
export function isInside(folder: string, path: string): boolean {
	const way = relative(folder, path);
	return way === "" || (!way.startsWith("..") && !isAbsolute(way));
}
