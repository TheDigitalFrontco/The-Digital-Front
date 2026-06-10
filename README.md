# The Digital Front — Website

AI-generated videos and custom websites for businesses who want to be seen.

A fast, hand-finished **static site** (no build step). The signature scroll piece —
a pinned sequence that cross-fades through cards with a scramble-decode text
reveal — is built on GSAP ScrollTrigger + Lenis, and **degrades gracefully** to a
plain, readable page when JavaScript or motion is unavailable.

---

## Run it

It's plain HTML/CSS/JS. Two ways to view:

- **Quickest:** double-click `index.html` (needs internet — fonts, GSAP, Lenis and
  Lucide load from CDNs).
- **Local server (recommended):** from this folder run
  `python -m http.server 8000` and open `http://localhost:8000`.

## Deploy

Drag this whole folder onto **Netlify Drop**, or push to GitHub and connect
**Vercel / Netlify / Cloudflare Pages / GitHub Pages**. No build command, no
framework — publish directory is the folder itself.

---

## Swapping in your media (the card "hero objects")

Each card's visual lives in a device frame (`.frame--browser` or `.frame--phone`).
The empty state shows a labelled placeholder. To drop in real media, find the
`<!-- SWAP: ... -->` comment in `index.html` and replace the contents of the
matching `.frame__screen` (identified by `data-slot`):

```html
<!-- before -->
<div class="frame__screen" data-slot="do-motion">
  <span class="slot__tag"><i data-lucide="play"></i> Reel</span>
</div>

<!-- after — video -->
<div class="frame__screen" data-slot="do-motion">
  <video src="assets/media/do-motion.mp4" autoplay muted loop playsinline></video>
</div>

<!-- after — image -->
<div class="frame__screen" data-slot="do-frontend">
  <img src="assets/media/do-frontend.jpg" alt="">
</div>
```

The frame, cropping (`object-fit: cover`) and rounded corners are handled for you;
the placeholder tag auto-hides once a `<video>` or `<img>` is present. Put your
files in `assets/media/`. Slots: `do-motion`, `do-frontend`, `build-singlepage`,
`build-multipage`, `build-ecommerce`, `build-motion`.

> Videos: MP4 (H.264), **muted + loop**, short (5–15s). Reels are 9:16 (phone
> frame); site previews are 16:10 (browser frame).

---

## Where things are

| File | What it holds |
|---|---|
| `index.html` | All content + structure. Sections are clearly commented. |
| `colors_and_type.css` | Brand design tokens (colors, type, spacing). The source of truth — don't fork it. |
| `styles.css` | Site styling. Tweakables live in `:root` at the top. |
| `main.js` | Scroll engine, scramble reveal, nav, testimonials. |
| `assets/` | Logo + favicon. Add `assets/media/` for clips/screenshots. |

### Common tweaks (in `styles.css` → `:root`)
- **Section colors:** `--bg-do` (navy), `--bg-build` (slate), `--bg-work` (teal).
  Change here and in `SECTION_COLOR` inside `main.js` so the scroll engine matches.
- **Layout width / padding:** `--wrap`, `--pad`. **Nav height:** `--nav-h`.

### Scroll feel (in `main.js`)
- Pin length / pace: the `0.85` multiplier in the ScrollTrigger `end`.
- Scramble speed: the `460` (ms) in `scrambleCard`.
- Testimonial interval: `5200` (ms) in `initQuotes`.

---

## Contact routes used on the site
- WhatsApp: `+961 70 622 335` → `https://wa.me/96170622335`
- Email: `create@thedigitalfront.co`
- Instagram `@thedigitalfront.co` · TikTok `@thedigitalfront` · Facebook "The Digital Front"

## Notes
- **Logo:** uses your uploaded mark (`assets/logo-source-cropped.png`). Favicon uses
  the flat blue vector (`assets/mark-blue.svg`) so it stays visible on light browser tabs.
- **Fonts** are Google Fonts substitutes (Newsreader / Hanken Grotesk / IBM Plex Mono)
  per the design system — swap for licensed faces by editing `--font-*` in `colors_and_type.css`.
- Built matte and on-brand: no glow, gradients, or orbs — flat color fields + faint grid texture only.
