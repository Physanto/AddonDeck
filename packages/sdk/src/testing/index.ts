// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

export { createInstantAnimator } from "../animation/create-instant-animator";
export type {
	BlockContractOptions,
	BlockExample,
} from "./block-contract-options";
export {
	type ContractCheckResult,
	type ContractReport,
	checkBlockContract,
} from "./check-block-contract";
export {
	CONTRACT_CHECK_IDS,
	type ContractCheckId,
} from "./contract-check-id";
export { createTestAssetResolver } from "./create-test-asset-resolver";
export { createTestContext, type TestContext } from "./create-test-context";
export {
	createTestEventBus,
	type TestEvent,
	type TestEventBus,
} from "./create-test-event-bus";
export { runBlockContract } from "./run-block-contract";
export {
	TEST_MOTION_TOKENS,
	TEST_STAGE_INFO,
	TEST_THEME_TOKENS,
} from "./test-tokens";
export { type LeakTracker, trackLeaks } from "./track-leaks";
