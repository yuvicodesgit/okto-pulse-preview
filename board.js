// -----------------------------------------------------------------------------
// Okto Pulse · Mini Board — renders the real, sanitized pulse-brownfield-
// feature-demo board snapshot (assets/data/board-snapshot.json) client-side.
// No backend: this is a static read-only recreation of the product UI for
// the specific use-case page, not a live connection to a running instance.
// -----------------------------------------------------------------------------

(() => {
  "use strict";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);

  // Source text (ideation/refinement/spec prose) uses light markdown —
  // **bold** and `code`. Escape first, then re-open only those two safe
  // patterns so nothing else in the text can inject markup.
  const mdLite = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso.replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso.replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const statusPill = (status) =>
    `<span class="pill pill--status" data-status="${esc(status)}">${esc(status)}</span>`;
  const versionPill = (v) => `<span class="pill pill--version">v${esc(v)}</span>`;

  let DATA = null;
  let activeTopTab = "ideations";

  const els = {};

  const ACTIVITY_LABELS = {
    board_created: "created the board",
    ideation_created: "opened the ideation",
    ideation_updated: "updated the ideation",
    ideation_status_changed: "moved the ideation",
    refinement_created: "opened the refinement",
    refinement_updated: "updated the refinement",
    spec_created: "opened the spec",
    spec_updated: "updated the spec",
    spec_moved: "moved the spec",
    agent_granted_access: "was granted board access",
  };

  function activityLine(entry) {
    const label = ACTIVITY_LABELS[entry.action] || entry.action.replace(/_/g, " ");
    let extra = "";
    if (entry.action === "spec_moved" && entry.details) {
      extra = ` <b>${esc(entry.details.from_status)} → ${esc(entry.details.to_status)}</b>`;
    } else if (entry.details && entry.details.version) {
      extra = ` <b>v${esc(entry.details.version)}</b>`;
    }
    return `<b>${esc(entry.actor_name)}</b> ${esc(label)}${extra}`;
  }

  // ---------------- top tabs ----------------

  function stageCount(key) {
    if (key === "ideations") return DATA.ideation ? 1 : 0;
    if (key === "refinements") return DATA.refinement ? 1 : 0;
    if (key === "specs") return DATA.spec ? 1 : 0;
    if (key === "stories") return 0;
    if (key === "sprints") return 0;
    if (key === "tasks") return 0;
    return 0;
  }

  // Only the six real board stages live in the tab bar, matching the actual
  // app's IA. Activity and Governance aren't board stages — they're board-
  // level views, so they live in the sidebar instead (see renderSidebar).
  const TOP_TABS = [
    { key: "stories", label: "Stories" },
    { key: "ideations", label: "Ideations" },
    { key: "refinements", label: "Refinements" },
    { key: "specs", label: "Specs" },
    { key: "sprints", label: "Sprints" },
    { key: "tasks", label: "Tasks" },
  ];
  const SIDEBAR_VIEWS = ["activity", "governance"];

  function setView(key) {
    activeTopTab = key;
    renderTabs();
    renderSidebar();
    renderPanel();
    if (els.sidebar) els.sidebar.classList.remove("is-open");
  }

  function renderTabs() {
    els.tabs.innerHTML = TOP_TABS.map((t) => {
      const count = stageCount(t.key);
      return `<button class="board-tab${t.key === activeTopTab ? " is-active" : ""}" data-tab="${t.key}">${t.label}<span class="board-tab__count">${count}</span></button>`;
    }).join("");
    els.tabs.querySelectorAll(".board-tab").forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.dataset.tab));
    });
  }

  function renderSidebar() {
    if (!els.sidebar) return;
    const icons = {
      activity: '<path d="M3 12h4l2 8 6-16 2 8h4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
      governance: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
    };
    els.sidebar.innerHTML = `
      <h4>Boards</h4>
      <div class="board-sidebar__item is-static">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
        <span>pulse-brownfield-feature-demo</span>
      </div>
      <h4 style="margin-top: 1.5rem;">Board</h4>
      ${SIDEBAR_VIEWS.map(
        (key) => `
        <button class="board-sidebar__item${activeTopTab === key ? " is-active" : ""}" data-view="${key}">
          <svg viewBox="0 0 24 24">${icons[key]}</svg>
          <span>${key[0].toUpperCase()}${key.slice(1)}</span>
        </button>`
      ).join("")}
      <div class="board-sidebar__note">
        <strong>This is a snapshot, not a live connection.</strong><br />
        Real data exported from the board on 2026-08-13, sanitized (no credentials) and rendered
        statically for this use case.
      </div>
    `;
    els.sidebar.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.dataset.view));
    });
  }

  // ---------------- panel (list per tab) ----------------

  function emptyState(title, body) {
    return `<div class="board-empty"><strong>${esc(title)}</strong><p>${esc(body)}</p></div>`;
  }

  // Each stage actually holds different data — an ideation has a scope
  // assessment, a refinement is mostly prose, a spec has real requirement/
  // test/rule arrays. Surface that instead of rendering three identical-
  // looking cards with the same title+badges+description shape.
  function stageMetrics(kind, item) {
    const metric = (label) => `<span class="pill pill--metric">${esc(label)}</span>`;
    if (kind === "ideation" && item.scope_assessment && typeof item.scope_assessment === "object") {
      const sa = item.scope_assessment;
      return `<div class="board-card__metrics">
        ${metric(`${sa.domains} domain${sa.domains === 1 ? "" : "s"}`)}
        ${metric(`ambiguity ${sa.ambiguity}/5`)}
        ${metric(`${sa.dependencies} dependenc${sa.dependencies === 1 ? "y" : "ies"}`)}
      </div>`;
    }
    if (kind === "refinement") {
      const words = (item.context || item.description || "").trim().split(/\s+/).filter(Boolean).length;
      return `<div class="board-card__metrics">${metric(`approx. ${words.toLocaleString()} words of technical context`)}</div>`;
    }
    if (kind === "spec") {
      const count = (arr) => (Array.isArray(arr) ? arr.length : 0);
      const reqs = count(item.functional_requirements) + count(item.technical_requirements);
      return `<div class="board-card__metrics">
        ${metric(`${reqs} requirements`)}
        ${metric(`${count(item.acceptance_criteria)} acceptance criteria`)}
        ${metric(`${count(item.test_scenarios)} test scenarios`)}
        ${metric(`${count(item.business_rules)} business rules`)}
        ${metric(`${count(item.api_contracts)} API contract${count(item.api_contracts) === 1 ? "" : "s"}`)}
      </div>`;
    }
    return "";
  }

  function stageCard(kind, item) {
    const tags = (item.labels || [])
      .map((l) => `<span class="pill pill--tag">${esc(l)}</span>`)
      .join("");
    const complexity = item.complexity
      ? `<span class="pill pill--complexity">${esc(item.complexity)}</span>`
      : "";
    return `
      <button class="board-card" data-open="${kind}">
        <div class="board-card__top">
          ${statusPill(item.status)}
          ${versionPill(item.version)}
          ${complexity}
        </div>
        <div class="board-card__title">${esc(item.title)}</div>
        ${stageMetrics(kind, item)}
        <p class="board-card__desc">${esc((item.description || "").slice(0, 220))}</p>
        <div class="board-card__tags">${tags}</div>
      </button>`;
  }

  function renderPanel() {
    const heads = {
      stories: ["Stories", "User-facing stories on this board."],
      ideations: ["Ideations", "Early-stage feature ideas before refinement."],
      refinements: ["Refinements", "Ideas turned into a concrete data model and API shape."],
      specs: ["Specs", "Implementable specifications, gated on approval."],
      sprints: ["Sprints", "Execution windows opened against an approved spec."],
      tasks: ["Tasks", "Implementation and test work items inside a sprint."],
      activity: ["Activity", `${DATA.activity.length} recorded events on this board.`],
      governance: ["Governance", "The gates and thresholds actually enforced on this board."],
    };
    const [title, sub] = heads[activeTopTab];
    let body = "";

    if (activeTopTab === "ideations") {
      body = DATA.ideation
        ? `<div class="board-list">${stageCard("ideation", DATA.ideation)}</div>`
        : emptyState("No ideations yet", "Nothing has been proposed on this board.");
    } else if (activeTopTab === "refinements") {
      body = DATA.refinement
        ? `<div class="board-list">${stageCard("refinement", DATA.refinement)}</div>`
        : emptyState("No refinements yet", "Opens once an ideation is promoted.");
    } else if (activeTopTab === "specs") {
      body = DATA.spec
        ? `<div class="board-list">${stageCard("spec", DATA.spec)}</div>`
        : emptyState("No specs yet", "Opens once a refinement is promoted.");
    } else if (activeTopTab === "stories") {
      body = emptyState("No stories on this board", "This board runs the Ideation → Refinement → Spec → Sprint pipeline directly, without a separate Stories stage in this run.");
    } else if (activeTopTab === "sprints") {
      body = emptyState(
        "No sprints yet",
        "The spec is currently “approved”, not “validated.” Sprints and implementation tasks can’t open until the Spec Validation Gate clears — test cards linked to every scenario, then a passing spec evaluation."
      );
    } else if (activeTopTab === "tasks") {
      body = emptyState(
        "No tasks yet",
        "Tasks are created once a sprint opens. This board hasn’t reached that stage in the current cycle — see Governance for the exact gate blocking it."
      );
    } else if (activeTopTab === "activity") {
      body = renderActivity();
    } else if (activeTopTab === "governance") {
      body = renderGovernance();
    }

    els.panel.innerHTML = `
      <div class="board-panel-head"><h2>${title}</h2><span>${sub}</span></div>
      ${body}
    `;

    els.panel.querySelectorAll(".board-card[data-open]").forEach((card) => {
      card.addEventListener("click", () => openModal(card.dataset.open));
    });

    if (activeTopTab === "activity") wireActivitySearch();
  }

  // ---------------- activity ----------------

  function renderActivity(filter) {
    const rows = DATA.activity
      .slice()
      .reverse()
      .filter((e) => {
        if (!filter) return true;
        const hay = `${e.action} ${e.actor_name} ${JSON.stringify(e.details || {})}`.toLowerCase();
        return hay.includes(filter.toLowerCase());
      })
      .slice(0, 150);
    return `
      <input class="activity-search" id="activitySearch" type="text" placeholder="Filter activity (actor, action)…" />
      <div class="activity-feed" id="activityFeed">
        ${rows
          .map(
            (e) => `
          <div class="activity-row">
            <span class="activity-row__time">${fmtDateTime(e.created_at)}</span>
            <span class="activity-row__text">${activityLine(e)}</span>
            <span class="activity-row__actor">${esc(e.actor_type)}</span>
          </div>`
          )
          .join("")}
        ${rows.length === 150 ? '<div class="board-empty" style="margin-top:1rem;border:none;">Showing the most recent 150 of ' + DATA.activity.length + " events.</div>" : ""}
      </div>`;
  }

  function wireActivitySearch() {
    const input = document.getElementById("activitySearch");
    if (!input) return;
    input.addEventListener("input", () => {
      const feed = document.getElementById("activityFeed");
      feed.outerHTML = renderActivity(input.value).match(/<div class="activity-feed"[\s\S]*/)[0];
    });
  }

  // ---------------- governance ----------------

  function renderGovernance() {
    const s = DATA.board.settings || {};
    const tile = (label, value, cls) =>
      `<div class="gov-tile"><div class="gov-tile__label">${esc(label)}</div><div class="gov-tile__value${cls ? " " + cls : ""}">${esc(value)}</div></div>`;
    const onOff = (v) => (v ? "on-off" : "");
    const boolTile = (label, v) => tile(label, v ? "Enforced" : "Off", v ? "is-on" : "is-off");

    return `
      <div class="gov-grid">
        ${tile("Board", DATA.board.name)}
        ${tile("Created", fmtDate(DATA.board.created_at))}
        ${tile("Min task confidence", s.min_confidence + "%")}
        ${tile("Min task completeness", s.min_completeness + "%")}
        ${tile("Max task drift", s.max_drift + "%")}
        ${tile("Min spec completeness", s.min_spec_completeness + "%")}
        ${tile("Min spec assertiveness", s.min_spec_assertiveness + "%")}
        ${tile("Max spec ambiguity", s.max_spec_ambiguity + "%")}
        ${tile("Reviewer separation", s.reviewer_separation_mode)}
        ${tile("Impact evidence", s.impact_evidence_mode)}
        ${boolTile("Task validation required", s.require_task_validation)}
        ${boolTile("Spec validation required", s.require_spec_validation)}
        ${boolTile("Spec–task coverage required", s.require_spec_resource_task_coverage)}
        ${boolTile("Bug → test task required", s.require_test_task_for_bug)}
        ${boolTile("Agent self-answering allowed", s.allow_agent_self_answering)}
      </div>
      <p style="margin-top:1.5rem;font-size:12.5px;color:var(--surface-500);max-width:60ch;line-height:1.6;">
        These are the actual thresholds configured on this board — pulled from the same settings row
        the MCP gates read before approving a card, not marketing copy.
      </p>
    `;
  }

  // ---------------- modal ----------------

  const MODAL_CONFIG = {
    ideation: {
      title: () => DATA.ideation.title,
      tabs: [
        { key: "details", label: "Details", render: renderIdeationDetails },
        { key: "activity", label: "Activity", render: () => renderScopedActivity("ideation") },
      ],
    },
    refinement: {
      title: () => DATA.refinement.title,
      tabs: [
        { key: "details", label: "Details", render: renderRefinementDetails },
        { key: "activity", label: "Activity", render: () => renderScopedActivity("refinement") },
      ],
    },
    spec: {
      title: () => DATA.spec.title,
      tabs: [
        { key: "details", label: "Details", render: renderSpecDetails },
        { key: "requirements", label: `Requirements`, render: renderSpecRequirements },
        { key: "acceptance", label: `Acceptance criteria`, render: renderSpecAcceptance },
        { key: "tests", label: `Tests`, render: renderSpecTests },
        { key: "rules", label: `Rules`, render: renderSpecRules },
        { key: "contracts", label: `Contracts`, render: renderSpecContracts },
        { key: "decisions", label: `Decisions`, render: renderSpecDecisions },
        { key: "activity", label: "Activity", render: () => renderScopedActivity("spec") },
      ],
    },
  };

  let modalKind = null;
  let modalTab = null;

  function openModal(kind) {
    modalKind = kind;
    modalTab = MODAL_CONFIG[kind].tabs[0].key;
    renderModal();
    els.modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    els.modalBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function renderModal() {
    const cfg = MODAL_CONFIG[modalKind];
    const item = DATA[modalKind];
    els.modal.innerHTML = `
      <div class="board-modal__head">
        ${statusPill(item.status)}
        <h3>${esc(cfg.title())}</h3>
        ${versionPill(item.version)}
        <button class="board-modal__close" id="modalCloseBtn" aria-label="Close">&times;</button>
      </div>
      <div class="board-modal__tabs">
        ${cfg.tabs
          .map(
            (t) =>
              `<button class="board-modal__tab${t.key === modalTab ? " is-active" : ""}" data-mtab="${t.key}">${t.label}</button>`
          )
          .join("")}
      </div>
      <div class="board-modal__body" id="modalBody"></div>
    `;
    document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
    els.modal.querySelectorAll("[data-mtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        modalTab = btn.dataset.mtab;
        renderModal();
      });
    });
    const activeTabCfg = cfg.tabs.find((t) => t.key === modalTab);
    document.getElementById("modalBody").innerHTML = activeTabCfg.render();
  }

  function section(heading, html) {
    return `<div class="board-modal__section"><h4>${esc(heading)}</h4>${html}</div>`;
  }

  function renderIdeationDetails() {
    const d = DATA.ideation;
    let scope = "";
    if (d.scope_assessment && typeof d.scope_assessment === "object") {
      const sa = d.scope_assessment;
      scope = section(
        "Scope assessment",
        `<div class="gov-grid">
          ${`<div class="gov-tile"><div class="gov-tile__label">Domains</div><div class="gov-tile__value">${esc(sa.domains)}</div></div>`}
          ${`<div class="gov-tile"><div class="gov-tile__label">Ambiguity</div><div class="gov-tile__value">${esc(sa.ambiguity)}</div></div>`}
          ${`<div class="gov-tile"><div class="gov-tile__label">Dependencies</div><div class="gov-tile__value">${esc(sa.dependencies)}</div></div>`}
        </div>
        <p style="margin-top:0.8rem;">${esc(sa.domains_justification)}</p>`
      );
    }
    return (
      section("Problem statement", `<p>${mdLite(d.problem_statement)}</p>`) +
      section("Proposed approach", `<p>${mdLite(d.proposed_approach)}</p>`) +
      scope
    );
  }

  function renderRefinementDetails() {
    const d = DATA.refinement;
    return section("Context", `<p>${mdLite(d.context || d.description)}</p>`);
  }

  function renderSpecDetails() {
    const d = DATA.spec;
    return section("Overview", `<p>${mdLite(d.description)}</p>`);
  }

  function reqList(items, kind) {
    if (!items || !items.length) return `<p style="color:var(--surface-500);">None recorded.</p>`;
    return items
      .map((it) => {
        if (kind === "req") {
          return `<div class="req-item"><code class="req-id">${esc(it.id)}</code><span class="req-status">${statusPill(it.status || "n/a")}</span><div>${mdLite(it.text)}</div></div>`;
        }
        if (kind === "ac") {
          return `<div class="req-item"><code class="req-id">${esc(it.id)}</code><span class="req-status">${statusPill(it.status || "n/a")}</span><div><b>Given</b> ${esc(it.given)}<br/><b>When</b> ${esc(it.when)}<br/><b>Then</b> ${esc(it.then)}</div></div>`;
        }
        if (kind === "rule") {
          return `<div class="req-item"><code class="req-id">${esc(it.id)}</code><div class="decision-card__title">${esc(it.title)}</div><div>${mdLite(it.rule)}</div></div>`;
        }
        return "";
      })
      .join("");
  }

  function renderSpecRequirements() {
    const d = DATA.spec;
    return (
      section(`Functional requirements (${(d.functional_requirements || []).length})`, reqList(d.functional_requirements, "req")) +
      section(`Technical requirements (${(d.technical_requirements || []).length})`, reqList(d.technical_requirements, "req"))
    );
  }
  function renderSpecAcceptance() {
    const d = DATA.spec;
    return section(`Acceptance criteria (${(d.acceptance_criteria || []).length})`, reqList(d.acceptance_criteria, "ac"));
  }
  function renderSpecRules() {
    const d = DATA.spec;
    return section(`Business rules (${(d.business_rules || []).length})`, reqList(d.business_rules, "rule"));
  }
  function renderSpecTests() {
    const items = DATA.spec.test_scenarios || [];
    if (!items.length) return `<p style="color:var(--surface-500);">None recorded.</p>`;
    return items
      .map(
        (t) => `
      <div class="req-item test-card">
        <code class="req-id">${esc(t.id)}</code>
        <div class="decision-card__title">${esc(t.title)}</div>
        <div class="test-card__grid">
          <b>Type</b><span>${esc(t.scenario_type)}</span>
          <b>Given</b><span>${esc(t.given)}</span>
        </div>
      </div>`
      )
      .join("");
  }
  function renderSpecContracts() {
    const items = DATA.spec.api_contracts || [];
    if (!items.length) return `<p style="color:var(--surface-500);">None recorded.</p>`;
    return items
      .map(
        (c) => `
      <div class="req-item contract-card">
        <div class="contract-card__route">
          <span class="contract-card__method">${esc(c.method)}</span>
          <span class="contract-card__path">${esc(c.path)}</span>
        </div>
        <div style="font-family:'General Sans',sans-serif;">${mdLite(c.description)}</div>
      </div>`
      )
      .join("");
  }
  function renderSpecDecisions() {
    const items = DATA.spec.decisions || [];
    if (!items.length) return `<p style="color:var(--surface-500);">None recorded.</p>`;
    return items
      .map(
        (dec) => `
      <div class="req-item">
        <code class="req-id">${esc(dec.id)}</code>
        <div class="decision-card__title">${esc(dec.title)}</div>
        <div>${mdLite(dec.rationale)}</div>
      </div>`
      )
      .join("");
  }

  function renderScopedActivity(scope) {
    const filtered = DATA.activity.filter((e) => e.action.startsWith(scope));
    if (!filtered.length) return `<p style="color:var(--surface-500);">No recorded events for this stage.</p>`;
    return `<div class="activity-feed">${filtered
      .slice()
      .reverse()
      .map(
        (e) => `
      <div class="activity-row">
        <span class="activity-row__time">${fmtDateTime(e.created_at)}</span>
        <span class="activity-row__text">${activityLine(e)}</span>
        <span class="activity-row__actor">${esc(e.actor_type)}</span>
      </div>`
      )
      .join("")}</div>`;
  }

  // ---------------- boot ----------------

  async function boot() {
    els.tabs = document.getElementById("boardTabs");
    els.panel = document.getElementById("boardPanel");
    els.sidebar = document.getElementById("boardSidebar");
    els.hamburger = document.getElementById("boardHamburger");
    els.modalBackdrop = document.getElementById("boardModalBackdrop");
    els.modal = document.getElementById("boardModal");

    if (els.hamburger && els.sidebar) {
      els.hamburger.addEventListener("click", () => {
        const open = els.sidebar.classList.toggle("is-open");
        els.hamburger.setAttribute("aria-expanded", String(open));
      });
    }

    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.modalBackdrop.hidden) closeModal();
    });

    try {
      const res = await fetch("./assets/data/board-snapshot.json");
      DATA = await res.json();
    } catch (err) {
      els.panel.innerHTML = `<div class="board-empty"><strong>Couldn’t load the board snapshot</strong><p>assets/data/board-snapshot.json failed to load. If you're running this from the file system directly, serve it over http instead (e.g. python -m http.server).</p></div>`;
      return;
    }

    renderTabs();
    renderSidebar();
    renderPanel();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
