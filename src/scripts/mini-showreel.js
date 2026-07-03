// -----------------------------------------
// MINI SHOWREEL PLAYER (Flip)
// [data-mini-showreel-open], [data-mini-showreel-lightbox],
// [data-mini-showreel-player], [data-mini-showreel-target],
// [data-mini-showreel-close], [data-mini-showreel-safearea]
// -----------------------------------------

let cleanup = null;

export function initMiniShowreel(scope) {
  scope = scope || document;
  if (typeof gsap === 'undefined' || typeof Flip === 'undefined') return;
  gsap.registerPlugin(Flip);

  const openBtns = scope.querySelectorAll('[data-mini-showreel-open]');
  if (!openBtns.length) return;

  const duration = 1;
  const ease = 'expo.inOut';
  const zIndex = 999;

  let n = '', isOpen = false;
  let lb, pw, tg;
  let pwCss = '', lbZ = '', pwZ = '';

  const q = (sel, root = document) => root.querySelector(sel);

  const getLB = (name) => q(`[data-mini-showreel-lightbox="${name}"]`);
  const getPW = (name) => q(`[data-mini-showreel-player="${name}"]`);

  const safe = (t) => t.closest('[data-mini-showreel-safearea]') || q('[data-mini-showreel-safearea]', t) || t;

  const fit = (b, a) => {
    let w = b.width, h = w / a;
    if (h > b.height) { h = b.height; w = h * a; }
    return {
      left: b.left + (b.width - w) / 2,
      top: b.top + (b.height - h) / 2,
      width: w,
      height: h
    };
  };

  const rectFor = (t) => {
    const b = safe(t).getBoundingClientRect();
    const r = t.getBoundingClientRect();
    const a = r.width > 0 && r.height > 0 ? r.width / r.height : 16 / 9;
    return fit(b, a);
  };

  const place = (el, r) =>
    gsap.set(el, {
      position: 'fixed',
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      margin: 0,
      x: 0,
      y: 0
    });

  function setStatus(status) {
    if (!n) return;
    document.querySelectorAll(`[data-mini-showreel-lightbox="${n}"], [data-mini-showreel-player="${n}"]`).forEach((el) => el.setAttribute('data-mini-showreel-status', status));
  }

  function zOn() {
    lbZ = lb?.style.zIndex || '';
    pwZ = pw?.style.zIndex || '';
    if (lb) lb.style.zIndex = String(zIndex);
    if (pw) pw.style.zIndex = String(zIndex);
  }

  function zOff() {
    if (lb) lb.style.zIndex = lbZ;
    if (pw) pw.style.zIndex = pwZ;
  }

  function playFor(name) {
    var wrap = getPW(name);
    if (!wrap) return;
    var playBtn = wrap.querySelector('[data-vimeo-control="play"]');
    if (playBtn) playBtn.click();
  }

  function stopFor(name) {
    var wrap = getPW(name);
    if (!wrap) return;
    var pauseBtn = wrap.querySelector('[data-vimeo-control="pause"]');
    if (pauseBtn) pauseBtn.click();
  }

  function openBy(name) {
    if (!name || isOpen) return;

    lb = getLB(name);
    pw = getPW(name);
    if (!lb || !pw) return;

    tg = q('[data-mini-showreel-target]', lb);
    if (!tg) return;

    n = name;
    isOpen = true;

    pw.dataset.flipId = n;
    pwCss = pw.style.cssText || '';

    zOn();
    setStatus('active');
    playFor(n);

    const state = Flip.getState(pw);
    place(pw, rectFor(tg));

    Flip.from(state, {
      duration,
      ease,
      absolute: true,
      scale: false
    });
  }

  function closeBy(nameOrEmpty) {
    if (!isOpen || !pw) return;
    if (nameOrEmpty && nameOrEmpty !== n) return;

    stopFor(n);
    setStatus('not-active');

    const state = Flip.getState(pw);

    pw.style.cssText = pwCss;
    if (lb) lb.style.zIndex = String(zIndex);
    if (pw) pw.style.zIndex = String(zIndex);

    Flip.from(state, {
      duration,
      ease,
      absolute: true,
      scale: false,
      onComplete: () => {
        zOff();
        n = '';
        isOpen = false;
        lb = pw = tg = null;
        pwCss = '';
        lbZ = '';
        pwZ = '';
      }
    });
  }

  function onResize() {
    if (!isOpen || !pw || !tg) return;
    place(pw, rectFor(tg));
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeBy('');
  }

  function onCloseClick(e) {
    const closeBtn = e.target.closest('[data-mini-showreel-close]');
    if (!closeBtn) return;
    e.preventDefault();
    closeBy(closeBtn.getAttribute('data-mini-showreel-close') || '');
  }

  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openBy(btn.getAttribute('data-mini-showreel-open') || '');
    });
  });

  document.addEventListener('click', onCloseClick);
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', onResize);

  cleanup = () => {
    document.removeEventListener('click', onCloseClick);
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', onResize);
  };
}

export function destroyMiniShowreel() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
