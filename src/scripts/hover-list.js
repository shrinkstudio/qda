// -----------------------------------------
// HOVER LIST — Flip-powered hover highlight
// -----------------------------------------
// A single background/fill element flips between list items on hover,
// giving a highlight that travels smoothly between nav links.
//
// Markup (CSS/layout built in Webflow):
//   [data-hover-list]                      ← list root (optional — see fallback)
//     [data-hover-item]                    ← each item (one per link)
//       [data-hover-background] > [data-hover-fill]
//       [data-hover-visual]                ← the link; background is flipped into it
//
// Requires the GSAP Flip plugin in the page head:
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/Flip.min.js"></script>
// Without Flip the nav still works — it just no-ops (no highlight).
// -----------------------------------------

let timelines = [];
let listeners = [];

const hasFlip = () => typeof Flip !== "undefined";

export function initHoverList(scope) {
  scope = scope || document;
  if (!hasFlip()) return; // graceful no-op until Flip is loaded
  gsap.registerPlugin(Flip);

  // Root on [data-hover-list]; fall back to the nearest list ancestor shared
  // by the items so it works without the extra wrapper attribute.
  let components = [...scope.querySelectorAll("[data-hover-list]")];
  if (!components.length) {
    const roots = new Set();
    scope.querySelectorAll("[data-hover-item]").forEach((item) => {
      const root = item.closest('[role="list"], ul, ol') || item.parentElement;
      if (root) roots.add(root);
    });
    components = [...roots];
  }

  components.forEach(function (component) {
    if (component.hasAttribute("data-hover-init")) return;
    component.setAttribute("data-hover-init", "");

    const items = component.querySelectorAll("[data-hover-item]");
    if (!items.length) return;

    // Keep a single background to flip around; drop the duplicates.
    component.querySelectorAll("[data-hover-background]").forEach((el, i) => i && el.remove());
    const background = component.querySelector("[data-hover-background]");
    const fill = component.querySelector("[data-hover-fill]");
    if (!background || !fill) return;

    let hoverBetween = false;

    const tl = gsap.timeline({ paused: true, onReverseComplete: () => (hoverBetween = false) });
    tl.fromTo(fill, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 });
    timelines.push(tl);

    function flipInto(item) {
      const state = Flip.getState(background);
      item.querySelector("[data-hover-visual]")?.prepend(background);
      if (hoverBetween) Flip.from(state, { duration: 0.3, ease: "power1.inOut" });
    }

    items.forEach(function (item) {
      const handler = function () {
        flipInto(item);
        hoverBetween = true;
      };
      item.addEventListener("mouseenter", handler);
      listeners.push({ element: item, type: "mouseenter", handler });
    });

    const enterHandler = () => tl.play();
    const leaveHandler = () => tl.reverse();
    component.addEventListener("mouseenter", enterHandler);
    component.addEventListener("mouseleave", leaveHandler);
    listeners.push(
      { element: component, type: "mouseenter", handler: enterHandler },
      { element: component, type: "mouseleave", handler: leaveHandler }
    );
  });
}

export function destroyHoverList() {
  timelines.forEach((tl) => { try { tl.kill(); } catch (_) {} });
  timelines = [];

  listeners.forEach(({ element, type, handler }) => {
    element.removeEventListener(type, handler);
  });
  listeners = [];

  document.querySelectorAll("[data-hover-init]").forEach((el) => {
    el.removeAttribute("data-hover-init");
  });
}
