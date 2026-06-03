# The Digital Front — Design System

> A digital creative studio that turns ideas into reality through **AI-generated video content** and **front-end website creation**, for startups and business owners who want to elevate their online presence.

This repository is the single source of truth for The Digital Front's brand and product design. It contains the brand foundations (color, type, logo, texture), reusable CSS tokens, real visual assets, and high-fidelity UI kits for the studio's primary surfaces.

---

## What this brand is

The Digital Front is a small, technically-excellent creative studio. Two services sit at its core:

1. **AI-generated video content** — short-form motion and brand films, generated and directed in-house.
2. **Front-end website creation** — fast, premium, hand-finished websites for founders and small businesses.

**Brand personality:** modern, creative, tech-forward, trustworthy, **matte**. Quietly confident and technically excellent — *not* flashy. The work should make a prospective client feel **trust, excitement, and "this is the solution I need."**

**Primary output:** Instagram & Facebook posts — so everything must hold from a large feed graphic down to a small round profile thumbnail.

### Sources provided
- `uploads/Logo.jpeg` + `assets/logo-source.{png,svg}` — the official DF monogram supplied by the client (a soft 3-D white render). The system ships a **clean, flat, recolorable vector re-draw** (`assets/mark.svg`) traced faithfully from the source silhouette so it can sit white-on-blue and scale to a thumbnail.
- A written brand brief (personality, color, type, logo, visual style, references, do-not list). All of it is captured below.
- No codebase, Figma, or slide deck was provided. The system is therefore **brand-led**: foundations + asset library + studio-facing UI kit (social templates), rather than a recreation of an existing product UI.

**References that anchor the taste:** Daybreak Studio (clean, editorial), Collins (conceptual, premium typographic systems), Apple (minimal, precise), Nike (bold, iconic simplicity).

---

## Content fundamentals — how the brand writes

The voice is an **editorial creative studio**: confident, spare, and a little aspirational — never salesy, never jargon-heavy.

- **Person & address:** Speaks as **"we"** (the studio), addresses the client as **"you."** "We turn *your* ideas into reality."
- **Casing:** Sentence case for headlines and body. **UPPERCASE is reserved for mono kickers/labels** (e.g. `AI VIDEO · WEB CRAFT`) where wide letter-spacing makes it feel technical, not shouty.
- **Sentence length:** Short, declarative, with rhythm. One strong idea per line. Fragments are allowed for impact ("Motion that sells." / "Front-end, finished.").
- **Emphasis:** A single *italic serif* word inside an otherwise plain headline carries the emotion — used **once**, sparingly ("The front of *everything* you build").
- **Emoji:** **None.** Ever. They break the matte, premium register.
- **Numbers & indices:** When used, set in mono as indices/labels (`01 / Studio`, `2026`) — they read as digital texture, not as data slop. Don't invent stats.
- **What to avoid in copy:** hype words ("revolutionary," "game-changing," "unleash"), AI clichés ("harness the power of AI"), exclamation marks, and corporate filler.

**Tone examples**
- Hero: *"Ideas into reality."* / *"The front of everything you build."*
- Service line: *"Motion that sells."* · *"Sites that feel inevitable."*
- CTA: *"Start a project"* · *"View work"* · *"Let's build the front."*

---

## Visual foundations

The whole system rests on one signature move: **white logo and white type on a matte slate-blue field** — exactly like the logo. White is the breathing room; blue is the brand.

### Color
- **Brand blue — matte slate.** A desaturated slate-blue scale anchored by **`#4F6E9B` (blue-500, light anchor)** and **`#3E587F` (blue-700, deep anchor / primary)**, extended down to a near-charcoal navy **`#1E2C40` (blue-950)** for the deepest backgrounds. No neon, no electric blue.
- **Snow white `#FFFFFF`** for the logo, key text, and high-contrast elements on blue.
- **Cool greys** (faintly blue-tinted) for light-theme text and borders — they harmonise with the slate rather than fighting it.
- **Three themes:** `light` (default — snow/grey bg, blue carries logo & accents), `dark` (near-charcoal navy bg), `brand` (the lighter `#3E587F` slate as a full surface). All defined as semantic tokens in `colors_and_type.css`.
- **Matte rule:** flat fills only. **No gradients on brand surfaces, no glossy highlights, no glow.** Functional colors (positive/caution/critical) are deliberately muted to stay in register.

### Type
A premium-publication pairing — *editorial authority meets modern tech*:
- **Display — `Newsreader`** (serif). Headlines, pull quotes, the wordmark. Weights 400–600; italics for emphasis.
- **Body / UI — `Hanken Grotesk`** (clean neutral grotesque, Neue Haas-class). Everything functional.
- **Labels — `IBM Plex Mono`**. Kickers, indices, technical captions, the "The" in the lockup. Uppercase + wide tracking — this is where the *digital texture* lives in type.
- Strong hierarchy, **negative tracking on large serif**, generous line-height on body. See `type-scale` card.
- ⚠️ These are **Google Fonts substitutes** chosen against the brief (no font files were supplied). `Hanken Grotesk` stands in for "Neue Haas Grotesk quality." Swap for licensed faces any time — only `--font-*` vars change.

