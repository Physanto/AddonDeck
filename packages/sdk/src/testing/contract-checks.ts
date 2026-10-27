// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import { destroyCleansUp } from "./check-destroy";
import { docsExist, examplesAreValid, translationsExist } from "./check-docs";
import { diagnosticsHaveLines, parseNeverThrows } from "./check-parse";
import { stepsAreValid } from "./check-steps";
import {
	mountShowsStepZero,
	playMatchesSetState,
	setStateGoesBack,
	setStateIsIdempotent,
	viewMatchesDefinition,
} from "./check-view";
import type { ContractCheck } from "./contract-check";

/** Every rule of the block contract, in the order of {@link CONTRACT_CHECK_IDS}. */
export const CONTRACT_CHECKS: readonly ContractCheck[] = [
	parseNeverThrows,
	diagnosticsHaveLines,
	stepsAreValid,
	viewMatchesDefinition,
	mountShowsStepZero,
	setStateIsIdempotent,
	playMatchesSetState,
	setStateGoesBack,
	destroyCleansUp,
	docsExist,
	examplesAreValid,
	translationsExist,
];
