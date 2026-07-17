// Okto Pulse · Knowledge Graph question sequence
// Progressive enhancement for the static, fully readable project-memory demo.

(() => {
  const root = document.querySelector("[data-kg-demo]");
  if (!root) return;

  const buttons = Array.from(root.querySelectorAll("[data-kg-question]"));
  const panels = Array.from(root.querySelectorAll("[data-kg-panel]"));
  const nodes = Array.from(root.querySelectorAll("[data-kg-node]"));
  const edges = Array.from(root.querySelectorAll("[data-kg-edge]"));
  const edgeMap = new Map(edges.map((edge) => [edge.dataset.kgEdge, edge]));
  const packet = root.querySelector("[data-kg-packet]");
  const toggle = root.querySelector("[data-kg-toggle]");
  const count = root.querySelector("[data-kg-count]");
  const announcer = root.querySelector("[data-kg-announcer]");

  if (!buttons.length || buttons.length !== panels.length) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const dwellMs = 4800;

  let staticMode = motionQuery.matches || saveData;
  let active = 0;
  let visible = false;
  let started = false;
  let paused = true;
  let complete = false;
  let timer = 0;
  let traceFrame = 0;
  let traceRun = 0;
  let togglePointerWasPlaying = false;

  const tokens = (value) =>
    new Set(
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    );

  const orderedTokens = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };

  const stopTracing = () => {
    traceRun += 1;
    if (traceFrame) window.cancelAnimationFrame(traceFrame);
    traceFrame = 0;
    packet?.classList.remove("is-moving");
  };

  const traceRoutes = (routeNames) => {
    stopTracing();
    if (!packet || staticMode || !visible || !routeNames.length) return;

    const activeRun = traceRun;
    const duration = routeNames.length > 4 ? 540 : 680;

    const playRoute = (routeIndex) => {
      if (activeRun !== traceRun || routeIndex >= routeNames.length) {
        packet.classList.remove("is-moving");
        return;
      }

      const route = edgeMap.get(routeNames[routeIndex]);
      if (!route || typeof route.getTotalLength !== "function") {
        playRoute(routeIndex + 1);
        return;
      }

      const length = route.getTotalLength();
      const startedAt = performance.now();
      packet.classList.add("is-moving");

      const draw = (now) => {
        if (activeRun !== traceRun) return;
        const raw = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        const point = route.getPointAtLength(length * eased);
        packet.setAttribute("cx", point.x.toFixed(2));
        packet.setAttribute("cy", point.y.toFixed(2));

        if (raw < 1) {
          traceFrame = window.requestAnimationFrame(draw);
          return;
        }
        traceFrame = window.requestAnimationFrame(() => playRoute(routeIndex + 1));
      };

      traceFrame = window.requestAnimationFrame(draw);
    };

    playRoute(0);
  };

  const syncToggle = () => {
    if (!toggle) return;
    if (complete) {
      toggle.textContent = "Replay";
      toggle.setAttribute("aria-label", "Replay Knowledge Graph question sequence");
      return;
    }
    toggle.textContent = paused ? "Play" : "Pause";
    toggle.setAttribute(
      "aria-label",
      paused ? "Play Knowledge Graph question sequence" : "Pause Knowledge Graph question sequence"
    );
  };

  const keepQuestionVisible = (button) => {
    const list = button?.closest("ol");
    if (!visible || !list || list.scrollWidth <= list.clientWidth) return;
    const left = button.offsetLeft - (list.clientWidth - button.offsetWidth) / 2;
    list.scrollTo({
      left: Math.max(0, left),
      behavior: motionQuery.matches ? "auto" : "smooth",
    });
  };

  const setActive = (next, announce = false, trace = visible && !staticMode) => {
    active = Math.max(0, Math.min(panels.length - 1, next));
    root.dataset.active = String(active);

    const panel = panels[active];
    const activeNodes = tokens(panel.dataset.kgNodes);
    const activeEdgeSequence = orderedTokens(panel.dataset.kgEdges);

    buttons.forEach((button, index) => {
      const selected = index === active;
      if (!button.id) button.id = `kgQuestion${index}`;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((item, index) => {
      const selected = index === active;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-hidden", String(!selected));
      item.setAttribute("aria-labelledby", buttons[index].id);
    });

    nodes.forEach((node) => {
      const selected = activeNodes.has(node.dataset.kgNode);
      node.classList.toggle("is-active", selected);
      node.classList.toggle("is-dim", !selected);
    });

    edges.forEach((edge) => {
      const edgeIndex = activeEdgeSequence.indexOf(edge.dataset.kgEdge);
      edge.classList.toggle("is-active", edgeIndex >= 0);
    });

    if (count) count.textContent = `${String(active + 1).padStart(2, "0")} / ${String(panels.length).padStart(2, "0")}`;

    if (trace) traceRoutes(activeEdgeSequence);
    else stopTracing();

    keepQuestionVisible(buttons[active]);

    if (announce && announcer) {
      const question = buttons[active].querySelector("strong")?.textContent?.trim() || "Question updated";
      const answer = panel.querySelector("h3")?.textContent?.trim() || "Answer updated";
      announcer.textContent = `${question} ${answer}`;
    }
  };

  const schedule = () => {
    clearTimer();
    if (staticMode || !visible || paused || complete || document.hidden) return;
    timer = window.setTimeout(() => {
      if (active >= panels.length - 1) {
        complete = true;
        paused = true;
        syncToggle();
        return;
      }
      setActive(active + 1, false, true);
      schedule();
    }, dwellMs);
  };

  const pauseSequence = () => {
    paused = true;
    clearTimer();
    stopTracing();
    syncToggle();
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      complete = false;
      pauseSequence();
      setActive(index, true, !staticMode);
    });
    button.addEventListener("keydown", (event) => {
      let target = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = buttons.length - 1;
      if (target === null) return;
      event.preventDefault();
      complete = false;
      pauseSequence();
      setActive(target, true, !staticMode);
      buttons[target].focus();
    });
  });

  root.addEventListener("focusin", () => {
    pauseSequence();
  });

  toggle?.addEventListener("pointerdown", (event) => {
    togglePointerWasPlaying = event.button === 0 && !paused && !complete;
  });

  toggle?.addEventListener("pointercancel", () => {
    togglePointerWasPlaying = false;
  });

  toggle?.addEventListener("click", () => {
    if (togglePointerWasPlaying) {
      togglePointerWasPlaying = false;
      pauseSequence();
      return;
    }
    if (complete) {
      complete = false;
      paused = false;
      setActive(0, true, true);
      syncToggle();
      schedule();
      return;
    }

    paused = !paused;
    if (paused) {
      clearTimer();
      stopTracing();
    } else {
      setActive(active, false, true);
    }
    syncToggle();
    schedule();
  });

  const applyMotionPreference = () => {
    staticMode = motionQuery.matches || saveData;
    root.classList.toggle("is-static", staticMode);
    if (toggle) toggle.hidden = staticMode;

    if (staticMode) {
      paused = true;
      complete = false;
      clearTimer();
      stopTracing();
      setActive(active, false, false);
    } else {
      paused = true;
      complete = false;
      syncToggle();
    }
  };

  motionQuery.addEventListener?.("change", applyMotionPreference);

  setActive(0, false, false);
  root.classList.add("is-ready");
  syncToggle();

  if (staticMode) {
    visible = true;
    applyMotionPreference();
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.3);
        root.classList.toggle("is-visible", visible);
        if (!visible) {
          clearTimer();
          stopTracing();
          return;
        }
        if (!started) {
          started = true;
          paused = false;
          setActive(active, false, true);
          syncToggle();
        }
        schedule();
      },
      { threshold: [0, 0.3, 0.6], rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(root);
  } else {
    visible = true;
    started = false;
    paused = true;
    root.classList.add("is-visible");
    setActive(active, false, false);
    syncToggle();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimer();
      stopTracing();
    } else {
      schedule();
    }
  });
})();
