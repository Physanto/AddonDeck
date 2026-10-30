# Contributing to AddonDeck

Thanks for wanting to help! AddonDeck is an open source project and every contribution counts: code, design, documentation, translations, examples, or simply reporting something that doesn't work.

Before you start, please read the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to follow it.

> **The project is under construction.** The repository, its tooling and its rules are in place, but the packages are still skeletons. Items marked _(planned)_ below describe how things will work once they exist.

---

## Ways to contribute

| I want to…                             | What to do                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Report a bug                           | Open an issue with the "Bug report" template. Include the `.deck` text that triggers it, if you can |
| Suggest an idea                        | Open an issue with the "Idea" template before building something big                                |
| Propose a block                        | Open an issue with the "New block" template. A step-by-step guide to building one is _(planned)_    |
| Design a theme or a preset             | _(planned)_ A guide will explain it. You won't need much programming experience                     |
| Add assets (icons, backgrounds, fonts) | _(planned)_ Read [Dependency and asset licenses](#dependency-and-asset-licenses) first              |
| Test with a language model             | _(planned)_ Evals will let you run decks through a model and share the results                      |
| Translate                              | _(planned)_ Language packs will hold format aliases, messages, Studio texts and block docs          |
| Improve the documentation              | Any fix is welcome, however small                                                                   |

If this is your first time, look for issues labeled **`good first issue`**.

---

## Before you code

1. **For big changes, open an issue first.** That way we can agree on the approach before you invest time.
2. **Read [docs/README.md](docs/README.md).** It explains what each package does, the dependency rule, and how everything fits together. The reasons behind the main decisions are in [docs/adr/](docs/adr/).
3. **Check the open issues** to see what is being worked on and where your contribution fits.

---

## Setting up

You need **Node.js LTS** (the version in [`.nvmrc`](.nvmrc)) and **pnpm** (the version in the `packageManager` field of `package.json`; `corepack enable pnpm` installs it).

```bash
git clone https://github.com/Physanto/AddonDeck.git
cd AddonDeck
pnpm install
pnpm test            # unit tests
pnpm test:coverage   # unit tests with the coverage report CI uses
pnpm check           # lint, formatting, types and dependency rules
pnpm format          # fix formatting and safe lint issues
pnpm build           # build every package
pnpm test:e2e        # export the examples and open them in three browsers (after pnpm build)
pnpm dev             # rebuild packages on every change
pnpm --filter @addondeck/runtime dev:page   # show the example decks in the browser
```

The end-to-end tests need the browsers once: `pnpm exec playwright install chromium firefox webkit` (on Linux, add `--with-deps` to install their system libraries).

Packages import each other straight from their sources, so tests and type checks don't need a build first.

---

## Architecture rules (checked in every PR)

- **Dependency arrows point toward `core` and `sdk`.** `pnpm check` enforces it, and so does CI.
- **A block never imports another block** or a library directly. It uses the services it receives in `BlockContext`.
- **A block definition (`definition.ts`) never touches the DOM.** The view (`view.ts`) never parses text.
- **`parse` never throws:** it returns diagnostics with a line number and, when possible, a suggestion.
- **No hardcoded colors, durations or easings.** Use the theme tokens (`ctx.theme`, `ctx.motion`).
- **`setState(n)` must be idempotent** and produce the same result as animating to that step.
- **Adding something new shouldn't require editing the core.** If it does, explain why in the PR.

---

## Style

- **TypeScript in strict mode.** Formatting and linting are handled by Biome (`pnpm check`, `pnpm format`).
- **Everything in the repository is written in English:** code, comments, documentation and commit messages. Other languages are added as product translations through language packs.
- **Every source file starts with its license header:**

```ts
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 The AddonDeck Authors
```

- **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):** `feat(sequence): add dashed replies`, `fix(core): ...`, `docs: ...`.

---

## Tests

Every contribution that changes code includes tests. That is what lets anyone change the project without fear of breaking it.
If you have never written tests, open the PR anyway and ask for help in it: we'll guide you.

