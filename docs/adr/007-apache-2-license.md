# 007. Apache License 2.0

- Status: Accepted
- Date: 2026-10-25

## Context

AddonDeck should be usable by anyone, including companies and schools, and its exported presentations travel with users' content. Contributors and users also benefit from clear patent terms, and the project name should stay recognizable.

## Decision

License the project under the Apache License 2.0. Every source file carries an SPDX header, the `NOTICE` file holds the project credit, and contributions are accepted under the same license, as section 5 of the license states. The project name is not covered by the license (section 6).

## Consequences

- Free use, modification and redistribution, including commercial use, as long as the license and `NOTICE` are kept.
- An explicit patent grant from contributors protects users.
- The license grants no rights to the AddonDeck name, so forks need a name of their own.
- Third-party code included in exported presentations must have a compatible permissive license; copyleft code can't be embedded there.
