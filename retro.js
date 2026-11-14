/* retro.js -- the 1997 furniture for stevenbleifer.com.
 *
 * Adds the scrolling news bar, footer badges, visit counter, webring and cursor
 * sparkles. Loaded with `defer` from every page. It builds everything with
 * createElement/textContent (never innerHTML), talks to no server, and stores
 * only two keys in this browser's localStorage: a visit count and the
 * effects on/off switch.
 *
 * <script src="retro.js" defer data-retro="full|skin|minimal">
 *   full    - main pages (style.css): extras go inside the page footer
 *   skin    - standalone pages: news bar on top, extras appended to <body>
 *   minimal - full-screen apps: sparkles only, layout untouched
 */
(function () {
  'use strict';

  // Refuse to run inside someone else's frame (clickjacking guard; GitHub Pages
  // cannot send X-Frame-Options, and frame-ancestors is ignored in <meta> CSP).
  try {
    if (window.top !== window.self) {
      document.documentElement.style.display = 'none';
      window.top.location = window.self.location.href;
      return;
    }
  } catch (e) {
    document.documentElement.style.display = 'none';
    return;
  }

  var script = document.currentScript;
  var mode = (script && script.getAttribute('data-retro')) || 'full';
  var base = script ? script.src.replace(/retro\.js(\?.*)?$/, '') : '';
  var img = function (name) { return base + 'images/retro/' + name + '.gif'; };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* private mode: carry on without it */ }
    return null;
  }

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fxOn = store('retro-fx') !== 'off' && !reduced;
  if (!fxOn) root.classList.add('fx-off');

  // ---- mobile nav button (was an inline onclick) ----
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
  }

  // ---- scrolling news bar ----
  if (mode !== 'minimal') {
    var news = '*** WELCOME TO STEVENBLEIFER.COM *** STEVEN BLEIFER\'S PERSONAL HOME PAGE ON THE ' +
      'INFORMATION SUPERHIGHWAY *** NOW 100% Y2K COMPLIANT *** BOOKMARK THIS PAGE (CTRL+D) *** ' +
      'HAND CODED IN PLAIN HTML *** NO COOKIES, NO TRACKERS, NO POP-UPS *** ' +
      'BEST VIEWED IN NETSCAPE NAVIGATOR 3.0 AT 800x600 *** THANKS FOR SURFING BY ***';
    var bar = el('div', { 'class': 'marquee-bar', 'aria-hidden': 'true' }, [
      el('span', { 'class': 'marquee-track', text: news })
    ]);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // ---- footer extras ----
  var ring = [
    ['index.html', 'Home'], ['resume.html', 'Resume'], ['activity.html', 'Library'],
    ['claude-code.html', 'Projects'], ['vinyl.html', 'Vinyl'], ['groovekeeper.html', 'GrooveKeeper'],
    ['displays.html', 'Displays'], ['itunes-remote.html', 'iTunes Remote'], ['local-ai.html', 'Local AI'],
    ['study/', 'Study'], ['pomodoro.html', 'Pomodoro'], ['contact.html', 'Contact']
  ];

  function ringLinks() {
    var here = window.location.href.split(/[?#]/)[0];
    var at = -1;
    ring.forEach(function (r, i) {
      var full = base + r[0];
      if (here === full || here === full + 'index.html' || (r[0] === 'index.html' && here === base)) at = i;
    });
    var n = ring.length;
    var prev = ring[(at < 0 ? n - 1 : at + n - 1) % n];
    var next = ring[(at + 1) % n];
    var rand = ring[Math.floor(Math.random() * n)];
    return el('p', {}, [
      el('span', { 'class': 'webring' }, [
        el('b', { text: 'The Bleifer WebRing' }), '  ',
        el('a', { href: base + prev[0], text: '<< Prev' }), '|',
        el('a', { href: base + rand[0], text: 'Random' }), '|',
        el('a', { href: base + next[0], text: 'Next >>' })
      ])
    ]);
  }

  function badge(cls, top, bottom) {
    return el('span', { 'class': 'badge88 ' + cls }, [el('b', { text: top }), el('span', { text: bottom })]);
  }

  function extras() {
    var visits = parseInt(store('retro-visits'), 10);
    visits = (isFinite(visits) && visits > 0 ? visits : 0) + 1;
    store('retro-visits', String(visits));
    var digits = ('000000' + visits).slice(-6);

    var fx = el('button', { type: 'button', 'class': 'fx-toggle' });
    function label() { fx.textContent = fxOn ? 'Turn animations OFF' : 'Turn animations ON'; }
    label();
    fx.addEventListener('click', function () {
      fxOn = !fxOn;
      store('retro-fx', fxOn ? 'on' : 'off');
      root.classList.toggle('fx-off', !fxOn);
      label();
    });

    return el('div', { 'class': 'retro-extras' }, [
      el('img', { 'class': 'fire', src: img('fire'), alt: '', width: '128', height: '20' }),
      el('p', {}, [
        el('img', { 'class': 'worker', src: img('worker'), alt: '', width: '44', height: '52' }),
        el('img', { 'class': 'construction', src: img('construction'), alt: 'Always under construction', width: '360', height: '46' }),
        el('img', { 'class': 'worker flip', src: img('worker'), alt: '', width: '44', height: '52' })
      ]),
      el('p', { 'class': 'counter' }, [
        'You have surfed in ', el('span', { 'class': 'digits', text: digits }), ' times (counted in your own browser)'
      ]),
      ringLinks(),
      el('p', { 'class': 'badges' }, [
        el('img', { src: img('badge_800'), alt: 'Best viewed at 800x600', width: '88', height: '31' }),
        el('img', { src: img('badge_html'), alt: 'Made with plain HTML', width: '88', height: '31' }),
        el('img', { src: img('badge_mac'), alt: 'Hand coded on a Macintosh', width: '88', height: '31' }),
        badge('y2k', 'Y2K', 'compliant'),
        badge('secure', 'No cookies', 'no trackers'),
        badge('any', 'Any browser', 'welcome'),
        badge('free', '100% free', 'of pop-ups')
      ]),
      el('p', { 'class': 'mailrow' }, [
        el('img', { src: img('cow-pixel'), alt: 'A small spinning cow', width: '64', height: '34' }),
        el('img', { src: img('mail'), alt: '', width: '32', height: '32' }),
        el('a', { href: base + 'contact.html', text: 'E-mail the webmaster' }),
        '   ', fx
      ]),
      el('p', { text: 'Best viewed in Netscape Navigator 3.0 at 800×600 with 256 colors.' })
    ]);
  }

  if (mode === 'full') {
    var footer = document.querySelector('.footer') || document.querySelector('.container, .container-narrow');
    if (footer) footer.appendChild(extras());
  } else if (mode === 'skin') {
    // pages whose <body> is a flex row need to wrap so the footer gets its own line
    var bodyStyle = window.getComputedStyle(document.body);
    if (bodyStyle.display.indexOf('flex') !== -1 && bodyStyle.flexDirection.indexOf('row') === 0) {
      document.body.style.flexWrap = 'wrap';
      document.body.style.alignContent = 'center';
    }
    document.body.appendChild(el('div', { 'class': 'retro-skin-footer' }, [extras()]));
  }

  // ---- scrolling title bar ----
  var title = document.title + '  ***  ';
  var titleAt = 0;
  setInterval(function () {
    if (!fxOn || document.hidden || mode === 'minimal') { if (titleAt) { document.title = title.slice(0, -7); titleAt = 0; } return; }
    titleAt = (titleAt + 1) % title.length;
    document.title = title.slice(titleAt) + title.slice(0, titleAt);
  }, 450);

  // ---- cursor sparkle trail (mouse only) ----
  var glyphs = ['*', '+', '.', '★', '✦'];
  var colors = ['#ffff00', '#00ffff', '#ff00ff', '#00ff00', '#ff8800', '#ffffff'];
  var last = 0;
  document.addEventListener('mousemove', function (e) {
    var now = Date.now();
    if (!fxOn || now - last < 45) return;
    last = now;
    var s = el('span', { 'class': 'cursor-sparkle', 'aria-hidden': 'true',
      text: glyphs[Math.floor(Math.random() * glyphs.length)] });
    s.style.left = (e.clientX + Math.random() * 16 - 8) + 'px';
    s.style.top = (e.clientY + Math.random() * 16 - 8) + 'px';
    s.style.color = colors[Math.floor(Math.random() * colors.length)];
    s.style.fontSize = (10 + Math.random() * 12) + 'px';
    document.body.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 800);
  });
})();
