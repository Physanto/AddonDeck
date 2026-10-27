# @addondeck/sdk

Contracts and helpers for AddonDeck plugins.

Everything a block needs comes from this package: the pure contracts of `@addondeck/core` (`BlockDefinition`, `BlockSource`, `ParseResult`, `StepDef`), re-exported here, and the parts that run in the browser. It holds no heavy implementations and depends on no animation library.

## A block in two parts

A block has a **definition**, pure and without DOM, which reads its text and lists its steps, and a **view**, which draws it:

```ts
import type { BlockDefinition, BlockView } from "@addondeck/sdk";

export const quote: BlockDefinition<{ text: string }> = {
	type: "quote",
	aliases: [],
	version: "1.0.0",
	parse: (source) => ({
		model: { text: source.body.map((line) => line.text).join("\n") },
		diagnostics: [],
	}),
	steps: () => [],
};

export const quoteView: BlockView<{ text: string }> = {
	type: "quote",
	mount(model, el) {
		const quote = document.createElement("blockquote");
		quote.className = "adk-quote";
		quote.textContent = model.text;
		el.append(quote);
		return {
			setState: () => {},
			play: async () => {},
			destroy: () => quote.remove(),
		};
	},
};
```

`mount` returns a `BlockInstance`:

- `setState(n)` shows the block after `n` of its steps, at once. It must be idempotent and work backwards.
- `play(from, to)` animates between two steps and ends exactly as `setState(to)`.
- `destroy()` removes the block's nodes, listeners, timers and subscriptions.

The runtime decides which steps play in each click from the slide's step plan (default order, `@n` and `→ id`; see the [format specification](../../docs/format/v1.md#step-plan)).

## Services

`mount` receives a `BlockContext` with the services the runtime provides:

| Service       | What it is for                                                                    |
| ------------- | --------------------------------------------------------------------------------- |
| `animator`    | Animate elements (`animate`, `timeline`) without importing an animation library   |
| `theme`       | Theme values, for code that cannot read CSS variables (canvas, charts)            |
| `motion`      | Durations, easings and stagger of the active motion personality                   |
| `assets`      | Turn references such as `emoji:dog` or `icon:lucide/heart` into URLs              |
| `events`      | Named events between blocks (`network:step`) and from the runtime (`slide:enter`) |
| `stage`       | Size and scale of the 1920×1080 stage                                             |
| `physics`     | A deterministic physics world, only when the block declares `needs: ["physics"]`  |
| `charts`      | Chart drawing, only with `needs: ["charts"]`                                      |
| `highlighter` | Syntax highlighting tokens, only with `needs: ["highlighter"]`                    |

`PhysicsWorld`, `ChartRenderer`, `Highlighter` and `VerbPlugin` are marked `@experimental`: they will be settled together with their adapters and the scene block.

## Animating

`ctx.animator` animates CSS properties in camelCase, custom properties and a few shorthands:

```ts
const { animator, motion } = ctx;

// Transforms: x, y, rotate and scale combine into one `transform`.
await animator.animate(
	card,
	{ opacity: [0, 1], y: [20, 0] },
	{ easing: motion.easing.enter },
).finished;

// Staggered items.
animator.animate(
	items,
	{ opacity: [0, 1] },
	{ delay: stagger(motion.stagger) },
);

// An SVG stroke drawn from its start, and a packet that travels along it.
await animator
	.timeline()
	.add(wire, { draw: [0, 1] }, { duration: motion.duration.m })
	.add(packet, { opacity: [0, 1] }, { path: { element: wire, rotate: true } })
	.finished;
```

Durations and easings left out come from the motion personality. Every `Animation` can `play`, `pause`, `seek`, `finish` and `cancel`, reports its `progress`, and its `finished` promise settles in every case, never rejecting.

`createInstantAnimator()` implements `Animator` without a library, applying final values at once: the runtime uses it for `setState`, for reduced motion and in tests. It leaves the same styles an animated adapter leaves at the end and reads the `transform` already written, so both can work on the same elements. `toCssValue()` holds the default units both share, and `getStrokeDraw()` and `setStrokeDraw()` the representation of `draw`.

## Testing a block

`@addondeck/sdk/testing` holds the block contract suite. Every block runs it from its test file, in a DOM environment such as happy-dom:

```ts
// @vitest-environment happy-dom
import { runBlockContract } from "@addondeck/sdk/testing";
import docs from "./docs.md?raw";
import payment from "./examples/payment.deck?raw";
import { sequence } from "./definition";
import { sequenceView } from "./view";

runBlockContract({
	definition: sequence,
	view: sequenceView,
	examples: [{ name: "payment.deck", source: payment }],
	docs,
});
```

It registers one test per rule:

| Rule                      | What is checked                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `parse-never-throws`      | `parse` survives the examples and hostile variations of them: empty, truncated, stray symbols…   |
| `diagnostics-have-lines`  | Every diagnostic has a code, a message, and a line and column inside the block                   |
| `steps-are-valid`         | `steps` returns a list of steps with a valid `at`, `triggers` and `location`                     |
| `view-matches-definition` | The view and the definition have the same `type`                                                 |
| `mount-shows-step-zero`   | `setState(0)` right after `mount` changes nothing                                                |
| `set-state-is-idempotent` | `setState(n)` twice gives the same DOM as once                                                   |
| `play-matches-set-state`  | `play(n - 1, n)` and `play(0, last)` end with the same DOM as `setState`                         |
| `set-state-goes-back`     | `setState(n)` after a later step gives the same DOM as a fresh `setState(n)`                     |
| `destroy-cleans-up`       | No nodes, reachable listeners, timers, animation frames or event bus subscriptions remain        |
| `docs-exist`              | `docs.md` has content and names the block                                                        |
| `examples-are-valid`      | There is at least one example; each uses the block and has no errors or warnings                 |
| `translations-exist`      | Each language pack with aliases for the block has a translated `docs.md`, or marks it as pending |

`checkBlockContract` runs the same rules and returns a report instead of registering tests. The kit also exports `createTestContext`, `createTestEventBus`, `createTestAssetResolver` and `trackLeaks` for a block's own tests. Vitest is an optional peer dependency, needed only by `runBlockContract`.

> Status: the contracts and the contract suite are in place. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
