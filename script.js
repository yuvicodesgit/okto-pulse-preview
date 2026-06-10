// -----------------------------------------------------------------------------
// Okto Pulse · landing page enhancements
// 1. Copy-to-clipboard on the hero terminal
// 2. Scramble composition for the control-loss console
// 3. Analytics consent gate (LGPD) — loads analytics only after consent
// 4. Mobile menu, scroll progress + scrollspy, staggered reveals,
//    stat counters, pointer glow, back-to-top — all progressive enhancement
// -----------------------------------------------------------------------------

const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

(() => {
  // -- copy to clipboard on the hero terminal ----------------------------
  const terminals = document.querySelectorAll(".terminal[data-copy]");
  terminals.forEach((term) => {
    const btn = term.querySelector(".terminal__copy");
    const code = term.querySelector("code");
    if (!btn || !code) return;

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        term.setAttribute("data-copied", "1");
        setTimeout(() => term.removeAttribute("data-copied"), 1800);
      } catch {
        /* clipboard blocked — fail silently */
      }
    });
  });
})();

(() => {
  // -- control-loss console text composition -----------------------------
  const consoles = document.querySelectorAll("[data-scramble-console]");
  if (!consoles.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-\"";

  const compose = (el) => {
    const finalText = el.getAttribute("data-scramble") || el.textContent;
    let frame = 0;
    const hold = 10 + finalText.length * 2;

    el.classList.add("is-composing");

    const tick = () => {
      const progress = Math.min(1, frame / hold);
      const resolved = Math.floor(progress * finalText.length);
      let next = "";

      for (let i = 0; i < finalText.length; i += 1) {
        if (i < resolved || finalText[i] === " ") {
          next += finalText[i];
        } else {
          next += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      el.textContent = next;
      frame += 1;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
        el.classList.remove("is-composing");
      }
    };

    tick();
  };

  const composeConsole = (consoleEl) => {
    consoleEl.querySelectorAll("[data-scramble]").forEach((el) => {
      const lineIndex = Number(el.closest(".loss-console__line")?.style.getPropertyValue("--line-i") || 0);
      window.setTimeout(() => compose(el), lineIndex * 70);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const consoleEl = entry.target;
      const existingTimer = Number(consoleEl.dataset.scrambleTimer);

      if (!entry.isIntersecting) {
        if (existingTimer) {
          window.clearInterval(existingTimer);
          delete consoleEl.dataset.scrambleTimer;
        }
        return;
      }

      if (existingTimer) return;
      composeConsole(consoleEl);
      consoleEl.dataset.scrambleTimer = String(window.setInterval(() => composeConsole(consoleEl), 5000));
    });
  }, { threshold: 0.55 });

  consoles.forEach((consoleEl) => observer.observe(consoleEl));
})();

(() => {
  // -- analytics consent gate --------------------------------------------
  const GA_ID = "GA4_MEASUREMENT_ID";
  const CF_BEACON_TOKEN = "CF_BEACON_TOKEN";
  const STORAGE_KEY = "okto_consent";
  const banner = document.getElementById("consent");
  if (!banner) return;

  let gaLoaded = false;
  let cfLoaded = false;
  const hasGA = GA_ID && !GA_ID.startsWith("GA4_");
  const hasCF = CF_BEACON_TOKEN && !CF_BEACON_TOKEN.startsWith("CF_");

  if (!hasGA && !hasCF) return;

  const loadGA = () => {
    if (gaLoaded || !hasGA) return;
    gaLoaded = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
  };

  const loadCF = () => {
    if (cfLoaded || !hasCF) return;
    cfLoaded = true;
    const s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.dataset.cfBeacon = JSON.stringify({ token: CF_BEACON_TOKEN });
    document.head.appendChild(s);
  };

  const loadAnalytics = () => {
    loadGA();
    loadCF();
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "granted") {
    loadAnalytics();
  } else if (stored !== "denied") {
    banner.hidden = false;
  }

  banner.querySelectorAll("[data-consent]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-consent");
      localStorage.setItem(STORAGE_KEY, choice);
      banner.hidden = true;
      if (choice === "granted") loadAnalytics();
    });
  });
})();

(() => {
  // -- mobile menu --------------------------------------------------------
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) setOpen(false);
  });

  // Close the panel if the viewport grows past the breakpoint while open
  window.matchMedia("(min-width: 901px)").addEventListener("change", (mq) => {
    if (mq.matches && !menu.hidden) setOpen(false);
  });
})();

