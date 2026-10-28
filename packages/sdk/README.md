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

## Registering

In an exported deck, each block and adapter is a classic script that registers itself with the runtime when it loads. The definition travels with the view, because the runtime parses the deck in the browser:

```ts
AddonDeck.register({ kind: "block", definition: quote, view: quoteView });

AddonDeck.register({
	kind: "adapter",
	adapter: "animator",
	create: ({ motion }) => createAnimeAnimator({ motion }),
});
```

`BlockPlugin`, `AdapterPlugin` and their union `Plugin` describe these objects. An adapter's `create` receives an `AdapterEnvironment`, the deck's theme and the motion tokens in effect, and returns its service (`Animator`, `PhysicsWorld`, `ChartRenderer` or `Highlighter`). The runtime creates the animator once per deck and again when the motion personality changes; with `minimal` (always the case when the system asks for reduced motion) it animates without motion and does not call the adapter. The other services are created for each block that declares them in `needs`, so a block's physics world is its own.

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

`animator` and `motion` follow the motion personality in effect, which can change while a block is mounted, so read them from `ctx` when animating instead of keeping them.

`PhysicsWorld`, `ChartRenderer`, `Highlighter` and `VerbPlugin` are marked `@experimental`: they will be settled together with their adapters and the scene block.

## Events

`ctx.events` is shared by every block of the deck. The runtime emits three events, typed by `RuntimeEvents`:

| Event         | Payload           | When                                        |
| ------------- | ----------------- | ------------------------------------------- |
| `slide:leave` | `{ slide }`       | The current slide is about to be left       |
| `slide:enter` | `{ slide }`       | A slide became the current one              |
| `step:change` | `{ slide, step }` | After every move, to another click or slide |

Moving to another slide emits `slide:leave`, `slide:enter` and `step:change`, in that order; the first slide shown emits only `slide:enter`. Blocks name their own events after their id (`network:step`), with any payload. Everything subscribed in `mount` is unsubscribed in `destroy`.

```ts
const off = ctx.events.on("step:change", ({ slide, step }) =>
	update(slide, step),
);
ctx.events.emit("network:step", 2);
```

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

In `play`, create the step's animations before awaiting anything, usually as one timeline. When the presenter clicks again before they end, the runtime jumps them to their end and calls `setState(to)`; an animation started after an `await` would play over that state.

`createInstantAnimator()` implements `Animator` without a library, applying final values at once: the runtime uses it for `setState`, for reduced motion and in tests. It leaves the same styles an animated adapter leaves at the end and reads the `transform` already written, so both can work on the same elements. `toCssValue()` holds the default units both share, and `getStrokeDraw()` and `setStrokeDraw()` the representation of `draw`.

## Revealing content

`setRevealed(animator, elements, revealed)` hides elements below their place or shows them in place, at once; `playReveal(ctx, elements)` makes hidden ones rise into place, one after another, with the deck's motion. Both end with the same styles, so a block that reveals items one per step can write:

```ts
setState: (step) =>
	items.forEach((item, index) => setRevealed(ctx.animator, [item], index < step)),
play: (from, to) => playReveal(ctx, items.slice(from, to)),
```

## Markdown

Blocks that show text use the same Markdown as slide text ([ADR 009](../../docs/adr/009-own-markdown-subset.md)):

- `parseMarkdown(lines)` reads source lines into plain data: headings, paragraphs, lists, block quotes, fenced code and rules. It takes step annotations off every line outside code fences and lists the annotated lines in `document.annotated`.
- `parseInline(text)` reads strong text, emphasis, inline code, links and escapes.
- `renderMarkdown(document, el)` and `renderInline(nodes, el)` build the DOM with elements and text nodes, never HTML strings, so tags written in a deck show as written. `renderMarkdown` returns the element that shows each source line, to reveal annotated lines on their steps.
- `safeHref(destination)` keeps `http`, `https` and `mailto` addresses and `#` fragments; links to anything else keep only their text.

`readFence` and `closesFence`, re-exported from `core`, recognize code fences exactly as the step plan does.

## Diagnostics of a block

A block reports problems with codes of its own, `<TYPE>-<letter><number>`, from a catalog of English messages:

```ts
const MESSAGES: BlockMessages<"QUOTE-W01"> = {
	"QUOTE-W01": { severity: "warning", message: "The quote has no author." },
};
createBlockDiagnostic(MESSAGES, "QUOTE-W01", source.location);
```

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

> Status: the contracts and the contract suite are in place; the adapter environment and the runtime events are settled. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
