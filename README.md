# Okto Pulse — Landing Page

Static marketing site for [Okto Pulse](https://pypi.org/project/okto-pulse/), the spec-driven project management board with native MCP support from [Okto Labs](https://oktolabs.ai).

## Stack

Plain HTML, CSS, and a sliver of JavaScript. No build step.

- `index.html` — page structure
- `styles.css` — all visual styling (CSS variables, dark obsidian theme, Fraunces + IBM Plex typography)
- `script.js` — copy-to-clipboard on the install command
- `assets/logos/` — Okto Labs and Okto Pulse wordmarks
- `assets/screenshots/` — real product captures used across the page

## Sections

1. Hero
2. Product showcase (kanban)
3. Pipeline — ideation to task in five stages
4. Capabilities — six feature cards
5. Differentiation — six agent roles with permission grids
6. The board — tab-by-tab product tour
7. Insight — analytics dashboard
8. Protocol — MCP integration
9. Getting started — four-command install

## Run locally

```bash
python -m http.server 8787
```

Then open http://127.0.0.1:8787.

## License

Copyright (c) 2024–2026 Okto Labs. All rights reserved.
