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
    ".when__list > li",
    ".system-map__copy > article",
    ".pipeline > .pipeline__step",
    ".value-compare .value-card",
    ".surface-story > .surface-panel",
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
    ".mcp__code",
    ".section__impact",
    ".install__cta",
    ".final-cta",
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
