// -----------------------------------------
// NAV — Hide on scroll down, show on scroll up
// Uses Lenis scroll events when available, falls back to native
// -----------------------------------------

let nav = null;
let lastScrollY = 0;
let isHidden = false;
let scrollThreshold = 50; // px of scroll before hiding
let tween = null;
let navResizeObserver = null;

function onScroll({ scroll, direction }) {
  if (!nav) return;

  const currentY = typeof scroll === 'number' ? scroll : window.scrollY;

  // Always show nav at the top of the page
  if (currentY <= scrollThreshold) {
    if (isHidden) showNav();
    lastScrollY = currentY;
    return;
  }

  // direction: 1 = down, -1 = up (Lenis convention)
  if (direction === 1 && !isHidden) {
    hideNav();
  } else if (direction === -1 && isHidden) {
    showNav();
  }

  lastScrollY = currentY;
}

function hideNav() {
  if (!nav || isHidden) return;
  isHidden = true;

  if (typeof gsap !== 'undefined') {
    if (tween) tween.kill();
    tween = gsap.to(nav, {
      yPercent: -100,
      duration: 0.4,
      ease: 'power3.inOut',
    });
  } else {
    nav.style.transform = 'translateY(-100%)';
    nav.style.transition = 'transform 0.4s ease';
  }
}

function showNav() {
  if (!nav || !isHidden) return;
  isHidden = false;

  if (typeof gsap !== 'undefined') {
    if (tween) tween.kill();
    tween = gsap.to(nav, {
      yPercent: 0,
      duration: 0.4,
      ease: 'power3.out',
    });
  } else {
    nav.style.transform = 'translateY(0)';
    nav.style.transition = 'transform 0.4s ease';
  }
}

// Expose nav height as a CSS custom property on :root
function setNavHeightVar() {
  if (!nav) return;
  document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
}

// Native scroll fallback (when Lenis isn't available)
let nativeHandler = null;

function onNativeScroll() {
  const currentY = window.scrollY;
  const direction = currentY > lastScrollY ? 1 : -1;
  onScroll({ scroll: currentY, direction });
}

export function initNavScrollHide(scope) {
  scope = scope || document;
  nav = scope.querySelector('.nav');
  if (!nav) return;

  // Reset state
  lastScrollY = window.scrollY;
  isHidden = false;

  // Clear any leftover transforms from previous page
  if (typeof gsap !== 'undefined') {
    gsap.set(nav, { yPercent: 0 });
  }

  // Set --nav-height CSS variable and watch for changes
  setNavHeightVar();
  navResizeObserver = new ResizeObserver(setNavHeightVar);
  navResizeObserver.observe(nav);

  // Hook into Lenis if available (exposed as module-level `lenis` in transitions.js)
  if (window.TEMPLATE_LENIS_GLOBAL) {
    window.TEMPLATE_LENIS_GLOBAL.on('scroll', onScroll);
  } else {
    // Fallback to native scroll
    nativeHandler = onNativeScroll;
    window.addEventListener('scroll', nativeHandler, { passive: true });
  }
}

export function destroyNavScrollHide() {
  // Reset nav to visible before transition
  if (nav && isHidden) {
    if (typeof gsap !== 'undefined') {
      gsap.set(nav, { yPercent: 0 });
    } else {
      nav.style.transform = '';
      nav.style.transition = '';
    }
  }

  if (tween) {
    tween.kill();
    tween = null;
  }

  // Remove Lenis listener
  if (window.TEMPLATE_LENIS_GLOBAL) {
    window.TEMPLATE_LENIS_GLOBAL.off('scroll', onScroll);
  }

  // Remove native listener
  if (nativeHandler) {
    window.removeEventListener('scroll', nativeHandler);
    nativeHandler = null;
  }

  // Stop watching nav height
  if (navResizeObserver) {
    navResizeObserver.disconnect();
    navResizeObserver = null;
  }

  nav = null;
  isHidden = false;
  lastScrollY = 0;
}
