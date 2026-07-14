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
    // On mobile the browser address bar shows/hides while scrolling, which only changes the viewport
    // HEIGHT. Tell ScrollTrigger to ignore those resizes so the pinned cards don't recalc and jump on
    // every scroll up/down (it keeps using a stable height instead of refreshing on the bar toggle).
    ST.config({ ignoreMobileResize: true });

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
      if (card.classList.contains('card--next')) return keep([card.querySelector('.next-card')]);
      return [];
    }
    // STAGE 2 — the TEXT (title + copy) that clip-reveals AFTER the card, with a quick gap
    function maskTargetsOf(card) {
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
      if (card.classList.contains('card--steps'))             // each panel's number, title, tagline mask-reveal individually (one by one)
        toArr(card.querySelectorAll('.htl__num, .htl__name, .htl__tag')).forEach(maskWrap);
      if (card.classList.contains('card--flow'))              // each step's number, sous-titre, title, description mask-reveal one by one
        toArr(card.querySelectorAll('.flow__idx, .flow__kicker, .flow__title, .flow__desc')).forEach(maskWrap);
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
          card.__navSection = section; card.__navIdx = secIdx;   // remembered so a neighbour can re-point the section indicator on reverse scroll
          var isLast = i === cards.length - 1;
          // phone: the 03 stepper is un-pinned (scrolls), so the card just before it must RESERVE its
          // scroll (pinSpacing) — otherwise the flow slides up over it and overlaps the previous section.
          var beforeFlow = cards[i + 1] && cards[i + 1].classList.contains('card--flow');   // the card right before 03 How we work (any screen)
          var beforeFlowMobile = (window.matchMedia && window.matchMedia('(max-width: 720px)').matches) && beforeFlow;

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
          var isSteps   = card.classList.contains('card--steps');
          var isFlow    = card.classList.contains('card--flow');
          var htlEl     = isSteps ? card.querySelector('.htl') : null;
          var htlTrack  = isSteps ? card.querySelector('.htl__track') : null;
          var htlReveal = isSteps ? toArr(card.querySelectorAll('[data-htl-reveal]')) : [];   // segment headings + icon-nodes, in pan order
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
          if (isSteps) {
            if (htlTrack) gsap.set(htlTrack, { y: 0 });
            var htlHeadInners = toArr(card.querySelectorAll('.htl__head .msk__i'));
            var htlDots  = toArr(card.querySelectorAll('.htl__dot'));
            var htlDescs = toArr(card.querySelectorAll('.htl__desc'));
            var htlLines = toArr(card.querySelectorAll('.htl__line'));
            if (htlHeadInners.length) gsap.set(htlHeadInners, { opacity: 0, y: '100%' });   // title line + tagline wait below their mask edge
            if (htlDots.length)  gsap.set(htlDots,  { scale: 0 });            // dots POP in (kept opaque), so the line never shows through them
            if (htlDescs.length) gsap.set(htlDescs, { opacity: 0, x: -12 });
            if (htlLines.length) gsap.set(htlLines, { scaleY: 0 });           // the vertical line draws downward
          }
          if (isFlow) {
            var flowLine0 = card.querySelector('.flow__line');
            var flowFill0 = card.querySelector('.flow__fill');
            var flowNodes0 = toArr(card.querySelectorAll('.flow__node'));
            if (flowLine0) gsap.set(flowLine0, { opacity: 0 });               // line + glow hidden until this card is active (no leak into the card sliding over it)
            if (flowFill0) gsap.set(flowFill0, { height: '0%' });             // the line draws from nothing
            if (flowNodes0.length) gsap.set(flowNodes0, { scale: 0.66, opacity: 0 });   // nodes fade + pop as the head reaches them
            var flowInners0 = toArr(card.querySelectorAll('.flow__card .msk__i'));
            if (flowInners0.length) gsap.set(flowInners0, { y: '110%', opacity: 0 });   // number/kicker/title/desc each wait below their own mask edge
          }

          // On phone the 03 stepper doesn't fit one screen, so DON'T pin it — let it scroll past with room
          // to breathe; the line/glow/reveal are driven by the section moving through the viewport instead.
          var isFlowMobile = isFlow && window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
          var tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              start: isFlowMobile ? 'top 30%' : 'top top',   // phone 03: begin the line draw just as the last case card's content clears the top — fills the brief gap without overlapping 02
              end: isFlowMobile ? 'bottom bottom' : (isSteps ? function () { return '+=' + Math.round((window.innerHeight || 800) * 2.4); } : isFlow ? function () { return '+=' + Math.round((window.innerHeight || 800) * 2.5); } : 'bottom top'),   // 01 pans ~2.4 screens; desktop 03 draws over ~2.5 screens (line takes longer); phone 03 finishes only while it still fills the screen
              scrub: true,
              pin: isFlowMobile ? false : card,
              pinSpacing: beforeFlow ? true : (isFlowMobile ? false : (isLast || isSteps || isFlow)),   // steps / flow / last reserve scroll; the card before 03 reserves a breathing gap (all screens) so How we work rises in after 02 clears — matches the 01→02 transition
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
              },
              // scrolling UP past this card's start → the previous card's section is the one now on screen.
              // The reveal ScrollTriggers don't cover the blank transition gaps, so without this the indicator
              // stays stuck on the section you're leaving until the neighbour re-activates (long after its
              // content reappeared). Re-point it immediately to the previous card's section on reverse.
              onLeaveBack: function () {
                var prev = cards[i - 1];
                if (prev) setActive(prev.__navSection, prev.__navIdx);
              }
            }
          });
          card.__st = tl.scrollTrigger;   // used by the nav jump-to (land at the section's first card)

          // reveal — the CARD visual in FIRST; the TEXT then clips up a beat later
          if (isSteps) {
            // 01 "What we do": two LOCKED panels. Each element reveals ONE BY ONE — number, then title, then
            // tagline (each its own mask), then the icons pop in one at a time; nothing pans. The panel then
            // clears out element-by-element and 02 Websites locks in the same way; then the section moves on.
            card.__landTime = 0.16;   // nav jump-to lands on the locked opening (number/title/tagline shown)
            // once 01 is fully revealed it stays put; the strip then pans up by exactly 01's own height, so 02
            // lands at the TOP the moment 01's last icon clears — 01 never disappears.
            var htlSegs = toArr(card.querySelectorAll('.htl__seg'));
            if (htlTrack && htlSegs[0]) tl.to(htlTrack, { y: function () { return -htlSegs[0].offsetHeight; }, ease: 'none', duration: 0.18 }, 0.40);
            htlSegs.forEach(function (seg, si) {
              var headInners = toArr(seg.querySelectorAll('.htl__head .msk__i'));   // [ number, title, tagline ]
              var line = seg.querySelector('.htl__line');
              var nodes = toArr(seg.querySelectorAll('.htl__node'));
              var inAt = si === 0 ? 0 : 0.58;                    // 02 reveals at the TOP, the moment 01's last icon clears (the pan has just finished)
              // number, then title, then tagline each rise out from behind their own mask edge — one by one
              if (headInners.length) tl.to(headInners, { y: '0%', opacity: 1, ease: EASE, duration: 0.09, stagger: 0.035 }, inAt);
              if (line) tl.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: 0.1 }, inAt + 0.05);   // line draws top→bottom
              nodes.forEach(function (n, ni) {   // icons pop onto the line (opaque) + labels slide in, one by one
                var nat = inAt + 0.17 + ni * 0.016;
                var dot = n.querySelector('.htl__dot');
                var desc = n.querySelector('.htl__desc');
                if (dot)  tl.fromTo(dot,  { scale: 0 }, { scale: 1, ease: 'back.out(1.5)', duration: 0.09 }, nat);
                if (desc) tl.fromTo(desc, { opacity: 0, x: -12 }, { opacity: 1, x: 0, ease: EASE, duration: 0.09 }, nat + 0.02);
              });
            });
          } else if (isFlow) {
            // 03 "How we work": the centre line DRAWS downward with a glowing head that tracks the scroll.
            // As the head reaches each step, its number → sous-titre → title → description mask up ONE BY ONE
            // (each from behind its own edge); scrolling back masks them away in reverse.
            card.__landTime = 0.05;
            var fLine = card.querySelector('.flow__line');
            var fFill = card.querySelector('.flow__fill');
            var lineTop = fLine ? fLine.getBoundingClientRect().top : 0;
            var lineH = fLine ? (fLine.getBoundingClientRect().height || 1) : 1;
            // Desktop (pinned): 01 Brief fully appears with the line PARKED at the top, then the line travels down to
            // reveal 02/03/04 — so you don't brush past 01 on entry. Mobile is un-pinned with tall 52vh steps (each step
            // already gets a full screen of scroll), so there keep the simple "reveal as the head reaches the node" timing.
            var FLEAD = 0.05;     // small settle after the pin engages (desktop)
            var S1_DONE = isFlowMobile ? 0 : 0.26;   // desktop: 01 Brief fully revealed by here before the line moves
            var DRAW = isFlowMobile ? 0.9 : 0.95;    // line fully drawn (head at the bottom) by here
            var drawFrom = isFlowMobile ? 0 : S1_DONE;
            if (fLine) tl.fromTo(fLine, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.04 }, 0);   // the track appears only once this card is active
            if (fFill) tl.fromTo(fFill, { height: '0%' }, { height: '100%', ease: 'none', duration: DRAW - drawFrom }, drawFrom);   // desktop: the draw begins only once 01 Brief has fully appeared
            toArr(card.querySelectorAll('.flow__step')).forEach(function (step, si) {
              var node = step.querySelector('.flow__node');
              var frac = 0.5;
              if (node) { var nr = node.getBoundingClientRect(); frac = ((nr.top + nr.height / 2) - lineTop) / lineH; }
              frac = Math.max(0, Math.min(1, frac));
              // desktop: 01 Brief up front (head parked), 02/03/04 as the head reaches them; mobile: every step as the head reaches it
              var at = isFlowMobile ? (DRAW * frac) : (si === 0 ? FLEAD : (S1_DONE + (DRAW - S1_DONE) * frac));
              if (node) tl.to(node, { scale: 1.2, opacity: 1, borderColor: 'rgba(224,234,252,.95)', boxShadow: '0 0 16px 3px rgba(170,205,255,.85)', ease: 'back.out(2)', duration: 0.1 }, at);
              toArr(step.querySelectorAll('.flow__card .msk__i')).forEach(function (inner, ei) {   // [ number, sous-titre, title, description ] — one by one, but TIGHT so all four land together
                tl.fromTo(inner, { y: '110%', opacity: 0 }, { y: '0%', opacity: 1, ease: EASE, duration: 0.09 }, at + 0.02 + ei * 0.02);
              });
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
          if (!isLast && (isSteps || beforeFlow)) {
            // no exit tween (exit-skip, ALL screens) — the 01 Websites panel and the case right before 03
            // hold at the end of the pin, then scroll away VISIBLE into the next section (no conceal/fade).
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


  /* ---------- Showcase videos — play only while on screen ----------
     Filling all six device screens with looping clips that ALL decode at once
     (even off-screen) would jank the pinned scroll. Play each only while it's in
     view, pause it otherwise. Muted + playsinline so autoplay is always allowed. */
  function initVideos() {
    // drop the placeholder scrubber/sweep on any screen holding real media (:has()+pseudo-content
    // isn't reliably re-invalidated, so tag it with a class the pseudos key off instead)
    Array.prototype.slice.call(document.querySelectorAll('.frame__screen')).forEach(function (s) {
      if (s.querySelector('video, img')) s.classList.add('has-media');
    });
    var vids = Array.prototype.slice.call(document.querySelectorAll('.frame__screen video'));
    if (!vids.length) return;
    vids.forEach(function (v) { v.muted = true; });   // belt-and-suspenders for autoplay policy
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (!('IntersectionObserver' in window)) { vids.forEach(play); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
    }, { threshold: 0.2 });
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
    var intro = modal.querySelector('[data-form-intro]');   // header (eyebrow + title + sub); hidden alongside the form on success
    var errEl = modal.querySelector('[data-form-error]');
    var submitBtn = modal.querySelector('[data-submit]');
    var submitLabel = submitBtn ? submitBtn.innerHTML : 'Send';
    var hideTimer = null;

    function open() {
      if (form) {
        form.classList.remove('has-error'); form.hidden = false;
        var inv = form.querySelectorAll('.form__row.is-invalid');
        for (var i = 0; i < inv.length; i++) inv[i].classList.remove('is-invalid');
      }
      if (done) done.hidden = true;
      if (intro) intro.hidden = false;
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
            if (json && json.success) { form.hidden = true; if (intro) intro.hidden = true; if (done) done.hidden = false; clearDraft(); }
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
    var stageEl = document.querySelector('.stage');
    var gridMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
    var gridShort = !gridMobile && window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 820px)').matches;   // short-landscape displays (Nest Hub / Nest Hub Max)
    var gridTablet = !gridMobile && window.matchMedia && (window.matchMedia('(max-width: 1024px) and (pointer: coarse)').matches || window.matchMedia('(max-width: 900px)').matches || gridShort);
    var cw = document.documentElement.clientWidth;
    // grid square: phones = width/6 (6 columns); iPads / short-landscape displays like the Nest Hub = width/12
    // (12 columns, what iPad-mini's 768/64 shows, so those all match); desktop = fixed 64px. Identical per class.
    var CELL = Math.round((gridMobile ? cw / 6 : gridTablet ? cw / 12 : 64) * 100) / 100;
    doc.style.setProperty('--grid-cell', CELL + 'px');
    doc.style.setProperty('--client-width', cw + 'px');   // real content width (no scrollbar) for text caps that scale with the shifted lines
    // Slide the whole vertical lattice down by the stage's leftover (height mod 64) so a horizontal grid
    // line lands exactly on the stage → testimonials seam (the texture's border-bottom draws it). The hero
    // grid rides the SAME shifted lattice, so hero + stage stay continuous while the bottom seam gets a line.
    var gap = stageEl ? (Math.round(stageEl.getBoundingClientRect().height) % CELL) : 0;
    doc.style.setProperty('--stage-grid-y', gap + 'px');
    var heroY = hero ? (((hero.offsetHeight % CELL) + gap) % CELL) : 0;
    doc.style.setProperty('--hero-grid-y', heroY + 'px');   // hero/stage lattice anchor (shifted to match the stage grid)
    // Align every flow-section grid (Kind words / Start / Footer) to that same 64px
    // lattice so the rows run continuously down the page instead of restarting per
    // section. --grid-y shifts a section's grid so a line lands where the global
    // lattice wants one (≡ heroY mod 64), given the section's document-top.
    var grids = document.querySelectorAll('[data-grid]');
    for (var i = 0; i < grids.length; i++) {
      var top = grids[i].getBoundingClientRect().top + window.scrollY;
      grids[i].style.setProperty('--grid-y', ((((heroY - top) % CELL) + CELL) % CELL) + 'px');
    }
    // Where a vertical grid column lands: on PHONES centre it under the hero scroll cue (viewport centre)
    // so the cue overlaps it dead-centre; on desktop/iPad put it under the 03 stepper's line. The other
    // section lines (01 timeline, and the flow line on phones) then snap onto this grid below.
    var sgcx;
    if (gridMobile) {
      sgcx = document.documentElement.clientWidth / 2;
    } else {
      var sgLine = document.querySelector('.flow__line') || document.querySelector('.htl__line');
      sgcx = sgLine ? (sgLine.getBoundingClientRect().left + sgLine.getBoundingClientRect().width / 2) : null;
    }
    if (sgcx != null) doc.style.setProperty('--stage-grid-x', ((((sgcx - 0.5) % CELL) + CELL) % CELL) + 'px');
    // 03 stepper line: desktop/iPad keep it dead-centre (the grid is aligned TO it, so no shift). On phones
    // the grid is centred on the hero cue instead, so nudge the flow line onto the nearest column there.
    var flowEl = document.querySelector('.flow');
    var texEl = document.querySelector('.stage__texture');
    if (flowEl) {
      var flowLn = flowEl.querySelector('.flow__line');
      if (gridMobile && flowLn && texEl) {
        var curFS = parseFloat(getComputedStyle(flowEl).getPropertyValue('--flow-shift')) || 0;
        var flr2 = flowLn.getBoundingClientRect();
        var flNat = flr2.left + flr2.width / 2 - curFS;
        var fgx = parseFloat(getComputedStyle(texEl).backgroundPositionX) || 0;
        var fcol = fgx + Math.round((flNat - fgx - 0.5) / CELL) * CELL + 0.5;   // nearest column (the left one)
        flowEl.style.setProperty('--flow-shift', Math.round((fcol - flNat) * 100) / 100 + 'px');
      } else {
        flowEl.style.setProperty('--flow-shift', '0px');
      }
    }
    // 01 "what we do" timeline: the grid is locked to the 03 flow line, so nudge the WHOLE timeline
    // sideways so its own line lands on the nearest grid column too — keeps both section lines on the grid.
    var htlEl = document.querySelector('.htl');
    var htlLine = document.querySelector('.htl__line');
    if (htlEl && htlLine && texEl) {
      var curHtlShift = parseFloat(getComputedStyle(htlEl).getPropertyValue('--htl-shift')) || 0;
      var hlr = htlLine.getBoundingClientRect();
      var htlNatCx = hlr.left + hlr.width / 2 - curHtlShift;                   // line centre without any shift
      var hgx = parseFloat(getComputedStyle(texEl).backgroundPositionX) || 0;  // where the grid columns sit
      var htlN = (htlNatCx - hgx - 0.5) / CELL;
      var htlLeftBias = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;  // phones: snap to the column on the LEFT so the timeline hugs the left
      var htlCol = hgx + (htlLeftBias ? Math.floor(htlN) : Math.round(htlN)) * CELL + 0.5;   // nearest column (phones snap to the left one)
      if (gridShort && window.matchMedia('(min-width: 1100px)').matches) htlCol += CELL;   // WIDE short-landscape (Nest Hub Max 1280, not the narrower Nest Hub 1024): nudge the timeline one grid column right
      htlEl.style.setProperty('--htl-shift', Math.round((htlCol - htlNatCx) * 100) / 100 + 'px');
    }
    // hero SCROLL cue: line it up with the same grid lattice (the "middle line")
    var heroScroll = document.querySelector('.hero__scroll');
    if (heroScroll && texEl) {
      var curSS = parseFloat(getComputedStyle(doc).getPropertyValue('--scroll-shift')) || 0;
      var hsr = heroScroll.getBoundingClientRect();
      var hsNat = hsr.left + hsr.width / 2 - curSS;                          // cue centre without any shift
      var gxs = parseFloat(getComputedStyle(texEl).backgroundPositionX) || 0;
      var cols = gxs + Math.round((hsNat - gxs - 0.5) / CELL) * CELL + 0.5;      // nearest grid-line centre
      doc.style.setProperty('--scroll-shift', Math.round((cols - hsNat) * 100) / 100 + 'px');
    }
  }


  /* ---------- Per-section scroll speed ----------
     Sections 01 (do), 02 (build) + 03 (work) carry the heavy scrubbed card animations, so scrolling there
     is slowed to a more deliberate pace; everywhere else (hero, testimonials, CTA, footer) keeps the
     natural speed. Lenis reads its wheel/touch multipliers off the VirtualScroll live, so we just
     retune them whenever the scroll position crosses into / out of that band. */
  function initSectionScrollSpeed() {
    var l = App.lenis;
    if (!l) { window.addEventListener('load', initSectionScrollSpeed, { once: true }); return; }   // wait for deferred Lenis
    if (!l.virtualScroll || l.__sectionSpeed) return;
    l.__sectionSpeed = true;                          // guard against double-binding
    var vs = l.virtualScroll;
    var NORMAL = { wheel: 0.7, touch: 0.95 }, SLOW = { wheel: 0.36, touch: 0.54 };
    // 01 (do), 02 (build) + 03 (work) all carry heavy scrubbed card animations, so they scroll slow at the
    // same deliberate pace — EXCEPT the (now-removed) statement opener, which had no scrubbed media to dwell on.
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card][data-section="do"], [data-card][data-section="build"], [data-card][data-section="work"]'))
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
    initTestimonials();
    initVideos();
    initBackTop();
    initStage();
    initSectionScrollSpeed();
    initNav();
    initStartPopover();
    initContactForm();
    alignGrids();

    window.addEventListener('load', function () {
      alignGrids();
      var a = document.querySelector('.nav__links a.is-active');
      if (a) moveNavIndicator(a);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
    var rt, lastW = window.innerWidth;
    var coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    window.addEventListener('resize', function () {
      // On touch devices the address bar showing/hiding fires resize with only a HEIGHT change (width
      // unchanged). Ignore those so we don't re-align grids / refresh ScrollTrigger and jump the layout
      // on every scroll. A real orientation change swaps the width, so that still recalculates.
      if (coarsePointer && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(rt);
      rt = setTimeout(function () {
        alignGrids();
        var a = document.querySelector('.nav__links a.is-active');
        if (a) moveNavIndicator(a);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 200);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
