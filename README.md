# Okto Pulse — Landing Page

Static marketing site for [Okto Pulse](https://pypi.org/project/okto-pulse/), the local-first SDLC workbench with 215 MCP tools, 17 named governance gates, and native MCP support from [OktoLabs](https://oktolabs.ai).

## Stack

Plain HTML, CSS, and a sliver of JavaScript. No build step.

- `index.html` — page structure
- `styles.css` — all visual styling (CSS variables, dark obsidian theme, IBM Plex typography)
- `script.js` — page interactions, navigation, and copy-to-clipboard
- `delivery-flow.js` — accessible 12-event Pulse + Nexus delivery relay
- `knowledge-ingest.js` — responsive animation showing Pulse records becoming a connected Knowledge Graph
- `knowledge-demo.js` — accessible question sequence showing how agents retrieve project memory from the Knowledge Graph
- `llm.txt` — compact AI-facing product index linked from the page metadata
- `llms.txt` — canonical product, workflow, and Knowledge Graph summary for AI agents
- `assets/logos/` — OktoLabs, Okto Pulse, and Okto Nexus marks used by the page
- `assets/screenshots/` — real product captures used across the page

## Sections

1. Outcome-led hero and Pulse/Nexus distinction
2. Everyday delivery problem
3. Animated Pulse + Nexus feature journey with 12 traceable events
4. Direct source-of-truth explanation and interactive Knowledge Graph questions
5. Static six-stage delivery model
6. Before/after outcomes
7. Real product surfaces
8. Capabilities and operational use cases
9. MCP integration, local install, and final CTA

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
