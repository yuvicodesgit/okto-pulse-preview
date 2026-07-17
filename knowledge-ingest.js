// Okto Pulse · Structured work → Knowledge Graph
// Native SVG route animation aligned to the live responsive layout.

(() => {
  const root = document.querySelector("[data-kg-ingest]");
  if (!root) return;

  const canvas = root.querySelector(".kg-ingest__canvas");
  const svg = root.querySelector(".kg-ingest__routes");
  const routes = Array.from(root.querySelectorAll("[data-ingest-route]"));
  const packet = root.querySelector("[data-ingest-packet]");
  const status = root.querySelector("[data-ingest-status]");
  const nodes = new Map(
    Array.from(root.querySelectorAll("[data-ingest-node]")).map((node) => [node.dataset.ingestNode, node])
  );

  if (!canvas || !svg || !packet || !routes.length) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const viewWidth = 1000;
  const viewHeight = 500;

  let runId = 0;
  let frame = 0;
  let started = false;

  const sourceRoutes = routes.filter((route) => route.dataset.ingestRoute.endsWith("-pulse") && route.dataset.ingestRoute !== "pulse-kg");
  const bridgeRoute = routes.find((route) => route.dataset.ingestRoute === "pulse-kg");
  const graphRoutes = routes.filter((route) => route.dataset.ingestRoute.startsWith("kg-"));

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const nodePoint = (name, canvasRect) => {
    const node = nodes.get(name);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: ((rect.left + rect.width / 2 - canvasRect.left) / canvasRect.width) * viewWidth,
      y: ((rect.top + rect.height / 2 - canvasRect.top) / canvasRect.height) * viewHeight,
    };
  };

  const syncRoutes = () => {
    const canvasRect = canvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return;

    routes.forEach((route) => {
      const from = nodePoint(route.dataset.ingestFrom, canvasRect);
      const to = nodePoint(route.dataset.ingestTo, canvasRect);
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      let c1;
      let c2;

      if (Math.abs(dx) >= Math.abs(dy)) {
        c1 = { x: from.x + dx * 0.42, y: from.y };
        c2 = { x: from.x + dx * 0.58, y: to.y };
      } else {
        c1 = { x: from.x, y: from.y + dy * 0.42 };
        c2 = { x: to.x, y: from.y + dy * 0.58 };
      }

      route.setAttribute(
        "d",
        `M${from.x.toFixed(1)} ${from.y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`
      );
    });
  };

  const clearState = () => {
    routes.forEach((route) => route.classList.remove("is-active", "is-complete"));
    nodes.forEach((node) => node.classList.remove("is-active", "is-complete"));
    packet.classList.remove("is-moving");
  };

  const showComplete = () => {
    runId += 1;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    syncRoutes();
    routes.forEach((route) => route.classList.add("is-complete"));
    nodes.forEach((node) => node.classList.add("is-complete"));
    packet.classList.remove("is-moving");
    root.classList.add("is-complete");
    setStatus("Pulse has connected the source records into project knowledge.");
  };

  const wait = (duration, activeRun) =>
    new Promise((resolve) => {
      const startedAt = performance.now();
      const tick = (now) => {
        if (activeRun !== runId || now - startedAt >= duration) {
          resolve();
          return;
        }
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    });

  const animateRoute = (route, duration, activeRun) =>
    new Promise((resolve) => {
      if (!route || activeRun !== runId || typeof route.getTotalLength !== "function") {
        resolve();
        return;
      }

      const fromNode = nodes.get(route.dataset.ingestFrom);
      const toNode = nodes.get(route.dataset.ingestTo);
      const length = route.getTotalLength();
      const startedAt = performance.now();

      route.classList.add("is-active");
      fromNode?.classList.add("is-active");
      toNode?.classList.add("is-active");
      packet.classList.add("is-moving");

      const draw = (now) => {
        if (activeRun !== runId) {
          resolve();
          return;
        }

        const raw = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        const point = route.getPointAtLength(length * eased);
        packet.setAttribute("cx", point.x.toFixed(2));
        packet.setAttribute("cy", point.y.toFixed(2));

        if (raw < 1) {
          frame = window.requestAnimationFrame(draw);
          return;
        }

        route.classList.remove("is-active");
        route.classList.add("is-complete");
        fromNode?.classList.remove("is-active");
        fromNode?.classList.add("is-complete");
        toNode?.classList.remove("is-active");
        toNode?.classList.add("is-complete");
        packet.classList.remove("is-moving");
        resolve();
      };

      frame = window.requestAnimationFrame(draw);
    });

  const play = async () => {
    runId += 1;
    const activeRun = runId;
    clearState();
    root.classList.remove("is-complete");
    syncRoutes();

    setStatus("Pulse receives structured project records.");
    for (const route of sourceRoutes) {
      await animateRoute(route, 280, activeRun);
      await wait(45, activeRun);
    }

    if (activeRun !== runId) return;
    nodes.get("pulse")?.classList.add("is-active");
    setStatus("Pulse connects every record to its initiative and provenance.");
    await wait(220, activeRun);
    nodes.get("pulse")?.classList.remove("is-active");
    nodes.get("pulse")?.classList.add("is-complete");

    await animateRoute(bridgeRoute, 460, activeRun);
    if (activeRun !== runId) return;

    setStatus("The Knowledge Graph preserves the relationships agents can retrieve.");
    for (const route of graphRoutes) {
      await animateRoute(route, 250, activeRun);
      await wait(35, activeRun);
    }

    if (activeRun !== runId) return;
    root.classList.add("is-complete");
    setStatus("Pulse has connected the source records into project knowledge.");
  };

  const staticMode = motionQuery.matches || saveData;
  root.classList.add("is-ready");
  syncRoutes();

  if (staticMode) {
    root.classList.add("is-static");
    showComplete();
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (started || !entry?.isIntersecting || entry.intersectionRatio < 0.2) return;
        started = true;
        play();
        observer.disconnect();
      },
      { threshold: [0, 0.2, 0.5] }
    );
    observer.observe(canvas);
  } else {
    showComplete();
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => window.requestAnimationFrame(syncRoutes));
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", syncRoutes, { passive: true });
  }

  motionQuery.addEventListener?.("change", () => {
    if (motionQuery.matches) showComplete();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !root.classList.contains("is-complete")) showComplete();
  });
})();
