// -----------------------------------------------------------------------------
// Okto Pulse · landing page enhancements
// 1. Copy-to-clipboard on the hero terminal
// 2. Reveal-on-scroll for section heads and product frames
// 3. Analytics consent gate (LGPD) — loads GA4 only after "Aceitar"
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