(() => {
  // -- nav: scroll progress, condensed state, scrollspy -------------------
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const aurora = document.querySelector(".ambient__aurora");
  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    nav.style.setProperty("--scroll-progress", progress.toFixed(4));
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    if (aurora && !PREFERS_REDUCED_MOTION) {
      // gentle parallax: the glow drifts slower than the page
      aurora.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.05, 120)}px, 0)`;
    }
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();

  // scrollspy — highlight the nav link of the section in view
  const links = new Map();
  document.querySelectorAll('.nav__links a[href^="#"]').forEach((link) => {
    links.set(link.getAttribute("href").slice(1), link);
  });
  if (!links.size || !("IntersectionObserver" in window)) return;

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = links.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove("is-active"));
        link.classList.add("is-active");
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });

  links.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });
})();

(() => {
  // -- staggered scroll reveals -------------------------------------------
  // Classes are only added with JS available, so no-JS visitors, crawlers,
  // and screenshots always see the final layout (see styles.css note).
  if (PREFERS_REDUCED_MOTION) return;

  const groupSelectors = [
    ".problem__grid > .risk-card",
    ".act1__when > li",
    ".system-map__copy > article",
    ".pipeline > .pipeline__step",
    ".grid--features > .feature",
    ".audience > .audience-card",
    ".claims-grid > span",
    ".install > .install__step",
    ".mcp__tools > span",
  ];
  const singleSelectors = [
    ".section__head",
    ".problem__bottom",
    ".problem__mid",
    ".problem__close",
    ".when__impact",
    ".control-plane",
    ".compare",
    ".mcp__code",
    ".section__impact",
    ".install__cta",
    ".final-cta",
    // kinetic statements hide their words until .is-in lands on the element
    // itself, so every [data-kinetic] must be swept directly
    "[data-kinetic]",
  ];

  const targets = [];
  groupSelectors.forEach((selector) => {
    const byParent = new Map();
    document.querySelectorAll(selector).forEach((el) => {
      const parent = el.parentElement;
      const index = byParent.get(parent) || 0;
      byParent.set(parent, index + 1);
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-i", String(Math.min(index, 7)));
      targets.push(el);
    });
  });
  singleSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.setAttribute("data-reveal", "");
      targets.push(el);
    });
  });
  if (!targets.length) return;

  document.documentElement.classList.add("js-reveal");

  // Scroll-driven (not IntersectionObserver) so the reveal line is the same
  // deterministic pipeline as the pulse spine below.
  let pending = targets.slice();
  let ticking = false;

  const sweep = () => {
    ticking = false;
    const line = window.scrollY + window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > line) return true;
      el.classList.add("is-in");
      return false;
    });
    if (!pending.length) window.removeEventListener("scroll", onScroll);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  sweep();
})();

(() => {
  // -- pulse spine: an EKG line that draws itself as you scroll ------------
  // Generated entirely from JS so no-JS visitors see nothing extra.
  const main = document.querySelector("main");
  if (!main) return;

  const NS = "http://www.w3.org/2000/svg";
  const holder = document.createElement("div");
  holder.className = "spine";
  holder.setAttribute("aria-hidden", "true");
  document.body.appendChild(holder);

  let trace = null;
  let head = null;
  let nodes = [];
  let total = 0;
  let startY = 0;
  let endY = 0;
  let target = 0;
  let current = 0;
  let rafId = null;

  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  const build = () => {
    holder.innerHTML = "";
    nodes = [];

    const sections = Array.from(main.querySelectorAll(":scope > section")).slice(1);
    if (!sections.length) return;

    const mobile = window.matchMedia("(max-width: 680px)").matches;
    const x = mobile ? 11 : 26;
    const amp = mobile ? 5 : 7;

    startY = docTop(sections[0]) + 28;
    endY = docTop(main) + main.offsetHeight - 48;
    if (endY - startY < 400) return;

    let d = `M ${x} ${startY}`;
    const stops = [];
    sections.forEach((section) => {
      const y = docTop(section) + 104;
      if (y < startY + 60 || y > endY - 80) return;
      // EKG blip: short zig across the rail, then back on axis
      d += ` L ${x} ${y - 26} l ${amp} ${7} l ${-amp * 2} ${12} l ${amp} ${7}`;
      stops.push(y);
    });
    d += ` L ${x} ${endY}`;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "64");
    svg.setAttribute("height", String(Math.ceil(endY)));
    svg.setAttribute("viewBox", `0 0 64 ${Math.ceil(endY)}`);

    const defs = document.createElementNS(NS, "defs");
    const grad = document.createElementNS(NS, "linearGradient");
    grad.setAttribute("id", "spineGradient");
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", String(startY));
    grad.setAttribute("x2", "0");
    grad.setAttribute("y2", String(endY));
    [
      ["0%", "#22d3ee"],
      ["38%", "#3b82f6"],
      ["72%", "#a855f7"],
      ["100%", "#ec4899"],
    ].forEach(([offset, color]) => {
      const stop = document.createElementNS(NS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    const guide = document.createElementNS(NS, "path");
    guide.setAttribute("class", "spine__guide");
    guide.setAttribute("d", d);
    svg.appendChild(guide);

    trace = document.createElementNS(NS, "path");
    trace.setAttribute("class", "spine__trace");
    trace.setAttribute("d", d);
    svg.appendChild(trace);

    stops.forEach((y) => {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("class", "spine__node");
      node.setAttribute("cx", String(x));
      node.setAttribute("cy", String(y));
      node.setAttribute("r", "3.2");
      svg.appendChild(node);
      nodes.push({ el: node, y });
    });

    head = document.createElementNS(NS, "circle");
    head.setAttribute("class", "spine__head");
    head.setAttribute("r", "4");
    svg.appendChild(head);

    holder.appendChild(svg);

    total = trace.getTotalLength();
    trace.style.strokeDasharray = `${total} ${total}`;
    trace.style.strokeDashoffset = String(total);

    if (PREFERS_REDUCED_MOTION) {
      // Static fallback: fully drawn line, all nodes lit, no comet head
      trace.style.strokeDashoffset = "0";
      nodes.forEach((n) => n.el.classList.add("is-lit"));
      head.remove();
      return;
    }

    current = -1;
    retarget();
    kick();
  };

  const retarget = () => {
    const anchor = window.scrollY + window.innerHeight * 0.7;
    target = Math.min(1, Math.max(0, (anchor - startY) / (endY - startY)));
  };

  const frame = () => {
    rafId = null;
    if (!trace) return;
    current += (target - current) * 0.16;
    if (Math.abs(target - current) < 0.0004) current = target;

    const drawn = total * current;
    trace.style.strokeDashoffset = String(Math.max(0, total - drawn));

    const point = trace.getPointAtLength(Math.max(0, drawn));
    head.setAttribute("cx", String(point.x));
    head.setAttribute("cy", String(point.y));
    head.style.opacity = current > 0.004 && current < 0.998 ? "1" : "0";

    nodes.forEach((node) => {
      node.el.classList.toggle("is-lit", point.y >= node.y - 4);
    });

    if (current !== target) kick();
  };

  const kick = () => {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  };

  if (PREFERS_REDUCED_MOTION) {
    window.addEventListener("load", build);
    build();
    return;
  }

  window.addEventListener("scroll", () => {
    retarget();
    kick();
  }, { passive: true });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 180);
  });
  window.addEventListener("load", build);
  build();
})();

(() => {
  // -- hero stat counters ---------------------------------------------------
  const stats = document.querySelectorAll(".stat__value[data-count]");
  if (!stats.length || PREFERS_REDUCED_MOTION || !("IntersectionObserver" in window)) return;

  const animate = (el) => {
    const final = parseInt(el.getAttribute("data-count"), 10);
    if (!Number.isFinite(final)) return;
    const duration = 1200;
    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = String(Math.round(final * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  stats.forEach((el) => io.observe(el));
})();

(() => {
  // -- pointer-tracking glow on cards (desktop pointers only) --------------
  if (PREFERS_REDUCED_MOTION) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const selector = [
    ".risk-card",
    ".when__list li",
    ".system-map__copy article",
    ".pipeline__step",
    ".value-card",
    ".feature",
    ".audience-card",
    ".claims-grid span",
    ".install__step",
    ".knowledge__node",
    ".highlight",
  ].join(", ");

  document.querySelectorAll(selector).forEach((card) => {
    card.classList.add("glow-track");
    const spot = document.createElement("span");
    spot.className = "glow-spot";
    spot.setAttribute("aria-hidden", "true");
    card.prepend(spot);
  });

  let frame = null;
  document.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".glow-track");
    if (!card || frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  }, { passive: true });
})();

(() => {
  // -- back to top ----------------------------------------------------------
  const button = document.getElementById("toTop");
  if (!button) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      button.classList.toggle("is-visible", window.scrollY > window.innerHeight * 1.2);
    });
  }, { passive: true });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: PREFERS_REDUCED_MOTION ? "auto" : "smooth" });
  });
})();

(() => {
  // -- narrative layer flags ------------------------------------------------
  // js-pin: pinned scroll scenes (desktop only); js-stage / js-compare:
  // layout modes that need JS to switch content, so no-JS keeps the
  // plain stacked fallbacks defined in styles.css.
  const docEl = document.documentElement;
  docEl.classList.add("js-stage", "js-compare");
  if (PREFERS_REDUCED_MOTION) return;

  const mq = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
  const apply = () => docEl.classList.toggle("js-pin", mq.matches);
  apply();
  mq.addEventListener("change", apply);
})();

(() => {
  // -- kinetic type: split statements into per-word spans -------------------
  if (PREFERS_REDUCED_MOTION) return;

  document.querySelectorAll("[data-kinetic]").forEach((el) => {
    let w = 0;
    const wrap = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          // <i>, not <span>: legacy selectors like ".problem__close span"
          // style direct spans and must not match these word wrappers
          const word = document.createElement("i");
          word.className = "kword";
          word.style.setProperty("--w", String(w++));
          word.textContent = part;
          frag.appendChild(word);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // gradient text uses background-clip: text, which does not survive
        // per-word inline-blocks — animate those elements as one unit
        const cs = getComputedStyle(node);
        const clip = cs.webkitBackgroundClip || cs.backgroundClip || "";
        if (clip.includes("text")) {
          node.classList.add("kword", "kword--unit");
          node.style.setProperty("--w", String(w++));
          if (cs.display === "inline") node.style.display = "inline-block";
          return;
        }
        Array.from(node.childNodes).forEach(wrap);
      }
    };
    Array.from(el.childNodes).forEach(wrap);
  });
})();

(() => {
  // -- Act 1: pinned problem scene with degrading EKG -----------------------
  const stage = document.querySelector(".act1__stage");
  const track = document.querySelector(".act1__track");
  const canvas = document.querySelector(".act1__ekg");
  if (!stage || !track || !canvas || PREFERS_REDUCED_MOTION) return;

  const finaleKinetics = stage.querySelectorAll(".act1__scene--finale [data-kinetic]");
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let p = 0;
  let raf = null;

  const phaseFor = (v) => (v < 0.2 ? 0 : v < 0.52 ? 1 : v < 0.78 ? 2 : 3);

  const sizeCanvas = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Heartbeat trace: amplitude decays and color bleeds to red as p grows,
  // with a band of glitch jitter in the middle, ending in a flatline.
  const draw = () => {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    const fade = Math.min(1, p * 1.25);
    const amp = Math.max(0, 1 - p * 1.18);
    const jitter = p > 0.4 && p < 0.82 ? (p - 0.4) * 30 : 0;
    const base = H * 0.5;
    const r = Math.round(34 + (248 - 34) * fade);
    const g = Math.round(211 - (211 - 113) * fade);
    const b = Math.round(238 - (238 - 113) * fade);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.55)`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    const beat = 240;
    for (let x = 0; x <= W; x += 4) {
      const t = (x % beat) / beat;
      let y = 0;
      if (t > 0.42 && t < 0.46) y = -34;
      else if (t >= 0.46 && t < 0.52) y = 64;
      else if (t >= 0.52 && t < 0.56) y = -18;
      else if (t > 0.7 && t < 0.78) y = -10 * Math.sin(((t - 0.7) / 0.08) * Math.PI);
      let py = base + y * amp;
      if (jitter) py += (Math.random() - 0.5) * jitter;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  };

  const update = () => {
    raf = null;
    if (!document.documentElement.classList.contains("js-pin")) return;
    const rect = track.getBoundingClientRect();
    const span = track.offsetHeight - window.innerHeight;
    if (span <= 0) return;
    p = Math.min(1, Math.max(0, -rect.top / span));
    const phase = phaseFor(p);
    if (String(phase) !== stage.dataset.phase) {
      stage.dataset.phase = String(phase);
      finaleKinetics.forEach((el) => el.classList.toggle("is-in", phase >= 3));
    }
    if (rect.top < window.innerHeight && rect.bottom > 0) draw();
  };

  const kick = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", () => {
    sizeCanvas();
    kick();
  });
  window.addEventListener("load", () => {
    sizeCanvas();
    kick();
  });
  sizeCanvas();
  kick();
})();

