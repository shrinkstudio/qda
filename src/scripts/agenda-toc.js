// -----------------------------------------
// AGENDA TOC — start-time index rail
// -----------------------------------------
// Builds the left time index from the agenda list's START times only.
// Clones the designer-built template item once per agenda card, fills in
// the time, scrolls to the card on click, highlights the current card on
// scroll. Collapses consecutive duplicate times (e.g. session header +
// its first talk) and skips cards without a time (TBC items).
//
// Markup (built in Webflow):
//   [data-agenda-toc]                 — rail container
//     [data-agenda-toc-template]      — item template (hidden after init)
//       [data-agenda-toc-time]        — element receiving the time text
//   [data-agenda-toc-card]            — each CMS agenda card
//     [data-agenda-toc-times]         — element containing "HH:MM - HH:MM"
//
// Active item gets `is-active` on the cloned toc item — style in Webflow.

let entries = [];
let onScroll = null;
let templateEl = null;

const TIME_RE = /\d{1,2}:\d{2}/;

export function initAgendaToc(scope) {
  scope = scope || document;

  const rail = scope.querySelector('[data-agenda-toc]');
  if (!rail) return;

  templateEl = rail.querySelector('[data-agenda-toc-template]') || rail.firstElementChild;
  if (!templateEl) return;

  const cards = [...scope.querySelectorAll('[data-agenda-toc-card]')];
  let prevTime = null;
  entries = [];

  cards.forEach((card) => {
    const source = card.querySelector('[data-agenda-toc-times]') || card;
    const match = (source.textContent || '').match(TIME_RE);
    if (!match) return;               // no start time (TBC rows) — skip
    const time = match[0];
    if (time === prevTime) return;    // collapse consecutive duplicates
    prevTime = time;

    const item = templateEl.cloneNode(true);
    item.removeAttribute('data-agenda-toc-template');
    const label = item.querySelector('[data-agenda-toc-time]');
    if (label) label.textContent = time;

    const handler = (e) => {
      e.preventDefault();
      const lenis = window.__qdaLenis;
      if (lenis) lenis.scrollTo(card, { offset: -120 });
      else card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    item.addEventListener('click', handler);
    item.style.cursor = 'pointer';

    rail.appendChild(item);
    entries.push({ item, card });
  });

  // Template stays in the DOM (fresh per Barba page) but never displays.
  templateEl.style.display = 'none';

  if (!entries.length) return;

  // Scrollspy — last card whose top has passed 35% of the viewport is active.
  const activate = () => {
    const threshold = window.innerHeight * 0.35;
    let current = -1;
    entries.forEach((entry, i) => {
      if (entry.card.getBoundingClientRect().top <= threshold) current = i;
    });
    entries.forEach((entry, i) => {
      entry.item.classList.toggle('is-active', i === Math.max(current, 0));
    });
  };

  let ticking = false;
  onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      activate();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  activate();
}

export function destroyAgendaToc() {
  if (onScroll) {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    onScroll = null;
  }
  entries = [];
  templateEl = null;
}
