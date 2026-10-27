// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors

import type { AdapterKind } from "@addondeck/core";
import type { BlockContext } from "../block/block-context";

/**
 * Kinds of value a verb parameter takes.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export type VerbParamKind =
	| "actor"
	| "position"
	| "number"
	| "duration"
	| "text"
	| "choice";

/**
 * One parameter of a verb, such as the destination of `fly`.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export interface VerbParam {
	readonly kind: VerbParamKind;
	/** Whether the verb cannot work without it. Defaults to `false`. */
	readonly required?: boolean;
	/** Allowed values of a `choice`. */
	readonly choices?: readonly string[];
}

/**
 * Parameters of a verb, by name.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export type ParamSchema = Readonly<Record<string, VerbParam>>;

/**
 * An actor of a scene, as verbs see it. Positions are from 0 to 100.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export interface ActorHandle {
	readonly id: string;
	/** The element that shows the actor. */
	readonly element: HTMLElement;
	readonly x: number;
	readonly y: number;
}

/**
 * Services a verb gets: the block services plus the scene's actors.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export interface SceneContext extends BlockContext {
	/** Finds another actor of the scene, such as the destination of `follow`. */
	actor(id: string): ActorHandle | undefined;
}

/**
 * What a verb does in one step, in both directions.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export interface StepAnimation {
	/** Animates the action. */
	play(): Promise<void>;
	/** Shows the end of the action at once. */
	apply(): void;
	/** Shows the moment before the action at once. */
	revert(): void;
}

/**
 * A scene verb, such as `fly` or `bounce`. A new verb is a new file; the scene
 * block finds it by its name and aliases.
 *
 * @experimental Draft for scene verbs; it will change when scenes are built.
 */
export interface VerbPlugin {
	/** Canonical English name, such as `fly`. */
	readonly name: string;
	/** Other English forms, such as `flies`; language packs add more. */
	readonly aliases: readonly string[];
	/** Parameters the verb accepts, such as its destination or speed. */
	readonly params: ParamSchema;
	/** Adapters the verb uses; the exporter includes only those. */
	readonly needs?: readonly AdapterKind[];
	/** Builds the reversible action of one step. */
	build(
		targets: readonly ActorHandle[],
		params: Readonly<Record<string, unknown>>,
		ctx: SceneContext,
	): StepAnimation;
}
