# Social Kit — Instagram / Facebook

The studio's **primary output surface**. A click-through kit of post and story templates that hold from a full feed graphic down to a profile thumbnail.

## Demo
`index.html` — an Instagram-style profile for **@thedigitalfront**. Switch **Feed / Stories**, click any tile to open it large.

## Templates (`Posts.jsx`)
All render on a fixed **1080-unit canvas** and scale to any display width via `<Frame w h display>`.

| Component | Format | Use |
|---|---|---|
| `PostStatement` | 1080² | Signature: white serif headline on slate blue + grid texture. |
| `PostServices` | 1080² | Two editorial service lines on snow ("What we do"). |
| `PostQuote` | 1080² | Testimonial — blue serif on snow + pixel-dot texture. |
| `PostMark` | 1080² | Identity — large DF mark on near-charcoal navy. |
| `StoryStatement` | 1080×1920 | Vertical statement + CTA row. |

`Profile.jsx` → `ProfileBar` (avatar, handle, stats, bio, Feed/Stories tabs).

## Rules of the surface
- Each post leads with **one idea**. White-on-blue is the default; snow grounds are the change-up.
- Mark + mono kicker top-left; mono index bottom-left. Texture (grid/dots) at ≤7% contrast only.
- Never more than one italic-serif emphasis word per graphic. No emoji.

## To make a real post
Render the component at `display={1080}` and screenshot, or drop the JSX into a 1080×1080 export frame.