(() => {
  // -- Act 2: resuscitation spike + control plane assembly ------------------
  if (PREFERS_REDUCED_MOTION) return;
  const resus = document.querySelector(".resus");
  const map = document.querySelector(".solution-map");

  const links = map ? Array.from(map.querySelectorAll(".solution-map__links path")) : [];
  const groups = map
    ? [
        map.querySelector(".solution-map__cluster--intent"),
        map.querySelector(".solution-map__hub"),
        map.querySelector(".solution-map__cluster--agents"),
        map.querySelector(".solution-map__cluster--evidence"),
        map.querySelector(".solution-map__graph"),
      ].filter(Boolean)
    : [];

  if (map) {
    map.classList.add("sys-armed");
    links.forEach((path) => {
      path.setAttribute("pathLength", "100");
      path.style.strokeDasharray = "100";
      path.style.strokeDashoffset = "100";
      path.style.animation = "none";
    });
  }

  let raf = null;
  const update = () => {
    raf = null;
    const vh = window.innerHeight;

    if (resus && !resus.classList.contains("is-alive")) {
      const r = resus.getBoundingClientRect();
      if (r.top < vh * 0.78 && r.bottom > 0) resus.classList.add("is-alive");
    }

    if (map) {
      const r = map.getBoundingClientRect();
      const pr = Math.min(1, Math.max(0, (vh * 0.86 - r.top) / Math.min(r.height, vh * 0.9)));
      links.forEach((path, i) => {
        if (path.dataset.done) return;
        const local = Math.min(1, Math.max(0, pr * 1.6 - i * 0.14));
        if (local >= 1) {
          // restore the CSS marching-dash flow once fully drawn
          path.style.animation = "";
          path.style.strokeDasharray = "";
          path.style.strokeDashoffset = "";
          path.removeAttribute("pathLength");
          path.dataset.done = "1";
        } else {
          path.style.strokeDashoffset = String(100 - local * 100);
        }
      });
      groups.forEach((el, i) => {
        el.classList.toggle("is-on", pr > 0.12 + i * 0.14);
      });
    }
  };

  const kick = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("load", kick);
  kick();
})();

