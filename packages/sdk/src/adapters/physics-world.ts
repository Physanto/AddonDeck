// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

/**
 * Shape and material of a physics body. Positions and sizes are in stage pixels.
 *
 * @experimental Settled together with the physics adapter; it may change until then.
 */
export interface PhysicsBodyOptions {
	readonly shape: "circle" | "rectangle";
	/** Center of the body. */
	readonly x: number;
	readonly y: number;
	/** Width and height of a rectangle, or the diameter of a circle in `width`. */
	readonly width: number;
	readonly height: number;
	/** Bodies that never move, such as the floor. */
	readonly fixed?: boolean;
	/** Bounciness, from 0 (none) to 1. */
	readonly restitution?: number;
	/** Resistance when sliding, from 0 (ice) to 1. */
	readonly friction?: number;
}

/**
 * Where a body is after the last simulation step.
 *
 * @experimental Settled together with the physics adapter; it may change until then.
 */
export interface PhysicsBodyState {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	/** Rotation in degrees. */
	readonly angle: number;
}

/**
 * The full state of a world at one moment, to go back to it exactly.
 * Its contents belong to the adapter.
 *
 * @experimental Settled together with the physics adapter; it may change until then.
 */
export interface PhysicsSnapshot {
	/** Simulated time in milliseconds. */
	readonly time: number;
	/** Positions, speeds and anything else the adapter needs to restore the world. */
	readonly data: unknown;
}

/**
 * A deterministic physics simulation of one block.
 *
 * It advances with a fixed step of 1/60 s and a fixed seed, so the same steps
 * always give the same result. Blocks take a snapshot at the end of each of
 * their steps; going back or jumping restores a snapshot instead of simulating.
 *
 * @experimental Settled together with the physics adapter; it may change until then.
 */
export interface PhysicsWorld {
	/** Adds a body; `id` names it in the other methods. */
	addBody(id: string, options: PhysicsBodyOptions): void;
	/** Removes a body; unknown ids are ignored. */
	removeBody(id: string): void;
	/** Pushes a body, in stage pixels per second. */
	applyImpulse(id: string, x: number, y: number): void;
	/** Advances the simulation by `count` fixed steps of 1/60 s. */
	step(count?: number): void;
	/** Where every body is now, to move the elements that show them. */
	bodies(): readonly PhysicsBodyState[];
	/** Captures the whole state, to come back to it with `restore`. */
	snapshot(): PhysicsSnapshot;
	/** Puts the world back exactly as it was when the snapshot was taken. */
	restore(snapshot: PhysicsSnapshot): void;
	/** Frees the simulation; the world is not used afterwards. */
	destroy(): void;
}
