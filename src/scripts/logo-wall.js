// -----------------------------------------
// LOGO WALL CYCLE — random logo swap-in/out
// -----------------------------------------
// Cycles logos through a fixed grid of visible slots: one slot swaps at a
// time (out up / in from below), driven by a looping GSAP timeline that
// pauses off-screen (ScrollTrigger) and when the tab is hidden.
//
// Markup (CSS/layout built in Webflow):
//   [data-logo-wall-cycle-init]                 ← root
//     [data-logo-wall-list]
//       [data-logo-wall-item]                   ← a slot (may be display:none at breakpoints)
//         [data-logo-wall-target-parent]?       ← optional inner wrapper the logo mounts into
//           [data-logo-wall-target]             ← a logo (the pool is cloned from these)
//   Optional attr: data-logo-wall-shuffle="false" to keep the front row in source order.
// -----------------------------------------

let timelines = [];
let scrollTriggers = [];
let visListeners = [];

const hasScrollTrigger = () => typeof ScrollTrigger !== "undefined";

export function initLogoWallCycle(scope) {
  scope = scope || document;

  const loopDelay = 1.5; // Loop Duration
  const duration  = 0.9; // Animation Duration

  scope.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
    const list   = root.querySelector('[data-logo-wall-list]');
    if (!list) return;
    const items  = Array.from(list.querySelectorAll('[data-logo-wall-item]'));

    const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';
    const originalTargets = items
      .map(item => item.querySelector('[data-logo-wall-target]'))
      .filter(Boolean);

    let visibleItems   = [];
    let visibleCount   = 0;
    let pool           = [];
    let pattern        = [];
    let patternIndex   = 0;
    let tl;

    function isVisible(el) {
      return window.getComputedStyle(el).display !== 'none';
    }

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function setup() {
      if (tl) {
        tl.kill();
      }
      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;

      pattern = shuffleArray(
        Array.from({ length: visibleCount }, (_, i) => i)
      );
      patternIndex = 0;

      // remove all injected targets
      items.forEach(item => {
        item.querySelectorAll('[data-logo-wall-target]').forEach(old => old.remove());
      });

      pool = originalTargets.map(n => n.cloneNode(true));

      let front, rest;
      if (shuffleFront) {
        const shuffledAll = shuffleArray(pool);
        front = shuffledAll.slice(0, visibleCount);
        rest  = shuffleArray(shuffledAll.slice(visibleCount));
      } else {
        front = pool.slice(0, visibleCount);
        rest  = shuffleArray(pool.slice(visibleCount));
      }
      pool = front.concat(rest);

      for (let i = 0; i < visibleCount; i++) {
        const parent =
          visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
          visibleItems[i];
        parent.appendChild(pool.shift());
      }

      tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
      tl.call(swapNext);
      tl.play();
      timelines.push(tl); // track for teardown (setup may recreate on resize)
    }

    function swapNext() {
      const nowCount = items.filter(isVisible).length;
      if (nowCount !== visibleCount) {
        setup();
        return;
      }
      if (!pool.length) return;

      const idx = pattern[patternIndex % visibleCount];
      patternIndex++;

      const container = visibleItems[idx];
      const parent =
        container.querySelector('[data-logo-wall-target-parent]') ||
        container.querySelector('*:has(> [data-logo-wall-target])') ||
        container;
      const existing = parent.querySelectorAll('[data-logo-wall-target]');
      if (existing.length > 1) return;

      const current  = parent.querySelector('[data-logo-wall-target]');
      const incoming = pool.shift();

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: "expo.inOut",
          onComplete: () => {
            current.remove();
            pool.push(current);
          }
        });
      }

      gsap.to(incoming, {
        yPercent: 0,
        autoAlpha: 1,
        duration,
        delay: 0.1,
        ease: "expo.inOut"
      });
    }

    setup();

    if (hasScrollTrigger()) {
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onEnter:     () => tl.play(),
        onLeave:     () => tl.pause(),
        onEnterBack: () => tl.play(),
        onLeaveBack: () => tl.pause()
      });
      scrollTriggers.push(st);
    }

    const visHandler = () => (document.hidden ? tl.pause() : tl.play());
    document.addEventListener('visibilitychange', visHandler);
    visListeners.push(visHandler);
  });
}

export function destroyLogoWallCycle() {
  timelines.forEach(tl => { try { tl.kill(); } catch (_) {} });
  timelines = [];

  scrollTriggers.forEach(st => { try { st.kill(); } catch (_) {} });
  scrollTriggers = [];

  visListeners.forEach(handler => document.removeEventListener('visibilitychange', handler));
  visListeners = [];
}
