// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { BlockNode } from "./block-node";
import type { TextNode } from "./text-node";

/** A piece of slide content, in order of appearance. Narrow it with `kind`. */
export type SlideNode = TextNode | BlockNode;
