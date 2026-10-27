// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { RuntimeMessages } from "./runtime-messages";

/** English runtime messages, the fallback for every other language. */
export const EN_RUNTIME_MESSAGES: RuntimeMessages = {
	missingRoot:
		'No element with the id "{id}" was found, so the deck cannot be shown.',
	missingSource:
		'No deck text was found: the page needs a <script type="text/addondeck" id="{id}"> element.',
	invalidAssets:
		"The embedded assets could not be read ({reason}); the deck is shown without them.",
	invalidAsset: 'The embedded asset "{reference}" is not valid and is ignored.',
	unregisteredBlock:
		'Line {line}: the block "{keyword}" is not registered, so it is shown as text. Load its script before AddonDeck.start().',
	missingAdapter:
		'Line {line}: the {type} block needs the "{adapter}" adapter, which is not registered.',
	blockFailed: "Line {line}: the {type} block could not be drawn ({reason}).",
	diagnostic: "Line {line}, column {column}: {message}",
	slideLabel: "Slide {number} of {total}",
};
