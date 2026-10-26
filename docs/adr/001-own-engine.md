# 001. Own presentation engine instead of Slidev

- Status: Accepted
- Date: 2026-10-25

## Context

AddonDeck must produce animated presentations that open with a double click, without a server, a build step or an internet connection. Decks are often written by language models, including small local ones, so the text they write has to be short and forgiving.

Existing tools such as Slidev are excellent for developers, but they rely on a development server and a build toolchain, and their decks mix Markdown with framework components. A model writing for them has to produce layout, navigation and styling details, which small models get wrong.

## Decision

Build a dedicated engine: a plain text format parsed by `core`, a browser runtime that handles stage scaling, steps and navigation, and blocks that are plugins of that runtime.

## Consequences

- Authors (people or models) only describe content; navigation, scaling, steps and base styles are the engine's job.
- Step-by-step animation is deterministic and fully under our control, which makes going back, jumping and printing reliable.
- We have to build and maintain what existing tools already offer: navigation, presenter view, overview, printing and accessibility.
