/* ============================================================================
   THE DIGITAL FRONT — interactions
   - Lenis smooth scroll
   - GSAP ScrollTrigger: pin the stage + scrub a cross-fade through the cards
   - Custom scramble-decode text reveal on each card's activation
   - Pop-up nav (appears past the hero), active-section + jump-to
   - Auto-rotating testimonials, mobile menu, Lucide icons
   - Degrades gracefully: no JS / no GSAP / reduced-motion / mobile => plain scroll
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAV_H = 68;

  var App = { lenis: null, st: null, cards: [], N: 0, animated: false };

  /* ---------- Lucide icons ---------- */
  function initIcons() { try { if (window.lucide) window.lucide.createIcons(); } catch (e) {} }

  /* ---------- Smooth scroll (Lenis) ---------- */
  function initLenis() {
    if (prefersReduced || App.lenis) return;
    if (!window.Lenis) {                 // CDN not ready yet — try again once everything has loaded
      window.addEventListener('load', initLenis, { once: true });
      return;
    }
    try {
      var isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      var lenis = new window.Lenis({
        lerp: 0.09,           // wheel smoothing — HIGHER = snappier, more responsive glide (Lenis default .1).
                              // (Lenis ignores `duration` whenever lerp is set, so this controls the wheel feel.)
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        wheelMultiplier: 0.7,  // distance moved per wheel notch (default 1). Tuned for a natural scroll
                               // pace — quick enough to feel normal, still gentle on the scrubbed card
                               // animations (the earlier 0.3 felt sluggish).
        autoRaf: false,       // WE drive lenis.raf (gsap ticker below, or the rAF fallback). Without this
                              // Lenis ALSO runs its own rAF with performance.now() while the ticker feeds it
                              // gsap-time — two clocks fighting => corrupted deltas => scroll stalls/lags.
        // Touch screens: take over touch scrolling and DAMP the fling. Native OS momentum
        // let one aggressive flick sail through several pinned 100vh cards; with syncTouch
        // the drag stays 1:1 under the finger, but the released glide is ~1/3 as long and
        // settles smoothly, so a hard swipe advances about one card instead of four.
        syncTouch: isTouch,
        touchMultiplier: 0.95,         // touch drag distance — near 1:1, natural finger tracking
                                       // (scaled up with wheelMultiplier so touch matches the desktop pace)
        touchInertiaMultiplier: 14,    // fling glide distance (Lenis default 35) — natural but still short enough that a hard swipe doesn't blast through pinned cards
        syncTouchLerp: 0.1             // snappier catch-up to the finger
      });
      App.lenis = lenis;
      window.__lenis = lenis;            // exposed for debugging
      // Lenis owns smoothness, so native CSS smooth-scroll must be off on the scroller. The
      // `html.has-anim { scroll-behavior: auto }` rule loses the cascade for scroll-behavior on the root
      // (a known root-element quirk), so enforce it inline here where it's guaranteed to win.
      doc.style.scrollBehavior = 'auto';
      if (window.gsap && window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (e) { App.lenis = null; }
  }

  function scrollToY(y) {
    // a slower, natural glide to section targets (easeInOutCubic) instead of a near-instant jump
    if (App.lenis) App.lenis.scrollTo(y, { duration: 1.7, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } });
    else window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  /* ---------- Scramble-decode text reveal ---------- */
  var SCR = '!<>-_\\/[]{}=+*^?#:.';
  function scrambleEl(el, duration) {
    var target = el.getAttribute('data-text');
    if (target === null) { target = el.textContent; el.setAttribute('data-text', target); }
    var len = target.length;
    var start = performance.now();
    var token = (el.__t = (el.__t || 0) + 1);
    function frame(now) {
      if (el.__t !== token) return;                 // a newer scramble took over
      var p = Math.min(1, (now - start) / duration);
      var settled = Math.floor(p * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        var c = target.charAt(i);
        if (c === ' ' || i < settled) out += c;
        else out += SCR.charAt((Math.random() * SCR.length) | 0);
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }
  /* ---------- Typewriter text reveal ---------- */
  function typeEl(el, speed) {
    var target = el.getAttribute('data-text');
    if (target === null) { target = el.textContent; el.setAttribute('data-text', target); }
    var len = target.length;
    var start = performance.now();
    var token = (el.__t = (el.__t || 0) + 1);
    el.textContent = '';
    var on = document.createElement('span');    on.className = 'tw-on';
    var caret = document.createElement('span'); caret.className = 'tw-caret'; caret.setAttribute('aria-hidden', 'true');
    var off = document.createElement('span');   off.className = 'tw-off';     // reserves the full width so the line never re-centers mid-type
    el.appendChild(on); el.appendChild(caret); el.appendChild(off);
    var last = -1;
    function frame(now) {
      if (el.__t !== token) return;                 // a newer reveal took over
      var chars = Math.min(len, Math.floor((now - start) / speed));
      if (chars !== last) { last = chars; on.textContent = target.slice(0, chars); off.textContent = target.slice(chars); }
      if (chars < len) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function scrambleCard(card) {
    var els = card.querySelectorAll('.js-scramble');
    var vis = 0;
    for (var i = 0; i < els.length; i++) {
      if (els[i].offsetParent === null) continue;   // skip hidden elements (e.g. removed kicker labels)
      (function (el, delay) {
        setTimeout(function () { scrambleEl(el, 460); }, delay);
      })(els[i], vis * 90);
      vis++;
    }
    var typers = card.querySelectorAll('.js-type');   // typewriter reveal (e.g. the "What we build" opener)
    for (var k = 0; k < typers.length; k++) {
      if (typers[k].offsetParent === null) continue;
      typeEl(typers[k], 48);
    }
  }

  /* ---------- Pop-up nav: visibility + active + jump links ---------- */
  function moveNavIndicator(active) {
    var ind = document.querySelector('.nav__indicator');
    if (!ind) return;
    if (!active) { ind.style.opacity = '0'; ind.style.width = '0px'; return; }
    ind.style.opacity = '1';
    ind.style.width = active.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }
  function setActiveNav(key) {
    var links = document.querySelectorAll('.nav__links [data-jump]');
    var active = null;
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute('data-jump') === key;
      links[i].classList.toggle('is-active', on);
      if (on) active = links[i];
    }
    moveNavIndicator(active);
  }

  function initNav() {
    var nav = document.querySelector('[data-nav]');
    var hero = document.querySelector('.hero');
    var hud = document.querySelector('[data-hud]');
    var stageEl = document.querySelector('.stage');
    if (nav && hero) {
      var onScroll = function () {
        // nav + HUD live only inside the pinned stage: they appear once the hero is
        // scrolled away and vanish once you pass the last card (return on the way back up).
        var past = window.scrollY >= hero.offsetHeight - 2;                              // hero scrolled away
        var beforeEnd = true;
        if (App.animated && stageEl) {
          var stageBottom = stageEl.getBoundingClientRect().top + window.scrollY + stageEl.offsetHeight;
          beforeEnd = window.scrollY < stageBottom - window.innerHeight - 2;             // still within the stage
        }
        var inStage = past && beforeEnd;
        nav.classList.toggle('is-visible', inStage);
        // the active-section highlight is owned by the stage timelines, so don't clear it here
        if (hud) hud.classList.toggle('is-visible', App.animated && inStage);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // jump-to handling (works in both pinned and fallback modes)
    var jumpers = document.querySelectorAll('[data-jump]');
    for (var i = 0; i < jumpers.length; i++) {
      jumpers[i].addEventListener('click', function (e) {
        e.preventDefault();
        if (window.__closeMenu) window.__closeMenu();
        var key = this.getAttribute('data-jump');
        scrollToY(targetFor(key));
      });
    }
  }

  function targetFor(key) {
    if (key === 'top') return 0;
    if (key === 'start') return offsetOf('#start');
    if (key === 'quotes') return offsetOf('#quotes');

    // section keys: do / build / work — land on the section's FIRST card, where its content
    // is revealed (the card's stored ScrollTrigger gives the exact band; works for every section).
    var firstCard = document.querySelector('[data-card][data-section="' + key + '"]');
    if (!firstCard) return 0;
    if (App.animated && firstCard.__st) {
      var s = firstCard.__st;
      // Land where the card's content is fully revealed and held. The duo (01) stores an exact
      // hold time (both cards in, before the exit); derive the scroll fraction from the timeline's
      // own duration so it stays correct if the animation timing changes. Others land mid-card.
      var f = 0.5;
      if (firstCard.__landTime != null && s.animation && s.animation.duration) {
        f = firstCard.__landTime / s.animation.duration();
      }
      return s.start + (s.end - s.start) * f;
    }
    var cardTop = firstCard.getBoundingClientRect().top + window.scrollY;
    return cardTop - NAV_H + 2;
  }
  function offsetOf(sel) {
    var el = document.querySelector(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY - NAV_H + 2 : 0;
  }

  /* ---------- The pinned stage — per-card full-screen TAKEOVER ----------
     Each card pins to the viewport (start "top top", end "bottom top", scrub),
     its content rises up + fades in, holds, then drifts up + fades out as the
     next card takes over. The shared bg layer swaps color per section.
     (Desktop + fine-pointer only; mobile/reduced-motion fall back to flow.) */
  function initStage() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    App.cards = cards; App.N = cards.length;

    var hudTotal = document.querySelector('[data-hud-total]');
    if (hudTotal) hudTotal.textContent = String(cards.length);

    if (!gsap || !ST || prefersReduced) { return; }   // fallback: CSS shows cards in flow
    gsap.registerPlugin(ST);

    var stageBg = document.querySelector('[data-stage-bg]');
    var hudSection = document.querySelector('[data-hud-section]');
    var hudIdx = document.querySelector('[data-hud-idx]');
    var SECTION_NAME = { do: 'What we do', build: 'What we build', work: 'How we work' };
    var SECTION_COLOR = { do: '#1E2C40', build: '#2A3C56', work: '#1E2C40' };
    var EASE = 'power2.inOut';

    // per-section totals for the HUD "01 / 04" counter
    var secCount = {};
    for (var c0 = 0; c0 < cards.length; c0++) {
      var s0 = cards[c0].getAttribute('data-section');
      secCount[s0] = (secCount[s0] || 0) + 1;
    }

    // Keep Lenis' scroll height in sync with the pin-spacers ScrollTrigger adds
    // *after* Lenis first measures — else Lenis caches a too-short height and the
    // lower cards become unreachable with smooth scroll on.
    ST.addEventListener('refresh', function () { if (App.lenis) App.lenis.resize(); alignGrids(); });

    function toArr(nl) { return Array.prototype.slice.call(nl); }
    function keep(a) { return a.filter(function (x) { return !!x; }); }

    // Mask / clip reveal: wrap an element's content in an inner that slides inside an
    // overflow:hidden box, so the line "emerges from behind a hidden edge".
    function maskWrap(el) {
      if (!el) return null;
      if (el.__mi) return el.__mi;
      var inner = document.createElement('span');
      inner.className = 'msk__i';
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add('msk');
      el.__mi = inner;
      return inner;
    }
    // STAGE 1 — the "card" visual, in FIRST.
    // (a) content-mask clip (content slides inside an overflow:hidden box): the step numeral
    function cardMaskOf(card) {
      if (card.classList.contains('card--step')) return keep([card.querySelector('.card__index')]);
      return [];
    }
    // (b) the case showcase fades + rises in (NOT clipped — its phone overhangs the box, so no mask)
    function heroOf(card) {
      return card.classList.contains('card--case') ? card.querySelector('.showcase') : null;
    }
    // (b) clip-path wipe of a whole panel (bg + border + content): the duo's two cards, the "next" CTA card
    function cardClipOf(card) {
      if (card.classList.contains('card--duo'))  return toArr(card.querySelectorAll('.do-card'));
      if (card.classList.contains('card--next')) return keep([card.querySelector('.next-card')]);
      return [];
    }
    // STAGE 2 — the TEXT (title + copy) that clip-reveals AFTER the card, with a quick gap
    function maskTargetsOf(card) {
      if (card.classList.contains('card--duo'))       return toArr(card.querySelectorAll('.do-card__title, .do-card__tagline, .do-card .card__list li'));   // title, tagline AND every bullet all use the mask reveal
      if (card.classList.contains('card--statement')) return keep([card.querySelector('.statement__title')]);
      if (card.classList.contains('card--case'))      return keep([card.querySelector('.case__title'), card.querySelector('.case__desc')]);
      if (card.classList.contains('card--next'))      return keep([card.querySelector('.next-card__kicker'), card.querySelector('.next-card__title'), card.querySelector('.next-card__desc')]);
      if (card.classList.contains('card--step'))      return keep([card.querySelector('.card__title'), card.querySelector('.card__desc')]);
      return [];
    }
    // supporting content that does the softer (un-clipped) rise + fade
    function liftsOf(card) {
      if (card.classList.contains('card--next')) return keep([card.querySelector('.next-card .btn')]);
      return [];
    }

    var curSection = null;
    function setActive(section, secIdx) {
      if (section !== curSection) {
        curSection = section;
        if (stageBg) gsap.to(stageBg, { backgroundColor: SECTION_COLOR[section], duration: 0.5, ease: 'power2.out' });
        if (hudSection) hudSection.textContent = SECTION_NAME[section];
        setActiveNav(section);
      }
      if (hudIdx) hudIdx.textContent = ('0' + secIdx).slice(-2);
      if (hudTotal) hudTotal.textContent = ('0' + secCount[section]).slice(-2);
    }

    // wrap every mask target once (permanent DOM; only the desktop timeline animates the
    // inner, so mobile / reduced-motion just show them at rest)
    cards.forEach(function (card) {
      card.__masks     = maskTargetsOf(card).map(maskWrap);   // stage-2 text inners
      card.__cardMasks = cardMaskOf(card).map(maskWrap);      // stage-1 visual inners (content-mask)
      card.__cardClips = cardClipOf(card);                    // stage-1 panels (clip-path wipe)
    });

    var mm = gsap.matchMedia();
    mm.add('(min-width: 1px)', function () {   // every screen — phone/tablet/desktop, touch included (reduced-motion already fell back above)
      doc.classList.add('has-anim');
      App.animated = true;
      if (stageBg) stageBg.style.backgroundColor = SECTION_COLOR[cards[0].getAttribute('data-section')];

      var ctx = gsap.context(function () {
        var seen = {};
        cards.forEach(function (card, i) {
          var section = card.getAttribute('data-section');
          seen[section] = (seen[section] || 0) + 1;
          var secIdx = seen[section];
          var isLast = i === cards.length - 1;

          var ghosts    = toArr(card.querySelectorAll('.card__ghost, .case__word'));
          var isStatement = card.classList.contains('card--statement');
          var ghostDrift = 130;   // non-statement ghosts (03 step words): fixed px drift
          var lifts     = liftsOf(card);
          var hero      = heroOf(card);              // the case showcase (container; its devices carry the reveal)
          var devWraps  = toArr(card.querySelectorAll('.dev-rv'));    // case: every device MASK wrapper (clips + float + shadow)
          var devPhones = devWraps.filter(function (w) { return w.classList.contains('dev-rv--phone'); });
          var devDesks  = devWraps.filter(function (w) { return !w.classList.contains('dev-rv--phone'); });   // browsers (primary + any mini)
          var framesIn  = function (list) { return list.map(function (w) { return w.querySelector('.frame'); }).filter(Boolean); };   // the frames that slide up from behind their mask edge
          var devSeq    = devDesks.concat(devPhones);   // per-device order: desktops/tablet, then phones. Reveal walks it; exit walks it in reverse — so each element appears AND leaves on its own.
          var more      = card.querySelector('.case__more');           // optional "See more" portfolio link (AI Videos case only)
          var textMasks = card.__masks || [];        // stage-2 text inners
          var cardMasks = card.__cardMasks || [];    // stage-1 visual inners (content-mask)
          var cardClips = card.__cardClips || [];    // stage-1 panels (clip-path wipe)
          var hasCard   = (cardMasks.length + cardClips.length) > 0 || !!hero;
          var textAt    = hasCard ? 0.3 : 0;         // text follows the card with a quick gap (< the 0.6 reveal)
          var sameTiming = card.classList.contains('card--duo');   // 01's two cards reveal in sync (no stagger)
          var leadIn    = 0.35;                       // pause after the card pins before it reveals, so the next card doesn't start the instant the last finishes

          // initial hidden state — card visuals hidden; text pushed below its mask
          if (cardClips.length) gsap.set(cardClips, { clipPath: 'inset(0% 0% 100% 0%)' });   // collapsed to the top edge
          if (cardMasks.length) gsap.set(cardMasks, { opacity: 0, y: '100%' });
          if (hero) {           // case: mask wrappers (shadow) hidden; frames sit fully below their mask edge
            if (devWraps.length) gsap.set(devWraps, { opacity: 0 });
            var allFrames = framesIn(devWraps);
            if (allFrames.length) gsap.set(allFrames, { y: '100%' });
            if (more) gsap.set(more, { opacity: 0, y: 16 });
          }
          if (ghosts.length)    gsap.set(ghosts,    { opacity: 0 });
          if (lifts.length)     gsap.set(lifts,     { opacity: 0, y: 52 });
          if (textMasks.length) gsap.set(textMasks, { opacity: 0, y: '100%' });

          var tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              pin: card,
              pinSpacing: isLast,   // tight (no spacer) between cards; keep the last card's spacer so Testimonials sits below the stage
              // the pinned card is the source of truth for the active section + bg
              onUpdate: function (self) {
                setActive(section, secIdx);
                if (!ghosts.length) return;
                if (isStatement) {
                  // "Range" is centred by CSS (inset:0 + margin:auto), so the drift is a pure translateY.
                  // Rise = a % of the word's OWN height → identical look on every screen size.
                  gsap.set(ghosts, { yPercent: -self.progress * 30 });
                } else {
                  gsap.set(ghosts, { y: -self.progress * ghostDrift });   // 03 step words: fixed px drift
                }
              }
            }
          });
          card.__st = tl.scrollTrigger;   // used by the nav jump-to (land at the section's first card)

          // reveal — the CARD visual in FIRST; the TEXT then clips up a beat later
          if (card.classList.contains('card--duo')) {
            // 01 "What we do": the two cards reveal in sequence, and INSIDE each card every element —
            // title, tagline, then each bullet — appears one after another (its own staggered reveal).
            card.__landTime = 1.8;   // both cards fully revealed + held here → nav jump-to lands on the complete layout
            toArr(card.querySelectorAll('.do-card')).forEach(function (dc, di) {
              var at = leadIn + di * 0.5;   // di=1 (Websites) begins ~when AI Videos has revealed
              // every element — title, tagline, then each bullet — uses the SAME mask reveal
              // (its inner slides up from behind a hidden edge), one after another.
              var inners = toArr(dc.querySelectorAll('.do-card__title, .do-card__tagline, .card__list li'))
                             .map(function (el) { return el.__mi; }).filter(Boolean);
              tl.to(dc, { ease: EASE, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4 }, at);
              if (inners.length) tl.to(inners, { ease: EASE, y: '0%', opacity: 1, duration: 0.32, stagger: 0.045 }, at + 0.15);
            });
          } else if (card.classList.contains('card--case')) {
            // 02 case: TEXT first, then DESKTOP, then PHONE LAST — each device is a true MASK REVEAL
            // (wrapper unhides its shadow; the frame slides y:100%→0% up from behind the wrapper's edge).
            if (textMasks.length) tl.to(textMasks, { ease: EASE, y: '0%', opacity: 1, duration: 0.4, stagger: { amount: 0.06, from: 'start' } }, leadIn);
            // each device reveals on its own, one after another (mask: frame slides up + wrapper fades in)
            devSeq.forEach(function (w, di) {
              var at = leadIn + 0.3 + di * 0.2;
              var f = w.querySelector('.frame');
              tl.to(w, { ease: EASE, opacity: 1, duration: 0.45 }, at);
              if (f) tl.to(f, { ease: EASE, y: '0%', duration: 0.45 }, at);
            });
            if (more)             tl.to(more, { ease: EASE, opacity: 1, y: 0, duration: 0.4 }, leadIn + 0.5);            // "See more" link fades up with the foot
          } else {
            if (cardClips.length) tl.to(cardClips, { ease: EASE, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, stagger: { amount: 0.08, from: 'start' } }, leadIn);
            if (cardMasks.length) tl.to(cardMasks, { ease: EASE, y: '0%', opacity: 1, duration: 0.55 }, leadIn);
            if (hero)             tl.to(hero,      { ease: EASE, opacity: 1, y: 0, duration: 0.55 }, leadIn);
            if (textMasks.length) tl.to(textMasks, { ease: EASE, y: '0%', opacity: 1, duration: 0.5, stagger: { amount: 0.06, from: 'start' } }, leadIn + textAt);
            if (lifts.length)     tl.to(lifts,     { ease: EASE, y: 0, opacity: 1, duration: 0.5, stagger: { amount: 0.06, from: 'start' } }, leadIn + textAt + 0.04);
          }
          // The "Range" ghost reveals at the SAME time as the statement title (both at leadIn) so
          // they appear together as one unit. Other cards' ghosts keep their gentle fade at leadIn.
          if (ghosts.length) {
            var ghostStatement = card.classList.contains('card--statement');
            tl.to(ghosts, { ease: EASE, opacity: ghostStatement ? 0.08 : 0.06, duration: 0.5 }, leadIn);
          }

          // exit — text leaves first, then the card visual, handing off to the next card.
          // Skipped on the last card so it stays put and unpins cleanly into Testimonials.
          if (!isLast && card.classList.contains('card--duo')) {
            // 01 exit: each element leaves on its own, IN ORDER (mirroring its staggered entrance),
            // then the card panel wipes shut — same per-element sequencing as the reveal.
            toArr(card.querySelectorAll('.do-card')).forEach(function (dc, di) {
              var xat = 2.0 + di * 0.18;   // hold both cards fully shown, THEN exit — AI Videos first, then Websites
              // each element's mask inner slides up behind its hidden edge (mirror of the reveal), in order
              var inners = toArr(dc.querySelectorAll('.do-card__title, .do-card__tagline, .card__list li'))
                             .map(function (el) { return el.__mi; }).filter(Boolean);
              if (inners.length) tl.to(inners, { ease: EASE, y: '-100%', opacity: 0, duration: 0.28, stagger: 0.03 }, xat);
              tl.to(dc, { ease: EASE, clipPath: 'inset(0% 0% 100% 0%)', duration: 0.3 }, xat + 0.34);
            });
          } else if (!isLast) {
            if (textMasks.length) tl.to(textMasks, { ease: EASE, y: '-100%', opacity: 0, duration: 0.3, stagger: { amount: sameTiming ? 0 : 0.04, from: 'start' } }, 1.65);
            if (more)             tl.to(more,      { ease: EASE, y: -16, opacity: 0, duration: 0.3 }, 1.65);
            if (lifts.length)     tl.to(lifts,     { ease: EASE, y: -90, opacity: 0, duration: 0.3, stagger: { amount: sameTiming ? 0 : 0.04, from: 'start' } }, 1.65);
            if (ghosts.length)    tl.to(ghosts,    { ease: EASE, opacity: 0, duration: 0.3 }, 1.67);
            if (cardMasks.length) tl.to(cardMasks, { ease: EASE, y: '-100%', opacity: 0, duration: 0.3 }, 1.7);
            // case: each device CONCEALS the same (mirrored) way it revealed — its frame slides
            // back down behind its mask edge and the wrapper fades. Reverse order of the reveal:
            // phones first (they arrived last), then desktops/tablet. So entry and exit match,
            // each element on its own — not the whole showcase moving as one block.
            if (card.classList.contains('card--case')) {
              // each device conceals on its own, in REVERSE of the reveal order (last in, first out) —
              // the same mask animation played backwards: frame slides back down + wrapper fades out.
              devSeq.slice().reverse().forEach(function (w, di) {
                var at = 1.6 + di * 0.2;
                var f = w.querySelector('.frame');
                tl.to(w, { ease: EASE, opacity: 0, duration: 0.45 }, at);
                if (f) tl.to(f, { ease: EASE, y: '100%', duration: 0.45 }, at);
              });
            } else if (hero) {
              tl.to(hero,      { ease: EASE, opacity: 0, y: -80, duration: 0.3 }, 1.7);
            }
            if (cardClips.length) tl.to(cardClips, { ease: EASE, clipPath: 'inset(0% 0% 100% 0%)', duration: 0.3, stagger: { amount: sameTiming ? 0 : 0.04, from: 'start' } }, 1.7);
          }
        });
      }, document.querySelector('.stage'));

      setActive(cards[0].getAttribute('data-section'), 1);   // first paint

      return function () {            // cleanup when leaving the desktop breakpoint
        doc.classList.remove('has-anim');
        App.animated = false;
        curSection = null;
        ctx.revert();
        if (stageBg) stageBg.style.backgroundColor = '';
        cards.forEach(function (cc) { cc.style.cssText = ''; });
      };
    });
  }

  /* ---------- Testimonials — simple, reliable auto-rotating carousel ----------
     Deliberately minimal: one chained timeout advances the active quote every
     INTERVAL, and the active bar's fill animation restarts in the exact same call
     — the two can never drift apart or get stranded. The rotation always runs (no
     scroll gating, no hover/focus pausing: every past "stuck carousel" bug came
     from one of those latching). Click a bar to jump; the timer resets. Words
     REST at full opacity and only dip-and-relight as a pure enhancement on each
     swap, so the text can never be left dim. Reduced-motion: no autoplay, no
     stagger, full bar. Quotes render fully without JS. */
  function initTestimonials() {
    var fig = document.querySelector('[data-quotes]');
    if (!fig) return;
    var quotes = Array.prototype.slice.call(fig.querySelectorAll('[data-quote]'));
    var barsWrap = fig.querySelector('[data-quote-bars]');
    if (!quotes.length) return;

    var INTERVAL = 4000;
    var i = 0, timer = null;
    var gsap = window.gsap;

    // Wrap each word in a .qw span (for the stagger-in); <em> children keep the
    // serif-italic emphasis. The spans rest at opacity 1 — see header comment.
    function wrapWords(q) {
      var note = q.getAttribute('data-note');
      var parts = [];
      Array.prototype.forEach.call(q.childNodes, function (node) {
        var em = node.nodeType === 1 && /^em$/i.test(node.nodeName);
        (node.textContent || '').split(/\s+/).forEach(function (w) { if (w) parts.push({ w: w, em: em }); });
      });
      q.textContent = '';
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        var s = document.createElement('span');
        s.className = 'qw' + (p.em ? ' df-em' : '');
        s.textContent = p.w + ' ';
        frag.appendChild(s);
      });
      if (note) {
        var n = document.createElement('span');
        n.className = 'qw qw--note';
        n.textContent = '(' + note + ')';
        frag.appendChild(n);
      }
      q.appendChild(frag);
    }
    quotes.forEach(wrapWords);

    // Click-to-jump progress bars (one per quote).
    var bars = quotes.map(function (q, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'quotes__bar';
      b.setAttribute('aria-label', 'Show testimonial ' + (k + 1) + ' of ' + quotes.length);
      var fill = document.createElement('span'); fill.className = 'quotes__fill';
      b.appendChild(fill);
      b.addEventListener('click', function () { show(k); });
      barsWrap.appendChild(b);
      return b;
    });

    // Enhancement only: dip the words and relight them left-to-right. Ends at 1,
    // and the rest state is already 1, so a missing/failed tween changes nothing.
    function stagger(q) {
      if (prefersReduced || !gsap) return;
      gsap.fromTo(q.querySelectorAll('.qw:not(.qw--note)'),
        { opacity: .16 },
        { opacity: 1, duration: .45, ease: 'power2.out', stagger: .035, overwrite: true });
    }

    function paintBars() {
      bars.forEach(function (b, k) {
        b.classList.toggle('is-active', k === i);
        var fill = b.firstChild;
        fill.style.animation = 'none';
        void fill.offsetWidth;                                  // reflow so the fill restarts from 0
        if (k !== i) return;
        if (prefersReduced) { fill.style.transform = 'scaleX(1)'; return; }
        fill.style.animation = 'tw-progress ' + INTERVAL + 'ms linear forwards';
      });
    }

    // The ONE driver: activate quote n, restart its bar, re-arm the timer.
    function show(n) {
      if (timer) { clearTimeout(timer); timer = null; }
      quotes[i].classList.remove('is-active');
      i = (n + quotes.length) % quotes.length;
      quotes[i].classList.add('is-active');
      stagger(quotes[i]);
      paintBars();
      if (!prefersReduced && quotes.length > 1) {
        timer = setTimeout(function () { show(i + 1); }, INTERVAL);
      }
    }

    // A backgrounded tab throttles timers and pauses CSS animations out of sync —
    // on return, restart the current slot so bar and timer line up again.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') show(i);
    });

    show(0);
  }


  /* ---------- Showcase videos — load + play ONLY while on screen ----------
     The clips are preload="none" with no autoplay attribute, so nothing downloads until a card is
     near the viewport. The observer calls play() (which triggers the load) just before a card scrolls
     in, and pauses on the way out. This keeps the network quiet on the video-less sections — otherwise
     the six autoplay/looping clips hold media connections open and the browser shows "loading" forever.
     Muted + playsinline so JS-driven play is always allowed. */
  function initVideos() {
    var vids = Array.prototype.slice.call(document.querySelectorAll('.frame__screen video'));
    if (!vids.length) return;
    vids.forEach(function (v) { v.muted = true; });   // belt-and-suspenders for autoplay policy
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (!('IntersectionObserver' in window)) { vids.forEach(play); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
    }, { threshold: 0.1, rootMargin: '300px 0px' });   // start loading a touch before the card arrives
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ---------- Back to top ---------- */
  function initBackTop() {
    var btn = document.querySelector('[data-backtop]');
    if (!btn) return;
    function sync() {
      btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
      // the stage HUD counter owns the same corner while the pinned story runs — lift clear of it
      btn.classList.toggle('is-raised', !!document.querySelector('.stage__hud.is-visible'));
    }
    btn.addEventListener('click', function () { scrollToY(0); });
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    // scroll events can fire before ScrollTrigger toggles the HUD's class — watch the
    // class directly so the raised state can never go stale after the last scroll tick
    var hud = document.querySelector('[data-hud]');
    if (hud && window.MutationObserver) {
      new MutationObserver(sync).observe(hud, { attributes: true, attributeFilter: ['class'] });
    }
    sync();
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var burger = document.querySelector('[data-burger]');
    var menu = document.querySelector('[data-menu]');
    if (!burger || !menu) return;
    function open() {
      menu.hidden = false; burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; if (App.lenis) App.lenis.stop();
    }
    function close() {
      menu.hidden = true; burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = ''; if (App.lenis) App.lenis.start();
    }
    window.__closeMenu = function () { if (!menu.hidden) close(); };
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') close(); else open();
    });
  }

  /* ---------- "Start a project" popover ---------- */
  function initStartPopover() {
    var pop = document.querySelector('[data-startpop]');
    if (!pop) return;
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-start]'));
    var current = null, closeTimer = null, openedAt = 0;
    var nowMs = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };

    function place(trigger) {
      pop.hidden = false;                       // unhide to measure
      var pw = pop.offsetWidth, ph = pop.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
      // always anchor directly under the trigger (right-aligned when the button sits on the right half)
      var r = trigger.getBoundingClientRect();
      var mid = r.left + r.width / 2;
      var left = mid > vw / 2 ? r.right - pw : r.left;
      left = Math.max(12, Math.min(left, vw - pw - 12));
      var top = r.bottom + 8;
      if (top + ph > vh - 12) top = Math.max(12, r.top - ph - 8);
      pop.style.left = Math.round(left) + 'px';
      pop.style.top = Math.round(top) + 'px';
    }
    function open(trigger) {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      current = trigger;
      triggers.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
      trigger.setAttribute('aria-expanded', 'true');
      place(trigger);
      openedAt = nowMs();
      requestAnimationFrame(function () { pop.classList.add('is-open'); });
    }
    function close() {
      if (!current) return;
      pop.classList.remove('is-open');
      current.setAttribute('aria-expanded', 'false');
      current = null;
      closeTimer = setTimeout(function () { if (!current) pop.hidden = true; }, 200);
    }

    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        var wasOpen = current === t;
        if (window.__closeMenu) window.__closeMenu();     // dismiss mobile menu if open
        if (wasOpen) close(); else open(t);
      });
    });
    pop.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('click', function (e) {
      if (current && !pop.contains(e.target) && !e.target.closest('[data-start]')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    // close when the user scrolls/resizes AWAY — but ignore the momentum/settle right after opening
    // (Lenis keeps firing 'scroll' during its glide, which would otherwise dismiss it instantly).
    window.addEventListener('scroll', function () { if (current && nowMs() - openedAt > 550) close(); }, { passive: true });
    window.addEventListener('resize', function () { if (current && nowMs() - openedAt > 550) close(); });
  }

  /* ---------- Contact form modal (Web3Forms) ---------- */
  function initContactForm() {
    var modal = document.querySelector('[data-modal]');
    if (!modal) return;
    var form = modal.querySelector('[data-form-el]');
    var done = modal.querySelector('[data-form-done]');
    var errEl = modal.querySelector('[data-form-error]');
    var submitBtn = modal.querySelector('[data-submit]');
    var submitLabel = submitBtn ? submitBtn.innerHTML : 'Send';
    var hideTimer = null;

    function open() {
      if (window.__closeMenu) window.__closeMenu();
      if (form) {
        form.classList.remove('has-error'); form.hidden = false;
        var inv = form.querySelectorAll('.form__row.is-invalid');
        for (var i = 0; i < inv.length; i++) inv[i].classList.remove('is-invalid');
      }
      if (done) done.hidden = true;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      if (App.lenis) App.lenis.stop();
      var first = modal.querySelector('#f-name');
      if (first) setTimeout(function () { first.focus(); }, 80);
    }
    function close() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (App.lenis) App.lenis.start();
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { modal.hidden = true; }, 240);
    }
    function showError(msg) {
      if (errEl) errEl.textContent = msg;
      if (form) form.classList.add('has-error');
    }

    document.querySelectorAll('[data-form]').forEach(function (tr) {
      tr.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    modal.querySelectorAll('[data-modal-close]').forEach(function (c) {
      c.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

    if (form) {
      // ----- Draft persistence: whatever is typed stays across refreshes. Saved on every
      // keystroke, restored on load, and cleared ONLY when the message sends successfully or
      // when the visitor empties the fields themselves — never on close/refresh. -----
      var DRAFT_KEY = 'df-contact-draft';
      var draftEls = { name: form.querySelector('#f-name'), email: form.querySelector('#f-email'), message: form.querySelector('#f-msg') };
      function saveDraft() {
        try {
          var d = { name: draftEls.name.value, email: draftEls.email.value, message: draftEls.message.value };
          if (d.name || d.email || d.message) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
          else localStorage.removeItem(DRAFT_KEY);   // everything deleted by hand -> drop the draft
        } catch (e) {}
      }
      function loadDraft() {
        try {
          var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
          if (!d) return;
          if (d.name)    draftEls.name.value = d.name;
          if (d.email)   draftEls.email.value = d.email;
          if (d.message) draftEls.message.value = d.message;
        } catch (e) {}
      }
      function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
        draftEls.name.value = ''; draftEls.email.value = ''; draftEls.message.value = '';
      }
      loadDraft();   // restore immediately on page load (survives refresh)

      var rowError = function (input, msg) {
        var row = input.closest('.form__row');
        if (row) {
          var err = row.querySelector('[data-err]');
          row.classList.toggle('is-invalid', !!msg);
          if (err) err.textContent = msg || '';
        }
        return !msg;
      };
      var validate = function () {
        var nameEl = form.querySelector('#f-name');
        var emailEl = form.querySelector('#f-email');
        var msgEl = form.querySelector('#f-msg');
        var okName = rowError(nameEl, nameEl.value.trim() ? '' : 'Please enter your name.');
        var v = emailEl.value.trim(), em = '';
        if (!v) em = 'Please enter your email.';
        else if (v.indexOf('@') === -1) em = 'Please enter a valid email address (must include "@").';
        else if (!/^[^@\s]+@[^@\s]+$/.test(v)) em = 'Please enter a valid email address.';
        var okEmail = rowError(emailEl, em);
        var okMsg = rowError(msgEl, msgEl.value.trim() ? '' : 'Tell us a little about your project.');
        return okName && okEmail && okMsg;
      };
      ['#f-name', '#f-email', '#f-msg'].forEach(function (sel) {
        var el = form.querySelector(sel);
        if (el) el.addEventListener('input', function () { rowError(el, ''); saveDraft(); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) {
          var bad = form.querySelector('.form__row.is-invalid .field');
          if (bad) bad.focus();
          return;
        }
        form.classList.remove('has-error');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending&hellip;'; }
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        })
          .then(function (r) { return r.json(); })
          .then(function (json) {
            if (json && json.success) { form.hidden = true; if (done) done.hidden = false; clearDraft(); }
            else { showError((json && json.message) || 'Something went wrong. Please try again.'); }
          })
          .catch(function () { showError('Network error. Please email create@thedigitalfront.co directly.'); })
          .then(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitLabel; } });
      });
    }
  }

  /* ---------- Align hero grid rows with the next section's grid (kills the seam double-line) ---------- */
  function alignGrids() {
    var hero = document.querySelector('.hero');
    var heroY = hero ? (hero.offsetHeight % 64) : 0;
    doc.style.setProperty('--hero-grid-y', heroY + 'px');   // hero/stage lattice anchor
    // Align every flow-section grid (Kind words / Start / Footer) to that same 64px
    // lattice so the rows run continuously down the page instead of restarting per
    // section. --grid-y shifts a section's grid so a line lands where the global
    // lattice wants one (≡ heroY mod 64), given the section's document-top.
    var grids = document.querySelectorAll('[data-grid]');
    for (var i = 0; i < grids.length; i++) {
      var top = grids[i].getBoundingClientRect().top + window.scrollY;
      grids[i].style.setProperty('--grid-y', ((((heroY - top) % 64) + 64) % 64) + 'px');
    }
  }

  /* ---------- Align the 01 cards' bullet rows across BOTH cards ----------
     Each card's bullets wrap to different line counts, so corresponding rows drift apart.
     Equalise each bullet PAIR (and the taglines) to the taller of the two so every row lines
     up between the two cards — only mismatched rows get padded, so there's no global whitespace. */
  function alignDuoBullets() {
    var duo = document.querySelector('.card--duo');
    if (!duo) return;
    var cards = duo.querySelectorAll('.do-card');
    if (cards.length < 2) return;
    // rows = tagline + each bullet, in document order (titles are single-word, always one line)
    var rowsA = Array.prototype.slice.call(cards[0].querySelectorAll('.do-card__tagline, .card__list li'));
    var rowsB = Array.prototype.slice.call(cards[1].querySelectorAll('.do-card__tagline, .card__list li'));
    var n = Math.min(rowsA.length, rowsB.length);
    var i;
    for (i = 0; i < n; i++) { rowsA[i].style.minHeight = ''; rowsB[i].style.minHeight = ''; }   // reset to natural
    var maxes = [];
    for (i = 0; i < n; i++) { maxes[i] = Math.max(rowsA[i].offsetHeight, rowsB[i].offsetHeight); }
    for (i = 0; i < n; i++) { rowsA[i].style.minHeight = maxes[i] + 'px'; rowsB[i].style.minHeight = maxes[i] + 'px'; }
  }

  /* ---------- Per-section scroll speed ----------
     Sections 01 (do) + 02 (build) carry the heavy scrubbed card animations, so scrolling there is
     slowed to a more deliberate pace; everywhere else (hero, 03, testimonials, CTA, footer) keeps the
     natural speed. Lenis reads its wheel/touch multipliers off the VirtualScroll live, so we just
     retune them whenever the scroll position crosses into / out of the 01+02 band. */
  function initSectionScrollSpeed() {
    var l = App.lenis;
    if (!l) { window.addEventListener('load', initSectionScrollSpeed, { once: true }); return; }   // wait for deferred Lenis
    if (!l.virtualScroll || l.__sectionSpeed) return;
    l.__sectionSpeed = true;                          // guard against double-binding
    var vs = l.virtualScroll;
    var NORMAL = { wheel: 0.7, touch: 0.95 }, SLOW = { wheel: 0.36, touch: 0.54 };
    // 01 (do) + 02 (build) scroll slow — EXCEPT the 02 opener "A glimpse of the range…" statement,
    // which has no scrubbed media to dwell on, so it stays at the natural speed.
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card][data-section="do"], [data-card][data-section="build"]'))
      .filter(function (c) { return !c.classList.contains('card--statement'); });
    var cur = null;
    function set(slow) {
      if (slow === cur) return;
      cur = slow;
      var s = slow ? SLOW : NORMAL;
      l.options.wheelMultiplier = s.wheel; l.options.touchMultiplier = s.touch;
      if (vs.options) { vs.options.wheelMultiplier = s.wheel; vs.options.touchMultiplier = s.touch; }
    }
    function update() {
      var y = window.scrollY, slow = false;
      for (var i = 0; i < cards.length; i++) {
        var st = cards[i].__st;                        // each card's pinned scroll band (live; updates on refresh)
        if (st && y >= st.start - 1 && y < st.end - 1) { slow = true; break; }
      }
      set(slow);
    }
    l.on('scroll', update);
    update();
  }

  /* ---------- Boot (deferred: libs already executed in order) ---------- */
  function boot() {
    initIcons();
    initLenis();
    initMenu();
    initTestimonials();
    initVideos();
    initBackTop();
    initStage();
    initSectionScrollSpeed();
    initNav();
    initStartPopover();
    initContactForm();
    alignGrids();
    alignDuoBullets();
    // re-equalise once the display fonts have loaded (fallback metrics differ → wrong wrap counts)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignDuoBullets);

    window.addEventListener('load', function () {
      alignGrids();
      alignDuoBullets();
      var a = document.querySelector('.nav__links a.is-active');
      if (a) moveNavIndicator(a);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        alignGrids();
        alignDuoBullets();
        var a = document.querySelector('.nav__links a.is-active');
        if (a) moveNavIndicator(a);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 200);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
