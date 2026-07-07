// -----------------------------------------
// qda — PAGE TRANSITIONS
// Barba.js + GSAP + Lenis
// -----------------------------------------

import { initThemeToggle } from './theme-toggle.js';
import { initAccordions, destroyAccordions } from './accordion.js';
import { initTabs, destroyTabs } from './tabs.js';
import { initSliders, destroySliders } from './slider.js';
import { initInlineVideos, destroyInlineVideos } from './inline-video.js';
import { initModalDelegation, initModals, destroyModals } from './modal.js';
import { initFontSizeDetect, initFooterYear, initSkipLink } from './utilities.js';
import { initNavScrollHide, destroyNavScrollHide } from './nav.js';
import { initFormValidation, destroyFormValidation } from './form-validate.js';
import { initCopyLink, destroyCopyLink } from './copy-link.js';
import { initHoverList, destroyHoverList } from './hover-list.js';
import { initLogoWallCycle, destroyLogoWallCycle } from './logo-wall.js';
import { initListLoad, destroyListLoad } from './list-load.js';
import { initContentReveal, destroyContentReveal } from './content-reveal.js';
import { initMiniShowreel, destroyMiniShowreel } from './mini-showreel.js';
import { initFilter, destroyFilter } from './filter.js';

gsap.registerPlugin(CustomEase);
if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });


// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Document-level delegation (bind once)
  initModalDelegation();
  initFontSizeDetect();
  initSkipLink();
  initCopyLink();
  // Nav (with the hover-list) lives INSIDE the Barba container, so it's also
  // re-inited per-page in initAfterEnterFunctions + destroyed in
  // initBeforeEnterFunctions. Kept here too so first load works regardless of
  // whether afterEnter fires on Barba's `once`. The data-hover-init guard makes
  // the overlap a safe no-op.
  initHoverList();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Destroy old instances before new page enters
  destroyNavScrollHide();
  destroyAccordions();
  destroyTabs();
  destroySliders();
  destroyInlineVideos();
  destroyModals();
  destroyFormValidation();
  destroyLogoWallCycle();
  destroyListLoad();
  destroyHoverList(); // nav lives INSIDE the Barba container — swapped every nav
  destroyContentReveal();
  destroyMiniShowreel();
  destroyFilter();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  if (has('.nav'))                          initNavScrollHide(nextPage);
  if (has('[data-theme-toggle]'))           initThemeToggle(nextPage);
  if (has('details'))                       initAccordions(nextPage);
  if (has('[data-tabs-component]'))         initTabs(nextPage);
  if (has('[data-slider]'))                 initSliders(nextPage);
  if (has('[data-video]'))                  initInlineVideos(nextPage);
  if (has('dialog') || has('[data-modal-panel]')) initModals(nextPage);
  if (has('[data-form-validate]'))          initFormValidation(nextPage);
  if (has('[data-logo-wall-cycle-init]'))   initLogoWallCycle(nextPage);
  if (has('[data-list-load]'))              initListLoad(nextPage);
  if (has('[data-hover-item]'))             initHoverList(nextPage);
  if (has('[data-reveal-group]'))           initContentReveal(nextPage);
  if (has('[data-mini-showreel-open]'))     initMiniShowreel(nextPage);
  if (has('[data-filter-group]'))           initFilter(nextPage);
  if (has('[data-footer-year]'))            initFooterYear(nextPage);

  // Re-evaluate inline scripts inside the new container (Webflow embeds)
  reinitScripts(nextPage);

  // Webflow IX2 reinit
  if (window.Webflow && window.Webflow.ready) {
    window.Webflow.ready();
  }

  if (hasLenis) lenis.resize();
  if (hasScrollTrigger) ScrollTrigger.refresh();
}


// -----------------------------------------
// PAGE TRANSITIONS (Panel / label slide)
// Panel slides up showing the next page's name label,
// holds, then exits upward as the new page enters from below.
// Markup: [data-transition-wrap] > [data-transition-panel]
//         + [data-transition-label] > [data-transition-label-text]
// Next page name read from container's [data-page-name].
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();
  tl.call(() => resetPage(next), null, 0);
  return tl;
}