(() => {
  // -- Act 3a: [data-live] cascades — fire once when scrolled into view ------
  if (PREFERS_REDUCED_MOTION) return;
  const targets = Array.from(document.querySelectorAll("[data-live]"));
  if (!targets.length) return;

  let pending = targets.slice();
  let raf = null;

  const sweep = () => {
    raf = null;
    const line = window.scrollY + window.innerHeight * 0.78;
    pending = pending.filter((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > line) return true;
      el.classList.add("is-live");
      return false;
    });
    if (!pending.length) window.removeEventListener("scroll", onScroll);
  };

  const onScroll = () => {
    if (raf === null) raf = requestAnimationFrame(sweep);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  sweep();
})();

(() => {
  // -- audience cards: 3D tilt on hover (fine pointers only) -----------------
  if (PREFERS_REDUCED_MOTION) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".audience-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      // inline transition overrides the slow reveal transition while tilting
      card.style.transition = "transform 160ms ease-out";
      card.style.transform =
        `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) ` +
        `rotateY(${(px * 7).toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
      card.style.transition = "";
    });
  });
})();

(() => {
  // -- Act 3b: evidence stage — sticky frame with crossfading shots ----------
  const shots = document.querySelector(".stage-ev__shots");
  const pathLabel = document.querySelector("[data-stage-path]");
  const chapters = Array.from(document.querySelectorAll(".stage-ev__chapter"));
  if (!shots || !chapters.length) return;

  let raf = null;
  let active = -1;

  const update = () => {
    raf = null;
    const line = window.innerHeight * 0.52;
    let next = 0;
    chapters.forEach((chapter, i) => {
      if (chapter.getBoundingClientRect().top < line) next = i;
    });
    if (next === active) return;
    active = next;
    shots.dataset.active = String(next);
    chapters.forEach((chapter, i) => chapter.classList.toggle("is-active", i === next));
    if (pathLabel) pathLabel.textContent = chapters[next].dataset.path || "";
  };

  const kick = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  window.addEventListener("load", kick);
  kick();
})();

(() => {
  // -- compare slider (Value before/after) -----------------------------------
  const compare = document.querySelector("[data-compare]");
  if (!compare) return;
  const range = compare.querySelector(".compare__range");
  if (!range) return;

  const set = (value) => compare.style.setProperty("--cut", `${value}%`);
  range.addEventListener("input", () => set(range.value));
  set(range.value);
})();

(() => {
  // -- nav: current-section context label ------------------------------------
  const label = document.querySelector(".nav__context");
  if (!label || !("IntersectionObserver" in window)) return;

  const sections = Array.from(document.querySelectorAll("main section")).filter((section) =>
    section.querySelector(".section__eyebrow")
  );
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const eyebrow = entry.target.querySelector(".section__eyebrow");
        if (!eyebrow) return;
        label.textContent = eyebrow.textContent.trim();
        label.classList.add("is-on");
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );
  sections.forEach((section) => io.observe(section));

  const hero = document.querySelector(".hero");
  if (hero) {
    const heroIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) label.classList.remove("is-on");
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    heroIo.observe(hero);
  }
})();
