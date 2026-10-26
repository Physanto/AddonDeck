# 003. anime.js v4 instead of GSAP

- Status: Accepted
- Date: 2026-10-25

## Context

The animation library is embedded in every exported presentation, so it is redistributed with users' content and must have a permissive open source license.

GSAP is capable and widely used, but its license is not an open source license: it is free of charge yet restricts use in products that compete with its owner's visual web building tools, which a no-code presentation tool could be considered.

## Decision

Use anime.js v4 (MIT) as the animation engine, wrapped in the `Animator` interface of the SDK. Blocks never import it directly; they receive an `Animator` from the runtime.

## Consequences

- The exported HTML only contains permissively licensed code.
- Effects that GSAP offers ready-made may need to be built on top of anime.js.
- Because blocks only see the `Animator` interface, the library can be replaced later by changing one adapter.
