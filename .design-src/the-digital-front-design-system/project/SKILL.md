---
name: the-digital-front-design
description: Use this skill to generate well-branded interfaces and assets for The Digital Front, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, social posts, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Where things are
- `colors_and_type.css` — all design tokens (color scales, light/dark/brand themes, type, spacing, radii, shadows, `.df-*` helpers). Import or copy the `:root` block.
- `assets/` — the recolorable DF mark (`mark.svg`, `mark-white/blue.*`), profile avatars, original logo.
- `ui_kits/social/` — Instagram/Facebook post + story templates (the studio's primary output).
- `preview/` — small specimen cards for every foundation.

## Non-negotiables
- The signature look is **white logo + white type on matte slate blue** (`#3E587F` / `#4F6E9B`).
- **Matte only** — flat fills, no gradients on brand surfaces, no glow, no glossy shadows.
- Type: **Newsreader** (serif display) + **Hanken Grotesk** (sans body) + **IBM Plex Mono** (labels/kickers).
- Sharp geometric corners (0–4px). Generous breathing room. Digital texture (grid/dots) at ≤7% contrast, used with restraint.
- **No emoji**, no AI-cliché imagery (purple gradients, orbs, robots), no clutter.
