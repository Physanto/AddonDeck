# 006. Monorepo with pnpm workspaces

- Status: Accepted
- Date: 2026-10-25

## Context

The project is split into packages with one responsibility each (format, SDK, runtime, blocks, adapters, themes, assets, exporter) plus the Studio and the command line. A single feature often touches several of them, such as the format, a block and the exporter.

## Decision

Keep every package and app in one repository managed with pnpm workspaces. Each package can still be versioned and published on its own, with Changesets. The allowed dependencies between packages are checked automatically with dependency-cruiser.

## Consequences

- One clone and one install to contribute, and changes across packages land in a single pull request.
- Package boundaries are not enforced by repository walls, so they need the automated dependency rule check.
- Releases need per-package versioning and changelogs.
