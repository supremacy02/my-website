// EVAREADY ELECTRICAL - Interactive Backgrounds & Animations
// - Dark starfield background
// - Interactive lightning bolts behind the headline
// - 3D tilt hover on CTAs
// - Preloader and entrance handling

(function() {
  // Global fixed background canvases
  const starCanvas = document.getElementById('bg-stars') || document.getElementById('starfield');
  const lightningCanvas = document.getElementById('bg-lightning') || document.getElementById('lightning');
  const siteBg = document.querySelector('.site-bg');
  const headline = document.getElementById('headline');

  // If canvases are missing, exit gracefully
  if (!starCanvas || !lightningCanvas) return;

  const starCtx = starCanvas.getContext('2d');
  const boltCtx = lightningCanvas.getContext('2d');

  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    // Use viewport for global background
    W = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    H = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    [starCanvas, lightningCanvas].forEach(c => {
      c.width = Math.floor(W * DPR);
      c.height = Math.floor(H * DPR);
      c.style.width = W + 'px';
      c.style.height = H + 'px';
    });
  }

  window.addEventListener('resize', resize);
  resize();

  // Starfield --------------------------------------------------------------
  let stars = [];
  function initStars() {
    const density = Math.floor((W * H) / 5000); // even higher density for strong visibility
    stars = new Array(density).fill(0).map(() => {
      return {
        x: Math.random() * W * DPR,
        y: Math.random() * H * DPR,
        z: Math.random() * 0.6 + 0.4, // depth factor
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.3 + 0.05
      };
    });
  }
  initStars();

  function drawStars(t) {
    starCtx.clearRect(0, 0, W * DPR, H * DPR);
    starCtx.fillStyle = '#0b1020';
    // minimal dark overlay so stars pop
    const grad = starCtx.createRadialGradient(W*DPR/2, H*DPR*0.2, 0, W*DPR/2, H*DPR*0.5, Math.max(W, H)*DPR);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.02)');
    starCtx.fillRect(0,0,W*DPR,H*DPR);

    stars.forEach(s => {
      s.tw += 0.02;
      const twinkle = 0.8 + Math.sin(s.tw) * 0.6; // brighter 0.2..1.4
      const r = (s.z * 2.4 + twinkle * 1.1) * DPR; // larger star radius
      starCtx.beginPath();
      starCtx.arc(s.x, s.y, r, 0, Math.PI * 2);
      const alpha = Math.min(1, 0.7 + 0.8 * twinkle); // higher base/peak alpha
      starCtx.shadowBlur = 10 * DPR; // stronger glow
      starCtx.shadowColor = `rgba(140, 220, 255, ${alpha})`;
      starCtx.fillStyle = `rgba(240, 255, 255, ${alpha})`;
      starCtx.fill();

      // slow parallax drift
      s.x += (s.z - 0.5) * 0.15;
      if (s.x < 0) s.x = W * DPR; else if (s.x > W * DPR) s.x = 0;
    });
  }

  // Lightning --------------------------------------------------------------
  let bolts = [];
  const baseHue = 200; // cyan-blue

  function spawnBolt(sx, sy, ex, ey) {
    const segments = [];
    const dx = ex - sx, dy = ey - sy;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(10, Math.min(40, Math.floor(dist / (12 * DPR))));
    let x = sx, y = sy;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // base line point
      const bx = sx + dx * t;
      const by = sy + dy * t;
      // perpendicular jitter
      const nx = -dy / dist, ny = dx / dist;
      const jitterAmp = (1 - Math.abs(0.5 - t) * 2) * 18 * DPR + 4 * DPR;
      const j = (Math.random() - 0.5) * jitterAmp;
      const px = bx + nx * j;
      const py = by + ny * j;
      segments.push({ x1: x, y1: y, x2: px, y2: py });
      x = px; y = py;
    }
    const life = 180 + Math.random() * 120; // ms
    bolts.push({ segments, life, alpha: 1 });
    // flash is handled globally via flashSiteBg()
  }

  function renderBolts(dt) {
    // do not darken the background at all; clear the lightning canvas each frame
    boltCtx.globalCompositeOperation = 'source-over';
    boltCtx.clearRect(0, 0, W * DPR, H * DPR);

    bolts = bolts.filter(b => (b.life -= dt) > 0);

    // draw bolts in additive mode so they brighten the scene
    boltCtx.globalCompositeOperation = 'lighter';
    bolts.forEach(b => {
      const a = Math.max(0, b.life / 250);
      boltCtx.lineWidth = 2.2 * DPR;
      boltCtx.strokeStyle = `hsla(${baseHue}, 100%, 65%, ${a})`;
      boltCtx.shadowBlur = 14 * DPR;
      boltCtx.shadowColor = `hsla(${baseHue}, 100%, 70%, ${a})`;
      boltCtx.beginPath();
      b.segments.forEach(seg => {
        boltCtx.moveTo(seg.x1, seg.y1);
        boltCtx.lineTo(seg.x2, seg.y2);
      });
      boltCtx.stroke();

      // core glow
      boltCtx.lineWidth = 0.8 * DPR;
      boltCtx.strokeStyle = `hsla(${baseHue + 10}, 100%, 95%, ${a})`;
      boltCtx.shadowBlur = 30 * DPR;
      boltCtx.beginPath();
      b.segments.forEach(seg => {
        boltCtx.moveTo(seg.x1, seg.y1);
        boltCtx.lineTo(seg.x2, seg.y2);
      });
      boltCtx.stroke();
    });
  }

  // Compute a target point: headline center if present, else viewport center
  function computeTargetPoint() {
    if (headline) {
      const rect = headline.getBoundingClientRect();
      const cx = (rect.left + rect.right) / 2 + (Math.random() - 0.5) * rect.width * 0.25;
      const cy = (rect.top + rect.bottom) / 2 + (Math.random() - 0.5) * rect.height * 0.4;
      return { x: cx * DPR, y: cy * DPR };
    }
    return { x: (W * DPR) / 2, y: (H * DPR) / 2 };
  }

  // Automatic lightning scheduler (mobile-friendly, no mouse needed)
  function randomStartPoint() {
    // choose a random point along top or sides
    const edge = Math.random();
    if (edge < 0.6) {
      // top
      return { x: Math.random() * W * DPR, y: 0 };
    } else if (edge < 0.8) {
      // left
      return { x: 0, y: Math.random() * H * DPR * 0.6 };
    } else {
      // right
      return { x: W * DPR, y: Math.random() * H * DPR * 0.6 };
    }
  }

  // Flash helper for global bg
  function flashSiteBg() {
    if (!siteBg) return;
    siteBg.classList.add('flash');
    setTimeout(() => siteBg.classList.remove('flash'), 250);
  }

  function autoStrikeSequence() {
    const { x: sx, y: sy } = randomStartPoint();
    const { x: ex, y: ey } = computeTargetPoint();
    spawnBolt(sx, sy, ex, ey);
    flashSiteBg();
    // occasional branch
    if (Math.random() < 0.6) {
      setTimeout(() => {
        spawnBolt(sx + (Math.random()-0.5)*60*DPR, sy + (Math.random()-0.5)*60*DPR, ex, ey);
      }, 70 + Math.random()*120);
    }
    scheduleNextStrike();
  }

  function scheduleNextStrike() {
    const nextIn = 1200 + Math.random() * 2400; // 1.2s to 3.6s
    clearTimeout(scheduleNextStrike._t);
    scheduleNextStrike._t = setTimeout(autoStrikeSequence, nextIn);
  }

  // Animation loop ---------------------------------------------------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last); // cap delta to keep stable
    last = now;
    drawStars(now);
    renderBolts(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  scheduleNextStrike();

  // 3D Tilt for elements with [data-tilt] ---------------------------------
  const tiltEls = Array.from(document.querySelectorAll('[data-tilt]'));
  tiltEls.forEach(el => {
    const strength = 12; // degrees
    let rect;
    function updateRect() { rect = el.getBoundingClientRect(); }
    updateRect();
    window.addEventListener('resize', updateRect);

    el.addEventListener('mousemove', (e) => {
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = (+py * strength).toFixed(2);
      const ry = (-px * strength).toFixed(2);
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });

  // Preloader and entrance animations -------------------------------------
  function ready() {
    document.body.classList.add('loaded');
  }
  // Use both DOMContentLoaded and load to ensure visuals ready
  window.addEventListener('load', ready);

  // Mobile hamburger menu ---------------------------------------------------
  (function initMobileMenu() {
    const burger = document.querySelector('.burger');
    const menu = document.getElementById('mobile-menu');
    if (!burger || !menu) return;

    let lastFocused = null;

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function getFocusable() {
      return Array.from(menu.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null);
    }

    function openMenu() {
      lastFocused = document.activeElement;
      burger.setAttribute('aria-expanded', 'true');
      menu.removeAttribute('hidden');
      document.body.classList.add('menu-open');
      const first = getFocusable()[0];
      if (first) first.focus();
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onDocumentClick, true);
    }

    function closeMenu() {
      burger.setAttribute('aria-expanded', 'false');
      if (!menu.hasAttribute('hidden')) menu.setAttribute('hidden', '');
      document.body.classList.remove('menu-open');
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocumentClick, true);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        burger.focus();
      }
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function onDocumentClick(e) {
      // Close when clicking outside the inner panel
      const inner = menu.querySelector('.mobile-menu-inner');
      if (!inner) return;
      if (!inner.contains(e.target) && !burger.contains(e.target)) {
        closeMenu();
      }
    }

    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(); else openMenu();
    });

    // Close menu on link click inside the menu for smooth UX
    menu.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link) {
        // Allow anchor navigation then close
        setTimeout(closeMenu, 0);
      }
    });

    // Ensure menu resets on resize up to desktop
    window.addEventListener('resize', () => {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      if (vw >= 768) {
        closeMenu();
      }
    });
  })();

})();
