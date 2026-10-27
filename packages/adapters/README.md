# @addondeck/adapters

SDK implementations backed by third-party libraries.

Wraps libraries such as animation, physics, charting and highlighting engines behind the SDK interfaces. Adapters hold no presentation logic.

## Animator with anime.js

`createAnimeAnimator` implements the SDK `Animator` with [anime.js](https://animejs.com) v4:

```ts
import { createAnimeAnimator } from "@addondeck/adapters/animator-anime";

const animator = createAnimeAnimator({ motion });
await animator.animate(title, { opacity: [0, 1], y: [20, 0] }).finished;
```

- Durations and easings left out come from `motion` (`duration.m`, `easing.move`); the project easing names are translated to anime.js in `anime-easings.ts`, and nowhere else.
- Animations play on the anime.js main loop, so they pause while the page is hidden.
- `finished` also settles when an animation is cancelled, including when a later animation replaces all its properties.
- Values with `var(--name)` are written back as given when an animation ends, so they keep following the theme.
- Animations that take no time are applied at once with the SDK instant animator.

No other package imports anime.js; `pnpm check` rejects it ([ADR 003](../../docs/adr/003-animejs-over-gsap.md)).

> Status: the animator is ready; physics, charts and highlighting adapters come later. The package is private until its first release.

How this package fits with the others: [contributor map](../../docs/README.md).

Licensed under the [Apache License 2.0](../../LICENSE).
