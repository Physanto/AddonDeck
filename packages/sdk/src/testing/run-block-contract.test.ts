// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
// @vitest-environment happy-dom

import { REVEAL_OPTIONS } from "./fixtures/broken-reveal-blocks";
import { runBlockContract } from "./run-block-contract";

runBlockContract(REVEAL_OPTIONS);
