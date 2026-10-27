---
"@addondeck/runtime": minor
---

Play each slide's clicks on its blocks: the next click animates, any other move shows the step at once, and a click during an animation finishes it first. Apply the deck's theme and motion personality as CSS variables, switching to `minimal` with reduced motion; give each block only the adapters it declares in `needs`; emit `slide:enter`, `slide:leave` and `step:change`; add the `none`, `fade`, `slide` and `zoom` transitions, a card with the problems of each slide and the "Made with AddonDeck" watermark.