### Space, shape, elevation
- **4px base grid**, generous. Breathing room is a feature — sections are spacious, never dense.
- **Sharp, geometric corners.** Default radii are `0`–`4px`; pills (`999px`) only for small chips/toggles. Nothing is bubbly.
- **Soft, low, matte shadows** (`--shadow-1/2/3`) — barely-there depth, never a hard or glossy drop. Most brand surfaces use **no shadow at all**, relying on color blocks and hairline borders.

### Backgrounds & texture
- Backgrounds are **solid color fields** — snow on light, slate/navy on dark. No photographic gradients, no orbs.
- **Digital texture used with restraint:** faint **grid lines** or **pixel dots** (`--texture`, ~8–10% contrast) to add structure to large blue fields. Structure, never noise. See `brand-texture` card.
- When photography/video stills are used, they should read **cool, crisp, slightly desaturated** — matching the matte slate world, never warm or glossy.

### Motion (the brand is "motion-aware")
- Designed to animate. Default easing is **calm and confident**: `cubic-bezier(.22,.61,.36,1)` (ease-out), 180–420ms.
- **Fades, precise slides, and mask/clip reveals** — never bounce, never spring overshoot, never spin. Type can reveal line-by-line.
- Hover/press should feel **mechanical and exact**, in keeping with the geometric mark.

### Interaction states
- **Hover:** primary buttons darken one step on the blue scale (`700 → 800`); secondary/ghost shift border or text to full `--fg1`. On brand surfaces, white elements lift opacity. No color-shift surprises.
- **Press:** subtle — a 1px optical nudge or a step-darker fill. **No scale-bounce.**
- **Focus:** accent-blue 1px border (light) / white border (dark). Flat — no inner shadow.
- **Borders:** hairline `1px` greys on light; low-alpha white on blue. Cards = hairline border + faint shadow (light) or flat color block (brand). No "rounded card with a colored left-border accent."
- **Transparency / blur:** used rarely — a light scrim over imagery for legibility, or low-alpha white dividers on blue. Not a glassmorphism system.

---

## Iconography

The Digital Front is **near-iconless by design** — the typographic system and the mark do the work. Guidance:

- **No emoji, ever.** No decorative Unicode glyphs as icons.
- When functional UI icons are needed (arrows, play, close, menu), use a **thin, geometric line set** that matches the mark's precision. The system links **[Lucide](https://lucide.dev)** from CDN as the substitute set — clean 1.5px strokes, sharp joins. *(Flagged substitution: no proprietary icon set was supplied.)*
- The brand's signature "icon" is really **typographic**: the mono arrow `→` for links/CTAs and mono indices (`01 / 02`) as wayfinding.
- The **DF mark** (`assets/mark.svg`) is the one true brand glyph — used as favicon, avatar, loader, and section bullet at small sizes.
- Never draw custom illustrative icons or robot/AI imagery (see Avoid list).

---

## Explicitly avoid

Per the brief — these read as generic, dated, or off-brand:
- Bluish-purple AI gradients, glowing orbs, "neural network" lines, robot/android imagery.
- Glossy or skeuomorphic finishes, heavy drop shadows, bevels.
- Corporate stiffness and clutter; data slop (decorative stats/numbers/icons).
- Trendy-but-disposable effects. Emoji. Cards with a rounded corner + colored left-border accent.
- Overused type (Inter, Roboto, Fraunces, Playfair) — we deliberately chose alternatives.

---

## Index — what's in this system

| Path | What it is |
|---|---|
| `README.md` | This file — context, voice, foundations, iconography, manifest. |
| `SKILL.md` | Agent-Skill front matter so this folder works as a downloadable Claude skill. |
| `colors_and_type.css` | **Start here in code.** All design tokens: color scales, semantic themes (light/dark/brand), type families + scale, spacing, radii, shadows, and `.df-*` helper classes. |
| `assets/` | Brand assets — `mark.svg` (recolorable), `mark-white/blue.svg`, raster `mark-*.png`, `avatar-*.png` (profile thumbnails), and the original `Logo.jpeg`. |
| `preview/` | The Design-System-tab cards (color, type, spacing, components, brand). Small standalone HTML specimens. |
| `ui_kits/social/` | **Primary surface.** Instagram/Facebook post + story templates as a click-through kit. |
| `fonts/` | (Fonts load from Google Fonts CDN — no local files. Drop licensed `.woff2` here and update `--font-*` if/when available.) |

Each UI kit has its own `README.md`, an `index.html` demo, and small JSX components.

---

## ⚠️ Caveats — please confirm

1. **The logo vector is a faithful trace** of the official source (`assets/logo-source.png/svg`), which is a flat raster with a 3-D shadow — so `assets/mark.svg` is a clean recolorable redraw of the same silhouette (the Γ-bracket + inner bar + curved "7"). If you have a native vector (true paths), send it and I'll drop it in to be pixel-exact.
2. **Fonts are Google Fonts substitutes** (Newsreader / Hanken Grotesk / IBM Plex Mono). If you license Neue Haas Grotesk or a specific display serif, send the files — only the `--font-*` variables change.
3. **Icons** substitute Lucide from CDN; no proprietary set was provided.