Tests use [Vitest](https://vitest.dev/) and live next to the code they test, as `*.test.ts` files. Tests that read files from the repository, such as fixtures and example decks, go in the package's `test/` folder, which has Node.js types; `src/` stays free of them because `core` and `exporter` also run in the browser.

| If you change…                                                      | Required tests                                                                                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pure logic (parser, exporter, algorithms, utilities)                | Unit                                                                                                                                                                                                                     |
| A block or a verb                                                   | The SDK contract suite, unit tests for its `parse`, and at least one example deck                                                                                                                                        |
| Several pieces working together (exporter + CLI, Studio + exporter) | Integration                                                                                                                                                                                                              |
| The runtime, navigation, or anything visible while presenting       | End-to-end, including the double-click test (`e2e/`)                                                                                                                                                                     |
| Themes or styles                                                    | Visual snapshots _(planned)_                                                                                                                                                                                             |
| A bug                                                               | A test that fails without your fix and passes with it                                                                                                                                                                    |
| The parser                                                          | The new case and, for a new diagnostic, its code in the [format specification](docs/format/v1.md#diagnostics), its message in the text catalog and a fixture deck named after the code in `packages/core/test/fixtures/` |
| Documentation only                                                  | None                                                                                                                                                                                                                     |

**The double-click test** (`e2e/double-click.spec.ts`, with [Playwright](https://playwright.dev/)) exports every deck of `examples/` with the built `addondeck build`, opens each page from `file://` in Chromium, Firefox and WebKit, and checks that it starts without console errors and goes from the first slide to the last and back with the arrow keys. A new example deck is tested by adding it to `examples/`. CI runs it on every pull request.

**Coverage:** `core`, `sdk`, `runtime` and `exporter` must each keep at least 90% of lines covered, and CI enforces it (`pnpm test:coverage`), because everything else depends on them. Other packages have no minimum: we prefer a few tests that check real behavior over many that only raise the percentage.

---

## Recording your contribution (Changesets)

Every PR that changes something users will notice records what it did with a _changeset_:

```bash
pnpm changeset
```

1. Pick the affected packages and the type of change (patch, minor, major).
2. Describe what you did in **50 words or fewer**, written for whoever reads the changelog.
3. Don't add your name: when the version is published, `CHANGELOG.md` automatically adds a link to your PR and your GitHub username.

Example of the file generated in `.changeset/`:

```md
---

## "@addondeck/blocks": minor

Add animated row sorting to the table block.
```

In the changelog it will appear as: _Add animated row sorting to the table block. (#123) Thanks @your-username!_

Changes with no user-facing effect (refactoring, CI, documentation only) don't need a changeset; the reviewer adds the `no-changeset` label. CI checks that there is a changeset (or that label) and that it doesn't exceed 50 words.

---

## License of your contributions

AddonDeck is released under the **[Apache License 2.0](LICENSE)**.
By submitting a contribution, you agree that it is published under that same license, as stated in its section 5.

---

## Dependency and asset licenses

Everything included in the exported HTML travels with users' presentations, so the rules are strict.

**Allowed inside the export:**
- Code: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, CC0.
- Fonts: OFL-1.1, Apache-2.0.
- Images, icons and emojis: CC0, MIT, Apache-2.0, ISC, CC-BY (with attribution, which will be generated automatically).

**Not allowed inside the export:**
- GPL, LGPL, AGPL, SSPL.
- CC-BY-NC (non-commercial), CC-BY-ND (no derivatives), "personal use only".
- "Free but proprietary" licenses (for example, GSAP).

The Studio and the command line are not exported, so they may also use copyleft code, but only as a separate, documented module. Development tools may use any license approved by the OSI.

**If you add a dependency or an asset:**
1. Check its license in the original repository, for the exact version you use.
2. Add it to [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
3. Copy the full text of its license into [`licenses/`](licenses/).
4. _(planned)_ If it is a catalog asset, fill in `license`, `author` and `source` in its manifest.

---

## Pull request checklist

- [ ] The PR fixes an issue (link it) or explains the problem it solves.
- [ ] `pnpm check` and `pnpm test` pass.
- [ ] It includes tests and, where relevant, examples.
- [ ] Documentation is updated (in English), and no user-visible text is hardcoded.
- [ ] A changeset is included (50 words or fewer) if users will notice the change.
- [ ] New dependencies or assets are registered with their license.
- [ ] It works forward, backward, and exported with a double-click.

---

## Review

- We try to give a first response within a few days. If it takes longer, leave a friendly comment on the PR.
- Small PRs get reviewed much faster than big ones. If your change is large, consider splitting it.
- We may ask for changes. It's not personal: it keeps the project easy to maintain for everyone.

---

## Security

If you find a vulnerability, **don't open a public issue**. Follow the [security policy](SECURITY.md) and report it privately.

---

Thanks for helping more people explain things in an amazing way!
