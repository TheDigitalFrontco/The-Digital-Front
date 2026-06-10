/* ============================================================================
   THE DIGITAL FRONT — Showcase (scroll-takeover) interactions
   Faithful reproduction (vanilla JS) of the reference "present" mechanic:
   one pinned full-screen ScrollTrigger per beat, exact eases / stagger /
   parallax / pin settings — skinned in DF copy + tokens.

   Reference timeline (per beat, all power2.inOut, overlapped -=1 / "<"):
     1. svgArt      -> top:-40% (mobile -50%), opacity:1   (-=1)
     2. artObject   -> top:-40% (mobile -60%), opacity:1   (-=1)
     3. [name,kick,cta] -> y:0%, opacity:1, scale:1        (-=1)
     4. .word spans -> y:0%, opacity:1, stagger{amount:.05, from:start}  ("<")
     5. exit (desktop / non-last): art -> y:-100% op:0, then text -> y:-100% op:0
   onUpdate(p): artObject.y = -p*200, svgArt.y = -p*400  (mobile -p*100 / -p*30)
   ScrollTrigger: start "top top", end "bottom top", scrub:true, pin:section,
                  toggleActions "play none none reverse".
   ========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;

  /* ---- Pillars: top-index labels + the matte per-pillar backgrounds ------- */
  var PILLARS = {
    do:    { label: 'What we do',    color: '#1E2C40' },
    build: { label: 'What we build', color: '#3E587F' },
    work:  { label: 'How we work',   color: '#2E4A43' }
  };
  var PILLAR_ORDER = ['do', 'build', 'work'];

  /* ---- The beats — every name + line is DF's own copy --------------------- */
  /* art: 'reel' | 'browser' | 'mark' | numeral string. ink:'dark' for light bg */
  var BEATS = [
    /* ---------- 01 · WHAT WE DO (navy) ---------- */
    { pillar: 'do', kicker: 'AI Videos', ghost: 'Video',
      name: 'Stories, <em class="df-em">told.</em>',
      desc: 'Scroll-stopping AI-generated content that makes your business impossible to ignore.',
      art: 'reel' },
    { pillar: 'do', kicker: 'Websites', ghost: 'Web',
      name: 'Sites, <em class="df-em">finished.</em>',
      desc: 'Custom front-end sites, plus Shopify and WordPress builds. Beautiful, fast, and ready to convert.',
      art: 'browser' },

    /* ---------- 02 · WHAT WE BUILD (slate) ---------- */
    { pillar: 'build', kicker: 'What we build', ghost: 'Range',
      name: 'The <em class="df-em">range.</em>',
      desc: 'A glimpse of the range — reels, films, and websites, built end to end.',
      art: 'mark' },
    { pillar: 'build', kicker: 'Reel · 16:9', ghost: 'Reels',
      name: 'AI Videos',
      desc: 'Vertical reels and wide-format films, built to land on every feed and screen.',
      art: 'reel' },
    { pillar: 'build', kicker: 'thedigitalfront.co', ghost: 'Sites',
      name: 'Websites',
      desc: 'Responsive websites that stay sharp from phone to desktop.',
      art: 'browser' },
    { pillar: 'build', kicker: 'Next', ghost: 'Next',
      name: 'Your project <em class="df-em">here.</em>',
      desc: "Have something in mind? Let's build it.",
      art: 'mark', cta: { label: 'Start a project', href: '#start' } },

    /* ---------- 03 · HOW WE WORK (teal) ---------- */
    { pillar: 'work', kicker: '01 · Brief', ghost: 'Brief', numeral: '01',
      name: 'We listen <em class="df-em">first.</em>',
      desc: "A quick conversation to understand what you're building — video, web, or both — plus your company, your goals, and your budget. Have an idea? Great. Don't? We'll shape one together.",
      art: 'numeral' },
    { pillar: 'work', kicker: '02 · Direction', ghost: 'Direction', numeral: '02',
      name: 'We shape the <em class="df-em">vision.</em>',
      desc: "We align before we create. You approve the script and stills for video, or a layout direction for your site. Nothing moves forward until it's right. No surprises later.",
      art: 'numeral' },
    { pillar: 'work', kicker: '03 · Build', ghost: 'Build', numeral: '03',
      name: 'We bring it to <em class="df-em">life.</em>',
      desc: "We build, and you shape it as we go. For websites: review and refine until it's yours. For video: you sign off on the direction before we produce. Small tweaks always welcome.",
      art: 'numeral' },
    { pillar: 'work', kicker: '04 · Handover', ghost: 'Handover', numeral: '04',
      name: 'We hand you the <em class="df-em">keys.</em>',
      desc: 'Everything, delivered and finished. Videos in full quality, ready to post. Websites handed over complete: your domain, your accounts, your files. All yours.',
      art: 'numeral' }
  ];

  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var PLAY_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  var GRID_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="14" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>';

  /* ---- art-object markup per type ---------------------------------------- */
  function artObject(beat) {
    if (beat.art === 'reel') {
      return '<div class="showcase">' +
        '<figure class="frame frame--browser"><div class="frame__bar"><i></i><i></i><i></i>' +
        '<span class="frame__url">reel / 16:9</span></div>' +
        '<div class="frame__screen"><span class="slot__tag">' + PLAY_SVG + ' AI Video</span></div></figure>' +
        '<figure class="frame frame--phone"><div class="frame__screen"><span class="slot__tag">' + PLAY_SVG + '</span></div></figure>' +
        '</div>';
    }
    if (beat.art === 'browser') {
      return '<div class="showcase">' +
        '<figure class="frame frame--browser"><div class="frame__bar"><i></i><i></i><i></i>' +
        '<span class="frame__url">thedigitalfront.co</span></div>' +
        '<div class="frame__screen"><span class="slot__tag">' + GRID_SVG + ' Website</span></div></figure>' +
        '<figure class="frame frame--phone"><div class="frame__screen"><span class="slot__tag">' + GRID_SVG + '</span></div></figure>' +
        '</div>';
    }
    if (beat.art === 'numeral') {
      return '<div class="art-numeral">' + beat.numeral + '</div>';
    }
    return '<div class="art-mark"><img src="assets/logo-source-cropped.png" alt=""></div>';
  }

  function words(desc) {
    return desc.split(' ').map(function (w) { return '<span class="word">' + w + '</span>'; }).join(' ');
  }

  /* ---- one beat's section markup (the reusable "ArtSection") -------------- */
  function sectionMarkup(beat, i) {
    var ink = beat.ink ? ' data-ink="' + beat.ink + '"' : '';
    var cta = beat.cta
      ? '<a class="rec_btn" href="' + beat.cta.href + '"><span>' + beat.cta.label + '</span>' +
        '<span class="arrow">' + ARROW_SVG + '</span></a>'
      : '';   // no placeholder — it would eat layout width and shove the desc off-screen

    return '<section class="art-section" data-beat="' + i + '" data-pillar="' + beat.pillar + '"' + ink + '>' +
      '<div class="art-work">' +
        '<div class="svg-img" aria-hidden="true">' + beat.ghost + '</div>' +
        '<div class="art-object">' + artObject(beat) + '</div>' +
      '</div>' +
      '<div class="art-foot"><div class="art-bottom-cont">' +
        '<h2 class="big-font">' +
          '<span class="kicker">' + beat.kicker + '</span>' +
          '<span class="name-mask"><span class="name-inner">' + beat.name + '</span></span>' +
        '</h2>' +
        '<h3 class="desc">' + words(beat.desc) + '</h3>' +
        cta +
      '</div></div>' +
    '</section>';
  }

  /* ---- build the DOM ------------------------------------------------------ */
  var sectionsEl = document.querySelector('[data-sections]');
  var indexEl = document.querySelector('[data-index]');
  var stageBg = document.querySelector('[data-stage-bg]');

  sectionsEl.innerHTML = BEATS.map(sectionMarkup).join('');

  PILLAR_ORDER.forEach(function (key, k) {
    var b = document.createElement('button');
    b.className = 'top-index__item';
    b.type = 'button';
    b.dataset.pillar = key;
    b.innerHTML = '<span class="num">0' + (k + 1) + '</span>' + PILLARS[key].label;
    indexEl.appendChild(b);
  });
  var indexItems = Array.prototype.slice.call(indexEl.querySelectorAll('.top-index__item'));

  var currentPillar = null;
  function setActivePillar(key) {
    if (key === currentPillar) return;            // already showing this pillar — no redundant tween
    currentPillar = key;
    indexItems.forEach(function (it) { it.classList.toggle('is-active', it.dataset.pillar === key); });
    if (stageBg && window.gsap) {
      window.gsap.to(stageBg, { backgroundColor: PILLARS[key].color, duration: .5, ease: 'power2.out' });
    } else if (stageBg) {
      stageBg.style.backgroundColor = PILLARS[key].color;
    }
  }

  /* ---- static fallback: no JS-driven motion ------------------------------- */
  function goStatic() {
    doc.classList.add('is-static');
    document.body.classList.add('is-static');
    setActivePillar('do');
  }

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, ScrollToPlugin = window.ScrollToPlugin;
  if (prefersReduced || !gsap || !ScrollTrigger) { goStatic(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);

  /* ---- Lenis smooth scroll, driven into ScrollTrigger --------------------- */
  var lenis = null;
  function initLenis() {
    if (!window.Lenis) { window.addEventListener('load', initLenis, { once: true }); return; }
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  initLenis();

  /* ---- top-index jump-to (ScrollToPlugin) -------------------------------- */
  indexItems.forEach(function (it) {
    it.addEventListener('click', function () {
      var first = sectionsEl.querySelector('.art-section[data-pillar="' + it.dataset.pillar + '"]');
      if (!first) return;
      var y = first.getBoundingClientRect().top + window.scrollY;
      if (ScrollToPlugin) gsap.to(window, { duration: 1, scrollTo: y, ease: 'power2.inOut' });
      else if (lenis) lenis.scrollTo(y);
      else window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ---- per-beat timelines (matchMedia: desktop vs mobile) ---------------- */
  var sections = Array.prototype.slice.call(sectionsEl.querySelectorAll('.art-section'));

  function build(isMobile) {
    var ctx = gsap.context(function () {
      sections.forEach(function (section, i) {
        var beat = BEATS[i];
        var isLast = i === sections.length - 1;
        var svgArt    = section.querySelector('.svg-img');
        var artObj    = section.querySelector('.art-object');
        var nameInner = section.querySelector('.name-inner');
        var kicker    = section.querySelector('.kicker');
        var ctaEl     = section.querySelector('.rec_btn');
        var descEl    = section.querySelector('.desc');
        var wordEls   = descEl.querySelectorAll('.word');

        gsap.set([nameInner, kicker, ctaEl], { opacity: 0, y: '100%' });
        gsap.set(wordEls, { opacity: 0, y: '100%' });
        gsap.set([svgArt, artObj], { opacity: 0, y: '0%' });

        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            pin: section,
            pinSpacing: true,
            toggleActions: 'play none none reverse',
            // The pinned beat is the source of truth for the active pillar + bg.
            // Driving this from onUpdate (guarded) is robust to fast scrolling /
            // jumps in a way that onEnter/onLeave toggle callbacks are not.
            onEnter:     function () { setActivePillar(beat.pillar); },
            onEnterBack: function () { setActivePillar(beat.pillar); },
            onUpdate: function (self) {
              setActivePillar(beat.pillar);
              var p = self.progress;
              gsap.set(artObj, { y: -1 * p * (isMobile ? 100 : 200) });
              gsap.set(svgArt, { y: -1 * p * (isMobile ? 30 : 400) });
            }
          }
        });

        tl.to(svgArt, { ease: 'power2.inOut', top: isMobile ? '-50%' : '-40%', opacity: 1 }, '-=1')
          .to(artObj, { ease: 'power2.inOut', top: isMobile ? '-60%' : '-40%', opacity: 1 }, '-=1')
          .to([nameInner, kicker, ctaEl], { ease: 'power2.inOut', y: '0%', opacity: 1, scale: 1 }, '-=1')
          .to(wordEls, { ease: 'power2.inOut', opacity: 1, y: '0%', stagger: { amount: .05, from: 'start' } }, '<');

        /* desktop (and non-last beats on mobile) exit upward behind the next */
        if (!isLast || !isMobile) {
          tl.to([svgArt, artObj], { ease: 'power2.inOut', y: '-100%', opacity: 0 })
            .to([nameInner, kicker, descEl, ctaEl], { ease: 'power2.inOut', y: '-100%', opacity: 0 }, '<');
        }
      });
    }, sectionsEl);

    return function () { ctx.revert(); };
  }

  var mm = gsap.matchMedia();
  mm.add('(min-width: 1025px) and (pointer: fine)', function () { return build(false); });
  mm.add('(max-width: 1024px), (pointer: coarse)', function () { return build(true); });

  /* Keep Lenis' scroll limit in sync with ScrollTrigger's pin-spacers.
     ScrollTrigger inserts ~1 viewport of spacer per pinned beat *after* Lenis
     first measures the page, so without this Lenis caches a far-too-short
     scroll height and every beat below the fold (the whole "work" pillar)
     becomes unreachable with smooth scroll on. resize() re-reads the height. */
  ScrollTrigger.addEventListener('refresh', function () { if (lenis) lenis.resize(); });

  function refreshAll() { ScrollTrigger.refresh(); if (lenis) lenis.resize(); }

  setActivePillar('do');                                   // first paint
  window.addEventListener('load', refreshAll);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(refreshAll, 200); });
})();
