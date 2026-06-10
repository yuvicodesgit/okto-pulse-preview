# Okto Pulse — Landing Page

Static marketing site for [Okto Pulse](https://pypi.org/project/okto-pulse/), the spec-driven project management board with 218 MCP tools, 15 governance gates, and native MCP support from [OktoLabs](https://oktolabs.ai).

## Stack

Plain HTML, CSS, and a sliver of JavaScript. No build step.

- `index.html` — page structure
- `styles.css` — all visual styling (CSS variables, dark obsidian theme, IBM Plex typography)
- `script.js` — copy-to-clipboard on the install command
- `assets/logos/` — OktoLabs and Okto Pulse wordmarks
- `assets/screenshots/` — real product captures used across the page

## Sections

1. Hero
2. Product showcase (kanban)
3. Pipeline — stories to validation in six controlled stages
4. Capabilities — six feature cards
5. Differentiation — six agent roles with permission grids
6. The board — tab-by-tab product tour
7. Insight — analytics dashboard
8. Protocol — MCP integration
9. Getting started — four-command install

## Run locally

```bash
python -m http.server 8765
```

Then open http://127.0.0.1:8765.

## Deploy

Automatic deployment to Cloudflare Pages runs on push to `main` via GitHub
Actions. Pull requests targeting `main` create Cloudflare Pages preview
deployments.

The workflow deploys to the `okto-pulse-landing-page` Pages project and
requires the `CLOUDFLARE_API_TOKEN` repository secret.

## License

Copyright (c) 2024–2026 OktoLabs. All rights reserved.
