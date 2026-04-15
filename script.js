// -----------------------------------------------------------------------------
// Okto Pulse · landing page enhancements
// 1. Copy-to-clipboard on the hero terminal
// 2. Reveal-on-scroll for section heads and product frames
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
