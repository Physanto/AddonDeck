// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * A running animation. It starts playing as soon as it is created.
 *
 * Blocks usually only await {@link Animation.finished}; the other methods let
 * the runtime finish an animation at once when the presenter clicks again.
 */
export interface Animation {
	/** Total length in milliseconds, delays included. */
	readonly duration: number;
	/** How far it has played, from 0 (not started) to 1 (ended), delays included. */
	readonly progress: number;
	/** Resolves when the animation ends, is finished or is cancelled. Never rejects. */
	readonly finished: Promise<void>;
	/** Resumes a paused animation. */
	play(): void;
	/** Stops time without changing what is shown; `play` resumes from there. */
	pause(): void;
	/** Shows the animation at a time in milliseconds from its start, and pauses it there. */
	seek(time: number): void;
	/** Jumps to the end: every target gets its final values. */
	finish(): void;
	/** Stops where it is, keeping the values already applied. */
	cancel(): void;
}
