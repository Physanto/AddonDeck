# Third-party licenses

AddonDeck is distributed under the [Apache License 2.0](LICENSE). This file lists the third-party components the project uses and their licenses.
The full text of each license is in the [`licenses/`](licenses/) folder.

> Only components that are actually installed are listed. Each pull request that adds or removes a dependency updates this file.

## Included in the exported HTML

These components travel inside presentations, and only when the deck needs them.

| Component                                          | Version | Purpose                                  | License | License text                        |
| -------------------------------------------------- | ------- | ---------------------------------------- | ------- | ----------------------------------- |
| [anime.js](https://github.com/juliangarnier/anime) | 4.5.0   | Animation engine (`@addondeck/adapters`) | MIT     | [animejs.txt](licenses/animejs.txt) |

## Used only in the Studio and the CLI (not exported)

None yet.

## Development tools (not distributed)

Direct development dependencies of the repository. Their own dependencies are not distributed either.

| Component                                                                  | Version | Purpose                                                                       | License           | License text                                                                                   |
| -------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| [TypeScript](https://github.com/microsoft/TypeScript)                      | 6.0.3   | Language and type checking                                                    | Apache-2.0        | [typescript.txt](licenses/typescript.txt)                                                      |
| [pnpm](https://github.com/pnpm/pnpm)                                       | 12.15.0 | Package manager                                                               | MIT               | [pnpm.txt](licenses/pnpm.txt)                                                                  |
| [tsdown](https://github.com/rolldown/tsdown)                               | 0.23.2  | Package builds (ESM, IIFE and type declarations)                              | MIT               | [tsdown.txt](licenses/tsdown.txt)                                                              |
| [Biome](https://github.com/biomejs/biome) (`@biomejs/biome`)               | 2.6.3   | Linting and formatting                                                        | MIT or Apache-2.0 | [biome-mit.txt](licenses/biome-mit.txt), [biome-apache-2.0.txt](licenses/biome-apache-2.0.txt) |
| [Vitest](https://github.com/vitest-dev/vitest)                             | 5.0.5   | Unit tests; optional peer of `@addondeck/sdk/testing`                         | MIT               | [vitest.txt](licenses/vitest.txt)                                                              |
| [@vitest/coverage-v8](https://github.com/vitest-dev/vitest)                | 5.0.5   | Test coverage                                                                 | MIT               | [vitest-coverage-v8.txt](licenses/vitest-coverage-v8.txt)                                      |
| [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)       | 18.7.0  | Dependency rules between packages                                             | MIT               | [dependency-cruiser.txt](licenses/dependency-cruiser.txt)                                      |
| [Changesets](https://github.com/changesets/changesets) (`@changesets/cli`) | 3.0.3   | Versioning and changelog                                                      | MIT               | [changesets-cli.txt](licenses/changesets-cli.txt)                                              |
| [@changesets/changelog-github](https://github.com/changesets/changesets)   | 1.0.1   | Changelog with pull request link and author                                   | MIT               | [changesets-changelog-github.txt](licenses/changesets-changelog-github.txt)                    |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped)          | 24.19.2 | Node.js type definitions                                                      | MIT               | [types-node.txt](licenses/types-node.txt)                                                      |
| [fast-check](https://github.com/dubzzz/fast-check)                         | 4.10.2  | Property-based tests (`@addondeck/core`)                                      | MIT               | [fast-check.txt](licenses/fast-check.txt)                                                      |
| [happy-dom](https://github.com/capricorn86/happy-dom)                      | 20.14.6 | DOM for tests (`@addondeck/sdk`, `@addondeck/adapters`, `@addondeck/runtime`) | MIT               | [happy-dom.txt](licenses/happy-dom.txt)                                                        |
| [Vite](https://github.com/vitejs/vite)                                     | 8.3.5   | Development page of `@addondeck/runtime`                                      | MIT               | [vite.txt](licenses/vite.txt)                                                                  |

## Adding a component

1. Check the license in the original repository, for the version you will use.
2. Confirm it is allowed by the policy in [CONTRIBUTING.md](CONTRIBUTING.md#dependency-and-asset-licenses).
3. Add a row to the matching table.
4. Copy the full text of its license into `licenses/<component>.txt`.
