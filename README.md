# Shrink Scripts (Barba)

Webflow JS bundle boilerplate — **with Barba.js page transitions**.

## Quick start

1. Click **"Use this template"** on GitHub to create your project repo
2. Find-replace these placeholders across all files:

| Placeholder | Example | Description |
|---|---|---|
| `TEMPLATE_PROJECT_NAME` | `my-client` | Package name and log prefix |
| `TEMPLATE_CUSTOM_EASE_NAME` | `osmo` | GSAP CustomEase name |
| `TEMPLATE_CUSTOM_EASE_VALUE` | `0.625, 0.05, 0, 1` | CustomEase cubic values |
| `TEMPLATE_LENIS_GLOBAL` | `__myClientLenis` | `window.` property for Lenis instance |

3. Install and build:

```bash
npm install
npm run build    # one-time build
npm run watch    # rebuild on save
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

Add to **Site Settings → Custom Code → Footer Code** (before `</body>`):

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_ORG/YOUR_REPO@COMMIT_SHA/dist/index.min.js"></script>
```

> **Always pin to a commit SHA** — never use `@latest`. After pushing, purge the cache:
> `https://purge.jsdelivr.net/gh/YOUR_ORG/YOUR_REPO@COMMIT_SHA/dist/index.min.js`

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

## Default transition

Ships with a simple cross-fade (0.4s). Replace `runPageLeaveAnimation()` and `runPageEnterAnimation()` in `transitions.js` with your project-specific animations (wipes, slides, etc.).

The transition respects `prefers-reduced-motion` — falls back to instant opacity swap.

## Deployment

```bash
npm run build
git add dist/index.min.js src/
git commit -m "description of changes"
git push
```

Then purge jsDelivr cache for the pinned commit SHA.
