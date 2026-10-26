# Security policy

## Reporting a vulnerability

Please **don't open a public issue**. Report it privately with [Report a vulnerability](https://github.com/Physanto/AddonDeck/security/advisories/new), in the repository's Security tab.

Include what you can: the affected package and version, the steps or the `.deck` text that reproduce it, and the impact you expect. We aim to reply within a few days and will keep you informed until a fix is published. If you wish, you will be credited in the advisory.

## What we care about most

Presentations are shared as single HTML files, so these are especially relevant:

- Deck text being executed as code outside an explicit `custom` block.
- Script or markup injection through deck text, images or SVG files in an exported presentation.
- Escaping the sandbox of the Studio preview.

## Supported versions

AddonDeck has no releases yet. Once it does, security fixes will go into the latest version.
