// -----------------------------------------------------------------------------
// Okto Pulse · landing page enhancements
// 1. Copy-to-clipboard on the hero terminal
// 2. Scramble composition for the control-loss console
// 3. Analytics consent gate (LGPD) — loads analytics only after consent
// -----------------------------------------------------------------------------

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
  const targets = document.querySelectorAll("[data-scramble]");
  if (!targets.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      window.setTimeout(() => compose(el), Number(el.closest(".loss-console__line")?.style.getPropertyValue("--line-i") || 0) * 70);
    });
  }, { threshold: 0.55 });

  targets.forEach((el) => observer.observe(el));
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
