/* ---------- Skalowanie projektu 1920 px (480–1919 px) ----------
   Projekt istnieje tylko w 1920 px, więc na węższych ekranach desktopowych
   strona jest proporcjonalnie pomniejszana zamiast przestawiana. */
(function () {
  var root = document.documentElement;
  function fit() {
    var w = window.innerWidth;
    var on = w >= 480 && w < 1920;
    root.style.zoom = on ? String(w / 1920) : '';
    on ? root.style.setProperty('--vw', '1920px') : root.style.removeProperty('--vw');
  }
  fit();
  window.addEventListener('resize', fit);
})();

/* SOLLUX landing – main.js (vanilla JS, bez bibliotek i bez budowania) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Header – ciemna kopia warstwy (czarne kolory) + stan „solid” po scrollu.
        Przejście biały → czarny realizujemy crossfade'em (tylko opacity),
        zgodnie z zasadą „animuj tylko transform i opacity”.
     --------------------------------------------------------- */
  var header = document.getElementById('header');
  var light = header.querySelector('.header__layer--light');
  var dark = light.cloneNode(true);
  dark.classList.remove('header__layer--light');
  dark.classList.add('header__layer--dark');
  dark.removeAttribute('id');
  dark.setAttribute('aria-hidden', 'true');
  dark.setAttribute('inert', '');
  dark.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
  dark.querySelectorAll('a, button, input').forEach(function (el) { el.tabIndex = -1; });
  light.after(dark);

  // wpisany tekst wyszukiwarki widoczny również w warstwie czarnej
  var realInput = light.querySelector('input');
  var cloneInput = dark.querySelector('input');
  realInput.addEventListener('input', function () { cloneInput.value = realInput.value; });

  var hero = document.getElementById('hero');
  function onScroll() {
    /* getBoundingClientRect działa w tej samej skali co header, także przy zoomie (skalowanie projektu) */
    header.classList.toggle('is-solid', hero.getBoundingClientRect().bottom <= header.getBoundingClientRect().height);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------------------------------------------------
     2. Slider – autoplay co 3 s (pasek postępu to timer: animationend),
        crossfade 600 ms i scale 1.05 → 1.0 robi CSS.
     --------------------------------------------------------- */
  var slides = Array.prototype.slice.call(hero.querySelectorAll('.slide'));
  var tabs = Array.prototype.slice.call(hero.querySelectorAll('.hero__pager button'));
  var current = 0;

  function go(index) {
    index = (index + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var active = i === index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    tabs.forEach(function (t, i) {
      t.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    current = index;
  }

  hero.querySelector('.hero__arrow--prev').addEventListener('click', function () { go(current - 1); });
  hero.querySelector('.hero__arrow--next').addEventListener('click', function () { go(current + 1); });
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      if (i === current) { // restart paska dla tego samego slajdu
        t.setAttribute('aria-selected', 'false');
        void t.offsetWidth;
        t.setAttribute('aria-selected', 'true');
      } else { go(i); }
    });
  });

  if (reduceMotion) {
    hero.classList.add('is-paused'); // bez autoplay – nawigacja strzałkami
  } else {
    hero.querySelector('.hero__pager').addEventListener('animationend', function (e) {
      if (e.animationName === 'fill') go(current + 1);
    });
  }

  /* ---------------------------------------------------------
     3. Lampy w hero – ruch za kursorem (paralaksa) + klik włącza/wyłącza światło
     --------------------------------------------------------- */
  var lamps = Array.prototype.slice.call(hero.querySelectorAll('.lamp'));
  lamps.forEach(function (lamp) {
    lamp.addEventListener('click', function () {
      var on = !lamp.classList.contains('is-on');
      lamp.classList.toggle('is-on', on);
      lamp.setAttribute('aria-pressed', String(on));
      lamp.setAttribute('aria-label', (on ? 'Wyłącz' : 'Włącz') + lamp.getAttribute('aria-label').replace(/^(Włącz|Wyłącz)/, ''));
    });
  });

  if (!reduceMotion) {
    var target = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, raf = null;

    function tick() {
      pos.x += (target.x - pos.x) * 0.08;
      pos.y += (target.y - pos.y) * 0.08;
      lamps.forEach(function (lamp) {
        var d = parseFloat(lamp.dataset.depth) || 1;
        lamp.style.setProperty('--tx', (-pos.x * d * 16).toFixed(2) + 'px');
        lamp.style.setProperty('--ty', (-pos.y * d * 11).toFixed(2) + 'px');
        lamp.style.setProperty('--rot', (pos.x * d * 1.4).toFixed(3) + 'deg');
      });
      if (Math.abs(target.x - pos.x) > 0.001 || Math.abs(target.y - pos.y) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else { raf = null; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    });
    hero.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; kick(); });
  }

  /* ---------------------------------------------------------
     4. Sekcja shader – WebGL w czasie rzeczywistym, bez GIF/wideo.
        Pętla idealnie ciągła: czas wchodzi do szumu wyłącznie przez cos/sin(faza),
        więc po 25 s stan jest identyczny z początkowym (brak cięcia).
     --------------------------------------------------------- */
  var section = document.getElementById('shader');
  var canvas = document.getElementById('shader-canvas');
  var CYCLE = 25; // sekundy na pełny cykl

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uPhase;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.02 + vec2(17.3, 9.1); a *= 0.5; } return v; }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  float asp = uRes.x / uRes.y;',
    '  vec2 p = vec2((uv.x - 0.5) * asp, uv.y);',
    '  float ang = 0.62;',
    '  mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));',
    '  vec2 q = R * p;',
    '  vec2 loop = vec2(cos(uPhase), sin(uPhase));',
    '  vec2 w = vec2(fbm(q * 1.3 + loop * 0.9), fbm(q * 1.3 + 5.2 - loop.yx * 0.9));',
    '  float s = fbm(vec2(q.x * 1.6, q.y * 0.35) + w * 1.2 + loop * 0.6);',
    '  float bands = smoothstep(0.36, 0.78, s);',
    '  float yw = 1.0 - smoothstep(0.0, 0.82, uv.y + (w.x - 0.5) * 0.28);',
    '  float I = yw * (0.22 + 0.95 * bands) + 0.28 * pow(yw, 3.0);',
    '  vec3 base = vec3(0.063, 0.063, 0.070);',
    '  vec3 amber = vec3(0.60, 0.45, 0.08);',
    '  vec3 gold = vec3(0.95, 0.75, 0.15);',
    '  vec3 col = mix(base, amber, smoothstep(0.0, 0.55, I));',
    '  col = mix(col, gold, smoothstep(0.45, 1.1, I));',
    '  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function fallback() {
    // brak WebGL: statyczny gradient w podobnej tonacji
    section.style.background = 'radial-gradient(120% 70% at 30% 110%, #f2bf25 0, #8a6a14 38%, #101011 75%)';
  }

  try {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('no webgl');

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'uRes');
    var uPhase = gl.getUniformLocation(prog, 'uPhase');

    // treść jest miękka i rozmyta – 0.5 rozdzielczości w zupełności wystarcza i oszczędza GPU
    var SCALE = 0.5;
    function resize() {
      var w = Math.max(2, Math.round(canvas.clientWidth * SCALE));
      var h = Math.max(2, Math.round(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    var running = false, visible = true, startTs = null, frame = null, staticT = 6; // 6 s = ładna klatka statyczna

    function draw(seconds) {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uPhase, (seconds % CYCLE) / CYCLE * Math.PI * 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(ts) {
      if (startTs === null) startTs = ts;
      draw((ts - startTs) / 1000);
      frame = requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduceMotion) { running = true; frame = requestAnimationFrame(loop); } }
    function stop() { running = false; if (frame) cancelAnimationFrame(frame); frame = null; }

    if (reduceMotion) {
      draw(staticT);
      window.addEventListener('resize', function () { draw(staticT); });
    } else {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { threshold: 0 }).observe(section);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else if (visible) start();
      });
      draw(staticT); // pierwsza klatka od razu
    }
  } catch (err) {
    console.warn('Shader fallback:', err);
    fallback();
  }
})();