function runPageLeaveAnimation(current, next, data) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap?.querySelector("[data-transition-panel]");
  const transitionLabel = transitionWrap?.querySelector("[data-transition-label]");
  const transitionLabelText = transitionWrap?.querySelector("[data-transition-label-text]");

  const nextPageName = getPageLabel(next, data);
  // Only overwrite when we resolved a name — otherwise keep the markup default
  // so the label never flashes empty mid-transition.
  if (transitionLabelText && nextPageName) transitionLabelText.innerText = nextPageName;

  const tl = gsap.timeline({
    onComplete: () => { current.remove(); }
  });

  if (reducedMotion || !transitionPanel) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(next, { autoAlpha: 0 }, 0);
  tl.set(transitionPanel, { autoAlpha: 1 }, 0);

  tl.fromTo(transitionPanel, {
    yPercent: 0,
  }, {
    yPercent: -100,
    duration: 0.8,
  }, 0);

  tl.fromTo(transitionLabel, {
    autoAlpha: 0,
  }, {
    autoAlpha: 1,
  }, "<+=0.2");

  tl.fromTo(current, {
    y: "0vh",
  }, {
    y: "-10dvh",
    duration: 0.8,
  }, 0);

  return tl;
}

function runPageEnterAnimation(next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap?.querySelector("[data-transition-panel]");
  const transitionLabel = transitionWrap?.querySelector("[data-transition-label]");

  const tl = gsap.timeline();

  if (reducedMotion || !transitionPanel) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 1.25);

  tl.set(next, {
    autoAlpha: 1,
  }, "startEnter");

  tl.fromTo(transitionPanel, {
    yPercent: -100,
  }, {
    yPercent: -200,
    duration: 1,
    overwrite: "auto",
    immediateRender: false,
  }, "startEnter");

  tl.set(transitionPanel, {
    autoAlpha: 0,
  }, ">");

  tl.fromTo(transitionLabel, {
    autoAlpha: 1,
  }, {
    autoAlpha: 0,
    duration: 0.4,
    overwrite: "auto",
    immediateRender: false,
  }, "startEnter+=0.1");

  // New page rises into place (Buff Motion page-rise): power2.inOut so it eases
  // IN behind the panel's slow start then settles with no snap; 7dvh travel —
  // 15 exposed layout edges on tall pages. Started a hair after the panel so its
  // settle lands just after the reveal, not locked to it.
  tl.from(next, {
    y: "7dvh",
    duration: 1,
    ease: "power2.inOut",
  }, "startEnter+=0.1");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  // page-main is a Client-First `flex: 1` sticky-footer child. position:fixed
  // drops it out of the flex flow, so flex:1 stops stretching it and any
  // flex/%-height hero inside collapses to content height (the "half hero rises,
  // then the rest loads" bug). Pin a definite viewport height while fixed so
  // flex children resolve normally; resetPage clears it afterwards.
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "100dvh",
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container, data);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});


// -----------------------------------------
// HELPERS
// -----------------------------------------

// Resolve the label shown mid-transition. Prefers an explicit [data-page-name]
// on the next container; falls back to the clicked link's text (clean for nav
// clicks), then the next page's <title> (first segment before a separator or
// "… at …"). Returns "" if nothing usable, so the caller keeps the default.
function getPageLabel(container, data) {
  const explicit = container?.getAttribute("data-page-name");
  if (explicit && explicit.trim()) return explicit.trim();

  const trigger = data?.trigger;
  if (trigger && typeof trigger === "object" && trigger.textContent) {
    const t = trigger.textContent.replace(/\s+/g, " ").trim();
    if (t) return t;
  }

  const html = data?.next?.html;
  if (html) {
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (m && m[1].trim()) {
      return m[1].split(/\s[|–—·]\s|\s+at\s+/i)[0].trim();
    }
  }
  return "";
}

const themeConfig = {
  light: { nav: "dark", transition: "light" },
  dark: { nav: "light", transition: "dark" }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) transitionEl.dataset.themeTransition = config.transition;

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) nav.dataset.themeNav = config.nav;
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  window.__qdaLenis = lenis;

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, {
    clearProps: "position,top,left,right,bottom,width,height,transform,translate,x,y,xPercent,yPercent,scale,rotate"
  });

  // Belt-and-braces (from Buff Motion): clearProps zeros the transform values
  // but can leave an identity `transform: translate(0px,0px)` inline. Per CSS
  // spec ANY transform other than `none` (identity included) makes the element
  // a containing block for position:fixed/absolute descendants — which is what
  // breaks the revealed page's content after the rise. Force-remove the inline
  // props so the container returns to a truly transform-less state.
  ['transform', 'translate', 'scale', 'rotate'].forEach(prop => {
    container.style.removeProperty(prop);
  });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function reinitScripts(container) {
  container.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    [...oldScript.attributes].forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}
