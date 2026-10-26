// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { DeckMeta } from "../model/deck-meta";
import type { BlockRegistry } from "../registry/block-registry";
import type { InstalledResources } from "./parse-options";
import type { Reporter } from "./reporter";

/** What the header stage needs. */
export interface HeaderContext {
	readonly registry: BlockRegistry;
	readonly reporter: Reporter;
	readonly installed: InstalledResources;
}

/** What the slide stages need: the header context plus deck-wide state. */
export interface SlideContext extends HeaderContext {
	readonly meta: DeckMeta;
	/** Line of the first block that used each normalized id, to report repeats. */
	readonly ids: Map<string, number>;
}
