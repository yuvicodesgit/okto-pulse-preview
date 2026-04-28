# CLAUDE.md - Okto Pulse Landing

## Overview

Marketing landing page for **Okto Pulse** (`pulse.oktolabs.ai`). Zero build step — plain HTML/CSS/JS served as static assets.

**Tech Stack**: HTML5, CSS (custom, no framework), Vanilla JS
**Hosting**: Cloudflare Pages (static, no build)
**Status**: Active (pre-launch)

## Essential Commands

```bash
# Local development server
python -m http.server 8765
# → http://localhost:8765

# Deploy: push to main → Cloudflare Pages auto-deploys
```

## Brand & naming

Regra decidida 2026-04-15. **Seguir em toda copy da landing.**

- **`OktoLabs`** (junto, CamelCase) — nome da empresa. Estilo word-mark único tipo GitHub/GitLab/DeepMind.
- **`Okto Pulse`** (separado, dois tempos) — produto. Padrão family/product tipo "Adobe Illustrator", "Google Drive".
- Futuros produtos: `Okto Studio`, `Okto Engine`, `Okto CLI`, `Okto Synthesis`.

**Exemplos:**

| ✅ Correto | ❌ Errado |
|---|---|
| `OktoLabs` | `Okto Labs`, `Oktolabs`, `OKTOLABS` |
| `Okto Pulse` | `OktoPulse`, `oktopulse` |
| `Okto Studio` (futuro) | `OktoStudio` |

**Exceção técnica:** slugs/handles/pacotes ficam junto kebab-case — `okto-pulse`, `OktoLabsAI/okto-pulse`, `pip install okto-pulse`. Convenção **visual** ≠ **técnica**.

## Text casing

- **Default: sentence case** em tags, botões, nav, stat labels (`Try Pulse`, `OktoLabs · Source-available`).
- **Caps reservado a micro-editorial**: eyebrows numerados (`01 · PIPELINE`, `02 · CAPABILITIES`), códigos alfanuméricos (`F·01`, `01 / 05`), siglas (MCP, API, CLI).
- Canonical reference: `../omni_flow_design` (GuidelinesPage e CLAUDE.md).

## Project Structure

```
├── index.html          # Single-page landing
├── styles.css          # All styles (Pulse canonical tokens + components)
├── script.js           # Terminal copy behavior
├── assets/
│   ├── logos/          # OktoLabs + Okto Pulse logo variants
│   └── screenshots/    # Product screenshots
└── README.md
```

## Key Patterns

- **Pulse canonical visual identity** — this page is the SSOT for the Okto visual language. Tokens (`--okto-*`, `--pulse-*`, `--ink-*`, `--space-*`) are then promoted to `omni_flow_design`.
- **Typography**: IBM Plex Sans (display + body, weight 600 for displays) + IBM Plex Mono (code).
- **Palette**: obsidian `#060608` + gradient pulse (cyan→blue→violet→magenta). Rebranding adiado pós-lançamento.
- **Layout**: `--max: 1600px`, `--gutter: clamp(1.25rem, 2.8vw, 2.75rem)`, section pattern `.section__head` + `.section__eyebrow` + `.section__title` + `.section__lede`.

## Things NOT To Do

- Do NOT introduce build tooling (webpack, vite, etc.) — the value is zero overhead.
- Do NOT add runtime JS frameworks (React, Vue, etc.) — stay vanilla.
- Do NOT hardcode hex values — use `var(--okto-*)` tokens.
- Do NOT diverge from IBM Plex typography stack.

## Related Repos

| Repo | Relationship |
|------|-------------|
| `omni_flow_design` | Canonical design system — tokens sync from this landing |
| `omni_flow_site` | Main OktoLabs site — consumes same visual language |
| `OktoLabsAI/okto-pulse` | The actual Pulse product |
