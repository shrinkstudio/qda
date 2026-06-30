# QDA — qda.global

Webflow JS bundle for the Quantum Datacenter Alliance event site — Barba.js page transitions (panel/label slide), GSAP, Lenis. Served via jsDelivr.

- **Repo:** `shrinkstudio/qda` · **Lenis global:** `window.__qdaLenis`
- **Custom ease:** `osmo` — `0.625, 0.05, 0, 1`

## Quick start

```bash
npm install
npm run build    # one-time build
npm run watch    # rebuild on save
npm run deploy   # build + commit + push + print pinned jsDelivr URL (see Deploy)
```

## Webflow setup

### CDN dependencies

Add these to **Site Settings → Custom Code → Head Code** (before `</head>`):

```html
<!-- GSAP -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/CustomEase.min.js"></script>

<!-- Lenis smooth scroll -->
<script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>

<!-- Barba.js page transitions -->
<script src="https://cdn.jsdelivr.net/npm/@barba/core@2/dist/barba.umd.js"></script>

<!-- Swiper (only if using sliders) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

### Bundle script

See **[Deploy](#deploy)** below — during dev the bundle is registered via the Webflow Scripts API at a commit-pinned jsDelivr URL; at go-live it becomes a plain `@main` footer embed.

### Webflow markup

Barba requires specific markup on every page:

```html
<!-- data-barba="wrapper" MUST be the direct parent of container -->
<div data-barba="wrapper">
  <main data-barba="container" data-barba-namespace="page-name">
    <!-- page content -->
  </main>
</div>
```

**Critical rule:** `data-barba="wrapper"` must be the **direct parent** of `data-barba="container"`. No intermediate elements between them — Barba appends new containers to the wrapper, breaking layout if they're not adjacent.

Add `data-barba-namespace` to each page with a unique name (e.g., `home`, `about`, `contact`).

For nav links that should update `aria-current` on transition, add `data-barba-update` to each nav link.

## Modules

| Module | Trigger | Description |
|---|---|---|
| `accordion.js` | `<details>` | Animated accordion with GSAP |
| `tabs.js` | `[data-tabs-component]` | Tabs with autoplay, mobile dropdown, keyboard nav |
| `slider.js` | `[data-slider]` | Swiper.js wrapper with CSS variable breakpoints |
| `inline-video.js` | `[data-video]` | Lazy video with scroll-play, hover-play, controls |
| `modal.js` | `<dialog>` | Dialog modals with auto-open and cooldown |
| `nav.js` | `.nav` | Scroll hide/show nav with Lenis integration |
| `form-validate.js` | `[data-form-validate]` | Live form validation with spam protection |
| `theme-toggle.js` | `[data-theme-toggle]` | Dark/light mode with localStorage |
| `copy-link.js` | `[data-copy-link]` | Copy link href to clipboard |
| `utilities.js` | — | Font size detect, footer year, skip link |

All modules export both `initX(scope)` and `destroyX()` functions. The destroy function is called automatically before each Barba transition.

## Adding a new module

1. Create `src/scripts/my-module.js` with both init and destroy:

```js
let cleanup = null;

export function initMyModule(scope) {
  scope = scope || document;
  // ... setup
  cleanup = () => { /* teardown */ };
}

export function destroyMyModule() {
  if (cleanup) { cleanup(); cleanup = null; }
}
```

2. Import and register in `transitions.js`:

```js
import { initMyModule, destroyMyModule } from './my-module.js';

// In initBeforeEnterFunctions:
destroyMyModule();

// In initAfterEnterFunctions:
if (has('[data-my-module]')) initMyModule(nextPage);
```

3. Build and push.

## Transition (panel / label slide)

A panel slides up covering the page, shows the next page's name label, holds, then exits upward as the new page enters from below. Lives in `runPageLeaveAnimation()` / `runPageEnterAnimation()` in `transitions.js`. Respects `prefers-reduced-motion` (and missing markup) — falls back to an instant swap.

Required markup (place once, outside the Barba container — e.g. in the page wrapper):

```html
<div data-transition-wrap>
  <div data-transition-panel>
    <div data-transition-label>
      <span data-transition-label-text></span>
    </div>
  </div>
</div>
```

Each Barba container sets the label text via an attribute on itself:

```html
<main data-barba="container" data-barba-namespace="programme" data-page-name="Programme">
```

## Deploy

**During dev — commit-pinned via the Webflow Scripts API.** Commit-SHA jsDelivr URLs are immutable, so each push is served instantly with no purge lag.

```bash
npm run deploy -- "what changed"
```

This builds, commits, pushes, then prints the **pinned URL**, its **SRI integrity hash**, and a **version** string. Register/update the bundle in Webflow with those three values (Scripts API → `registerScript` hosted, then apply to the site's custom code). On each subsequent deploy, re-register with the new values (version must be unique per commit).

```
hostedLocation : https://cdn.jsdelivr.net/gh/shrinkstudio/qda@<sha>/dist/index.min.js
integrityHash  : sha384-…
version        : <short-sha>
```

**At go-live — plain `@main` footer embed.** Drop the Scripts API registration and add to **Site Settings → Custom Code → Footer Code**:

```html
<script defer src="https://cdn.jsdelivr.net/gh/shrinkstudio/qda@main/dist/index.min.js"></script>
```

After a push, purge: `https://purge.jsdelivr.net/gh/shrinkstudio/qda@main/dist/index.min.js`. Never use `@latest`.
