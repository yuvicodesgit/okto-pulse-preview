// -----------------------------------------------------------------------------
// Okto Pulse · landing page enhancements
// 1. Copy-to-clipboard on the hero terminal
// 2. Scramble composition for the control-loss console
// 3. Analytics consent gate (LGPD) — loads analytics only after consent
// 4. Mobile menu, scroll progress + scrollspy, staggered reveals,
//    stat counters, pointer glow, back-to-top — all progressive enhancement
// -----------------------------------------------------------------------------

const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  // -- hero: live delivery path through SDD, SDLC, evidence, and memory --
  const root = document.querySelector("[data-hero-system]");
  const viewport = root?.querySelector("[data-hero-viewport]");
  const canvas = root?.querySelector("[data-hero-canvas]");
  const buttons = Array.from(root?.querySelectorAll("[data-hero-stage]") || []);
  if (!root || !viewport || !canvas || buttons.length !== 5) return;

  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context) return;

  const stages = [
    {
      kicker: "01 · INTENT",
      label: "Idea",
      title: "Intent enters the system.",
      description: "A product idea becomes traceable context.",
    },
    {
      kicker: "02 · SPECIFICATION-DRIVEN DEVELOPMENT",
      label: "SDD",
      title: "SDD writes the contract.",
      description: "Specs, architecture, criteria, and constraints align before code.",
    },
    {
      kicker: "03 · SOFTWARE DEVELOPMENT LIFE CYCLE",
      label: "SDLC",
      title: "The SDLC runs the route.",
      description: "Humans and agents move through governed delivery stages.",
    },
    {
      kicker: "04 · VALIDATION EVIDENCE",
      label: "Evidence",
      title: "Every gate leaves proof.",
      description: "Tests, acceptance, drift, and outcomes remain inspectable.",
    },
    {
      kicker: "05 · OPERATIONAL MEMORY",
      label: "Knowledge Graph",
      title: "The graph remembers the trip.",
      description: "Decisions, artifacts, and outcomes stay connected for what comes next.",
    },
  ];

  const stageColors = [
    [34, 211, 238],
    [74, 222, 241],
    [59, 130, 246],
    [106, 119, 255],
    [180, 92, 245],
  ];
  const ideaInputs = [
    { y: -29, label: "PROBLEM" },
    { y: 0, label: "CONSTRAINT" },
    { y: 29, label: "OUTCOME" },
  ];
  const sddRows = [-1, 0, 1];
  const sddArchitectureNodes = [
    { x: 13, y: 55 },
    { x: 38, y: 55 },
    { x: 13, y: 82 },
    { x: 38, y: 82 },
  ];
  const sdlcLanes = [
    { x: -102, label: "PLAN" },
    { x: -34, label: "BUILD" },
    { x: 34, label: "TEST" },
    { x: 102, label: "SHIP" },
  ];
  const evidenceRows = [
    { y: 52, label: "TEST" },
    { y: 69, label: "ACCEPT" },
    { y: 86, label: "NO DRIFT" },
  ];
  const knowledgeNodes = [
    [-74, -28], [-43, -59], [-8, -35], [34, -61], [67, -25],
    [48, 23], [4, 43], [-43, 28],
  ];
  const knowledgeEdges = [
    [0, 1], [0, 2], [0, 7], [1, 2], [2, 3], [2, 4],
    [2, 6], [3, 4], [4, 5], [5, 6], [6, 7],
  ];

  const kicker = root.querySelector("[data-hero-kicker]");
  const title = root.querySelector("[data-hero-title]");
  const description = root.querySelector("[data-hero-description]");
  const count = root.querySelector("[data-hero-count]");
  const announcer = root.querySelector("[data-hero-announcer]");
  const nodeElements = buttons.map((button) => button.closest(".hero-system__node"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const staticMode = reducedMotion || saveData;
  const frameInterval = 1000 / (coarsePointer ? 24 : 30);
  const stageDuration = 2000;
  const cycleDuration = stageDuration * stages.length;
  const pixelBudget = 1400000;

  let width = 1;
  let height = 1;
  let ratio = 1;
  let viewportRect = viewport.getBoundingClientRect();
  let points = [];
  let routeGradient = null;
  let active = 0;
  let previousActive = 0;
  let activeSince = performance.now();
  let autoStart = performance.now();
  let manualUntil = 0;
  let raf = 0;
  let lastFrame = 0;
  let visible = true;
  let documentVisible = !document.hidden;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const graphNodes = [];
  const graphEdges = [];

  let seed = 0x4f4b544f;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let index = 0; index < 32; index += 1) {
    const cluster = index >= 15;
    graphNodes.push({
      x: cluster ? 0.61 + random() * 0.35 : 0.05 + random() * 0.9,
      y: cluster ? 0.1 + random() * 0.65 : 0.08 + random() * 0.68,
      depth: 0.24 + random() * 0.76,
      radius: 0.65 + random() * 1.35,
      phase: random() * Math.PI * 2,
      cluster,
      drawX: 0,
      drawY: 0,
    });
  }

  graphNodes.forEach((node, index) => {
    if (!index) return;
    const candidates = graphNodes
      .slice(0, index)
      .map((other, otherIndex) => ({
        index: otherIndex,
        distance: Math.hypot(node.x - other.x, node.y - other.y),
      }))
      .sort((a, b) => a.distance - b.distance);
    if (candidates[0]) graphEdges.push([index, candidates[0].index]);
    if (candidates[1]?.distance < 0.16 && graphEdges.length < 45) {
      graphEdges.push([index, candidates[1].index]);
    }
  });

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (value) => {
    const next = clamp(value);
    return next * next * (3 - 2 * next);
  };

  const readoutFields = [kicker, title, description].filter(Boolean);
  let readoutAnimations = [];
  let readoutSwapId = 0;

  const stopReadoutAnimations = () => {
    readoutAnimations.forEach((animation) => animation.cancel());
    readoutAnimations = [];
  };

  const writeReadout = (stage, index) => {
    if (kicker) kicker.textContent = stage.kicker;
    if (title) title.textContent = stage.title;
    if (description) description.textContent = stage.description;
    if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / 05`;
  };

  const swapReadout = (stage, index, shouldAnimate) => {
    const swapId = ++readoutSwapId;
    stopReadoutAnimations();

    if (!shouldAnimate || staticMode || typeof readoutFields[0]?.animate !== "function") {
      writeReadout(stage, index);
      return;
    }

    const exits = readoutFields.map((field, fieldIndex) =>
      field.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-3px)" },
        ],
        {
          duration: 140 + fieldIndex * 12,
          easing: "cubic-bezier(.4, 0, 1, 1)",
          fill: "forwards",
        }
      )
    );
    readoutAnimations = exits;

    Promise.allSettled(exits.map((animation) => animation.finished)).then(() => {
      if (swapId !== readoutSwapId) return;
      writeReadout(stage, index);

      const enters = readoutFields.map((field, fieldIndex) =>
        field.animate(
          [
            { opacity: 0, transform: "translateY(4px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 270,
            delay: fieldIndex * 18,
            easing: "cubic-bezier(.16, 1, .3, 1)",
            fill: "both",
          }
        )
      );

      exits.forEach((animation) => animation.cancel());
      readoutAnimations = enters;
      Promise.allSettled(enters.map((animation) => animation.finished)).then(() => {
        if (swapId !== readoutSwapId) return;
        enters.forEach((animation) => animation.cancel());
        readoutAnimations = [];
      });
    });
  };

  const setActive = (next, announce = false) => {
    const resolved = (next + stages.length) % stages.length;
    const changed = resolved !== active;
    if (changed) {
      previousActive = active;
      activeSince = performance.now();
    }
    active = resolved;
    const stage = stages[active];
    root.dataset.active = String(active);
    buttons.forEach((button, index) => {
      const selected = index === active;
      button.setAttribute("aria-pressed", String(selected));
      nodeElements[index]?.classList.toggle("is-active", selected);
    });
    swapReadout(stage, active, changed);
    if (announce && announcer) {
      announcer.textContent = `${stage.label}. ${stage.title} ${stage.description}`;
    }
    if (staticMode && width > 1) {
      requestAnimationFrame(() => draw(performance.now(), active, true));
    }
  };

  const holdStage = (index, announce = false) => {
    manualUntil = performance.now() + 7000;
    setActive(index, announce);
    requestFrame();
  };

  const measure = () => {
    viewportRect = viewport.getBoundingClientRect();
    width = Math.max(1, viewportRect.width);
    height = Math.max(1, viewportRect.height);
    const ratioCap = coarsePointer ? 1.3 : 1.55;
    ratio = Math.min(window.devicePixelRatio || 1, ratioCap);
    ratio = Math.min(ratio, Math.sqrt(pixelBudget / Math.max(1, width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    points = buttons.map((button) => {
      const rect = button.querySelector(".hero-system__beacon")?.getBoundingClientRect();
      return {
        x: rect ? rect.left + rect.width / 2 - viewportRect.left : width / 2,
        y: rect ? rect.top + rect.height / 2 - viewportRect.top : height / 2,
      };
    });

    routeGradient = context.createLinearGradient(width * 0.05, 0, width * 0.95, 0);
    routeGradient.addColorStop(0, "rgba(34, 211, 238, 0.92)");
    routeGradient.addColorStop(0.55, "rgba(59, 130, 246, 0.9)");
    routeGradient.addColorStop(1, "rgba(180, 92, 245, 0.9)");

    draw(performance.now(), active, true);
  };

  const drawGraph = (now) => {
    const graphTransition = staticMode ? 1 : smooth((now - activeSince) / 480);
    const graphFocus = active === stages.length - 1
      ? graphTransition
      : previousActive === stages.length - 1
        ? 1 - graphTransition
        : 0;
    const breathe = staticMode ? 0.5 : 0.5 + Math.sin(now * 0.0012) * 0.5;

    graphNodes.forEach((node) => {
      const depthShift = node.depth * 5;
      node.drawX = node.x * width + pointer.x * depthShift;
      node.drawY = node.y * height + pointer.y * depthShift * 0.72;
    });

    context.save();
    context.lineWidth = 0.7;
    graphEdges.forEach(([fromIndex, toIndex]) => {
      const from = graphNodes[fromIndex];
      const to = graphNodes[toIndex];
      const clusterEdge = from.cluster && to.cluster;
      const alpha = clusterEdge
        ? 0.018 + graphFocus * (0.18 + breathe * 0.06)
        : 0.012 + graphFocus * 0.04;
      context.strokeStyle = clusterEdge
        ? `rgba(168, 85, 247, ${alpha})`
        : `rgba(76, 174, 222, ${alpha})`;
      context.beginPath();
      context.moveTo(from.drawX, from.drawY);
      context.lineTo(to.drawX, to.drawY);
      context.stroke();
    });

    if (graphFocus > 0.001 && points[4]) {
      context.strokeStyle = `rgba(180, 92, 245, ${(0.08 + breathe * 0.05) * graphFocus})`;
      context.lineWidth = 0.8;
      graphNodes.slice(19, 27).forEach((node) => {
        context.beginPath();
        context.moveTo(points[4].x, points[4].y);
        context.lineTo(node.drawX, node.drawY);
        context.stroke();
      });
    }

    graphNodes.forEach((node) => {
      const clusterBoost = node.cluster ? graphFocus * 0.42 : 0;
      const twinkle = staticMode ? 0.55 : 0.5 + Math.sin(now * 0.0015 + node.phase) * 0.5;
      const idleAlpha = 0.025 + node.depth * 0.035 + twinkle * 0.015;
      const focusedAlpha = 0.1 + node.depth * 0.12 + (node.cluster ? 0.42 : 0) + twinkle * 0.06;
      const alpha = idleAlpha + (focusedAlpha - idleAlpha) * graphFocus;
      context.fillStyle = node.cluster
        ? `rgba(184, 121, 255, ${alpha})`
        : `rgba(120, 224, 243, ${alpha})`;
      context.beginPath();
      context.arc(node.drawX, node.drawY, node.radius + clusterBoost * 0.9, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  };

  const artifactInk = (color, alpha) =>
    `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

  const drawArtifactLabel = (label, x, y, color, compact, align = "left") => {
    if (compact) return;
    context.save();
    context.fillStyle = artifactInk(color, 0.88);
    context.font = "7px 'IBM Plex Mono', ui-monospace, monospace";
    context.textAlign = align;
    context.textBaseline = "middle";
    context.fillText(label, x, y);
    context.restore();
  };

  const drawIdeaArt = (anchor, color, strength, selected, now, compact, scale) => {
    context.save();
    context.translate(anchor.x, anchor.y);
    context.scale(scale, scale);
    context.globalAlpha = strength;
    context.lineWidth = selected ? 1 : 0.7;
    context.strokeStyle = artifactInk(color, 0.72);
    context.fillStyle = artifactInk(color, 0.1);

    ideaInputs.forEach((input, index) => {
      context.beginPath();
      context.moveTo(10, input.y);
      context.lineTo(45, 0);
      context.stroke();
      context.beginPath();
      if (index === 1) context.rect(7.5, input.y - 2.5, 5, 5);
      else context.arc(10, input.y, 2.6, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      drawArtifactLabel(input.label, 17, input.y + (index === 1 ? 8 : 0), color, compact);
    });

    context.beginPath();
    context.moveTo(45, 0);
    context.lineTo(57, 0);
    context.stroke();
    context.fillRect(58, -34, 78, 68);
    context.strokeRect(58, -34, 78, 68);
    context.beginPath();
    context.moveTo(58, -19);
    context.lineTo(136, -19);
    context.moveTo(68, -7);
    context.lineTo(122, -7);
    context.moveTo(68, 3);
    context.lineTo(112, 3);
    context.moveTo(68, 13);
    context.lineTo(126, 13);
    context.stroke();
    drawArtifactLabel("INTENT / INTAKE", 67, -26, color, compact);

    context.beginPath();
    context.moveTo(136, 0);
    context.lineTo(153, 0);
    context.stroke();
    context.beginPath();
    context.arc(158, 0, selected ? 4.2 : 3.2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    drawArtifactLabel("TRACEABLE", 158, 11, color, compact, "center");

    if (selected) {
      const travel = staticMode ? 0.5 : (now * 0.00045) % 1;
      context.fillStyle = artifactInk(color, 0.96);
      context.beginPath();
      context.arc(45 + travel * 13, 0, 1.8, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  };

  const drawSddArt = (anchor, color, strength, selected, _now, compact, scale) => {
    context.save();
    context.translate(anchor.x, anchor.y);
    context.scale(scale, scale);
    context.globalAlpha = strength;
    context.lineWidth = selected ? 1 : 0.7;
    context.strokeStyle = artifactInk(color, 0.72);
    context.fillStyle = artifactInk(color, 0.09);

    context.beginPath();
    context.moveTo(0, 7);
    context.lineTo(0, 20);
    context.stroke();
    context.strokeRect(-54, 27, 112, 70);
    context.strokeRect(-60, 21, 112, 70);
    context.fillRect(-60, 21, 112, 70);
    context.beginPath();
    context.moveTo(-60, 38);
    context.lineTo(52, 38);
    context.stroke();
    drawArtifactLabel("SPEC / CONTRACT", -51, 30, color, compact);

    sddRows.forEach((row) => {
      const y = 52 + (row + 1) * 11;
      context.strokeRect(-50, y - 3, 6, 6);
      context.beginPath();
      context.moveTo(-47.5, y);
      context.lineTo(-45.8, y + 2);
      context.lineTo(-42.5, y - 3);
      context.moveTo(-37, y);
      context.lineTo(-6, y);
      context.stroke();
    });

    context.beginPath();
    context.moveTo(13, 55);
    context.lineTo(38, 55);
    context.lineTo(38, 82);
    context.lineTo(13, 82);
    context.closePath();
    context.moveTo(13, 55);
    context.lineTo(38, 82);
    context.stroke();
    sddArchitectureNodes.forEach((node) => {
      context.fillRect(node.x - 2.5, node.y - 2.5, 5, 5);
      context.strokeRect(node.x - 2.5, node.y - 2.5, 5, 5);
    });
    drawArtifactLabel("ARCH", 25, 69, color, compact, "center");
    context.restore();
  };

  const drawSdlcArt = (anchor, color, strength, selected, now, compact, scale) => {
    context.save();
    context.translate(anchor.x, anchor.y);
    context.scale(scale, scale);
    if (compact) {
      const minX = anchor.x - 123 * scale;
      const maxX = anchor.x + 132 * scale;
      const shiftPx = Math.max(0, 8 - minX) - Math.max(0, maxX - (width - 8));
      context.translate(shiftPx / scale, 0);
    }
    context.globalAlpha = strength;
    context.lineWidth = selected ? 1 : 0.7;
    context.strokeStyle = artifactInk(color, 0.72);
    context.fillStyle = artifactInk(color, 0.1);

    sdlcLanes.forEach((lane, index) => {
      context.fillRect(lane.x - 21, -63, 42, 22);
      context.strokeRect(lane.x - 21, -63, 42, 22);
      drawArtifactLabel(lane.label, lane.x, -52, color, compact, "center");
      if (index < sdlcLanes.length - 1) {
        context.beginPath();
        context.moveTo(lane.x + 21, -52);
        context.lineTo(sdlcLanes[index + 1].x - 21, -52);
        context.stroke();
      }
    });

    context.beginPath();
    context.moveTo(123, -52);
    context.bezierCurveTo(132, -14, -132, -14, -123, -52);
    context.stroke();
    context.beginPath();
    context.moveTo(0, -41);
    context.lineTo(0, -7);
    context.stroke();
    drawArtifactLabel("GOVERNED DELIVERY LOOP", 0, -19, color, compact, "center");

    const progress = selected && !staticMode ? (now * 0.00032) % 1 : 0.52;
    const routeX = -123 + progress * 246;
    context.fillStyle = artifactInk(color, 0.96);
    context.beginPath();
    context.arc(routeX, -52, selected ? 2.8 : 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawEvidenceArt = (anchor, color, strength, selected, _now, compact, scale) => {
    context.save();
    context.translate(anchor.x, anchor.y);
    context.scale(scale, scale);
    context.globalAlpha = strength;
    context.lineWidth = selected ? 1 : 0.7;
    context.strokeStyle = artifactInk(color, 0.74);
    context.fillStyle = artifactInk(color, 0.1);

    context.beginPath();
    context.moveTo(0, 7);
    context.lineTo(0, 19);
    context.stroke();
    context.fillRect(-110, 20, 154, 82);
    context.strokeRect(-110, 20, 154, 82);
    context.beginPath();
    context.moveTo(-110, 39);
    context.lineTo(44, 39);
    context.stroke();
    drawArtifactLabel("VALIDATION EVIDENCE", -101, 30, color, compact);

    evidenceRows.forEach((row, index) => {
      context.strokeRect(-100, row.y - 4, 7, 7);
      context.beginPath();
      context.moveTo(-98.5, row.y - 0.5);
      context.lineTo(-96.5, row.y + 2);
      context.lineTo(-92, row.y - 4);
      context.moveTo(-83, row.y);
      context.lineTo(-32 - index * 5, row.y);
      context.stroke();
      drawArtifactLabel(row.label, -27 - index * 5, row.y, color, compact);
    });

    context.beginPath();
    context.arc(20, 70, 19, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(20, 70, 14, 0, Math.PI * 2);
    context.stroke();
    context.font = "600 7px 'IBM Plex Mono', ui-monospace, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = artifactInk(color, 0.95);
    if (!compact) context.fillText(selected ? "PASS" : "PROOF", 20, 70);
    context.restore();
  };

  const drawKnowledgeArt = (anchor, color, strength, selected, now, compact, scale) => {
    context.save();
    context.translate(anchor.x, anchor.y);
    context.scale(scale, scale);
    context.globalAlpha = strength;
    context.lineWidth = selected ? 1 : 0.7;
    context.strokeStyle = artifactInk(color, 0.7);
    context.fillStyle = artifactInk(color, 0.76);

    context.beginPath();
    knowledgeEdges.forEach(([from, to]) => {
      context.moveTo(knowledgeNodes[from][0], knowledgeNodes[from][1]);
      context.lineTo(knowledgeNodes[to][0], knowledgeNodes[to][1]);
    });
    context.stroke();
    knowledgeNodes.forEach((node, index) => {
      const pulse = selected && !staticMode ? 0.5 + Math.sin(now * 0.002 + index) * 0.5 : 0.5;
      context.beginPath();
      context.arc(node[0], node[1], 2.2 + pulse * 1.1, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
    drawArtifactLabel("DECISION", -78, -38, color, compact);
    drawArtifactLabel("RULE", 34, -71, color, compact, "center");
    drawArtifactLabel("MEMORY", 48, 34, color, compact, "center");
    drawArtifactLabel("PROVENANCE", -43, 39, color, compact, "center");
    context.restore();
  };

  const artifactDrawers = [drawIdeaArt, drawSddArt, drawSdlcArt, drawEvidenceArt, drawKnowledgeArt];

  const drawArtifacts = (now) => {
    if (points.length !== stages.length) return;
    const compact = width < 620;
    const scale = clamp(width / 900, 0.72, 1.12);
    const transition = staticMode ? 1 : smooth((now - activeSince) / 480);

    if (previousActive !== active && transition < 1) {
      artifactDrawers[previousActive](
        points[previousActive],
        stageColors[previousActive],
        (1 - transition) * 0.58,
        false,
        now,
        compact,
        scale
      );
    }
    artifactDrawers[active](
      points[active],
      stageColors[active],
      0.22 + transition * 0.76,
      true,
      now,
      compact,
      scale
    );
  };

  const drawRoute = (now, rawStage, staticFrame) => {
    if (points.length !== stages.length || !routeGradient) return;

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.setLineDash([3, 9]);
    context.strokeStyle = "rgba(117, 203, 231, 0.16)";
    context.lineWidth = 0.9;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
    context.setLineDash([]);

    for (let index = 0; index < points.length - 1; index += 1) {
      const completed = staticFrame ? index < active : index < Math.floor(rawStage);
      const current = !staticFrame && index === Math.floor(rawStage) && index < 4;
      if (!completed && !current) continue;
      context.strokeStyle = routeGradient;
      context.globalAlpha = completed ? 0.54 : 0.34;
      context.lineWidth = completed ? 1.45 : 1.1;
      context.beginPath();
      context.moveTo(points[index].x, points[index].y);
      if (current) {
        const local = smooth((rawStage - index - 0.12) / 0.7);
        context.lineTo(
          points[index].x + (points[index + 1].x - points[index].x) * local,
          points[index].y + (points[index + 1].y - points[index].y) * local
        );
      } else {
        context.lineTo(points[index + 1].x, points[index + 1].y);
      }
      context.stroke();
    }

    let pulsePoint = points[active];
    let pulseAlpha = 1;
    if (!staticFrame && manualUntil <= now) {
      const segment = Math.floor(rawStage);
      const local = rawStage - segment;
      if (segment < 4) {
        const progress = smooth((local - 0.12) / 0.7);
        pulsePoint = {
          x: points[segment].x + (points[segment + 1].x - points[segment].x) * progress,
          y: points[segment].y + (points[segment + 1].y - points[segment].y) * progress,
        };
      } else {
        const angle = local * Math.PI * 2;
        pulsePoint = {
          x: points[4].x + Math.cos(angle) * 7,
          y: points[4].y + Math.sin(angle) * 7,
        };
        pulseAlpha = clamp(1 - Math.max(0, local - 0.72) / 0.28);
      }
    }

    context.globalAlpha = pulseAlpha;
    context.shadowColor = active === 4 ? "rgba(180, 92, 245, 0.9)" : "rgba(34, 211, 238, 0.9)";
    context.shadowBlur = 14;
    context.fillStyle = active === 4 ? "rgba(223, 189, 255, 0.96)" : "rgba(224, 253, 255, 0.96)";
    context.beginPath();
    context.arc(pulsePoint.x, pulsePoint.y, 2.6, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.globalAlpha = 1;
    context.restore();
  };

  const draw = (now, rawStage = active, staticFrame = false) => {
    context.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * 0.09;
    pointer.y += (pointer.targetY - pointer.y) * 0.09;
    root.style.setProperty("--hero-shift-x", `${(pointer.x * 5).toFixed(2)}px`);
    root.style.setProperty("--hero-shift-y", `${(pointer.y * 4).toFixed(2)}px`);
    drawGraph(now);
    drawArtifacts(now);
    drawRoute(now, rawStage, staticFrame);
  };

  const render = (now) => {
    raf = 0;
    if (!visible || !documentVisible || staticMode) return;
    if (now - lastFrame < frameInterval) {
      requestFrame();
      return;
    }
    lastFrame = now;

    if (manualUntil && now >= manualUntil) {
      autoStart = now - active * stageDuration;
      manualUntil = 0;
    }

    let rawStage = active;
    if (!manualUntil) {
      const cycleTime = ((now - autoStart) % cycleDuration + cycleDuration) % cycleDuration;
      rawStage = cycleTime / stageDuration;
      const next = Math.min(stages.length - 1, Math.floor(rawStage));
      if (next !== active) setActive(next, false);
    }

    draw(now, rawStage, false);
    requestFrame();
  };

  function requestFrame() {
    if (!raf && visible && documentVisible && !staticMode) {
      raf = requestAnimationFrame(render);
    }
  }

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  buttons.forEach((button, index) => {
    button.addEventListener("focus", () => holdStage(index, false));
    button.addEventListener("click", () => holdStage(index, true));
    button.addEventListener("keydown", (event) => {
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!forward && !backward && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const next = event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (index + (forward ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      holdStage(next, true);
    });
  });

  if (!staticMode && !coarsePointer) {
    viewport.addEventListener("pointerenter", () => {
      viewportRect = viewport.getBoundingClientRect();
    });
    viewport.addEventListener("pointermove", (event) => {
      pointer.targetX = clamp((event.clientX - viewportRect.left) / Math.max(1, viewportRect.width), 0, 1) * 2 - 1;
      pointer.targetY = clamp((event.clientY - viewportRect.top) / Math.max(1, viewportRect.height), 0, 1) * 2 - 1;
      requestFrame();
    }, { passive: true });
    viewport.addEventListener("pointerleave", () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
      requestFrame();
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      visible = Boolean(entry?.isIntersecting);
      root.classList.toggle("is-paused", !visible || !documentVisible);
      if (visible) requestFrame();
      else stop();
    }, { threshold: 0.04 });
    observer.observe(root);
  }

  document.addEventListener("visibilitychange", () => {
    documentVisible = !document.hidden;
    root.classList.toggle("is-paused", !visible || !documentVisible);
    if (documentVisible) requestFrame();
    else stop();
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
  } else {
    window.addEventListener("resize", measure, { passive: true });
  }

  setActive(staticMode ? 4 : 0, false);
  root.classList.toggle("is-static", staticMode);
  requestAnimationFrame(measure);
  if (!staticMode) requestFrame();
})();

(() => {
  // -- control-loss console text composition -----------------------------
  const consoles = document.querySelectorAll("[data-scramble-console]");
  if (!consoles.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

  const composeConsole = (consoleEl) => {
    consoleEl.querySelectorAll("[data-scramble]").forEach((el) => {
      const lineIndex = Number(el.closest(".loss-console__line")?.style.getPropertyValue("--line-i") || 0);
      window.setTimeout(() => compose(el), lineIndex * 70);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const consoleEl = entry.target;
      const existingTimer = Number(consoleEl.dataset.scrambleTimer);

      if (!entry.isIntersecting) {
        if (existingTimer) {
          window.clearInterval(existingTimer);
          delete consoleEl.dataset.scrambleTimer;
        }
        return;
      }

      if (existingTimer) return;
      composeConsole(consoleEl);
      consoleEl.dataset.scrambleTimer = String(window.setInterval(() => composeConsole(consoleEl), 5000));
    });
  }, { threshold: 0.55 });

  consoles.forEach((consoleEl) => observer.observe(consoleEl));
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

(() => {
  // -- mobile menu --------------------------------------------------------
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) setOpen(false);
  });

  // Close the panel if the viewport grows past the breakpoint while open
  window.matchMedia("(min-width: 901px)").addEventListener("change", (mq) => {
    if (mq.matches && !menu.hidden) setOpen(false);
  });
})();

(() => {
  // -- nav: scroll progress, condensed state, scrollspy -------------------
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const aurora = document.querySelector(".ambient__aurora");
  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    nav.style.setProperty("--scroll-progress", progress.toFixed(4));
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    if (aurora && !PREFERS_REDUCED_MOTION) {
      // gentle parallax: the glow drifts slower than the page
      aurora.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.05, 120)}px, 0)`;
    }
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();

  // scrollspy — highlight the nav link of the section in view
  const links = new Map();
  document.querySelectorAll('.nav__links a[href^="#"]').forEach((link) => {
    links.set(link.getAttribute("href").slice(1), link);
  });
  if (!links.size || !("IntersectionObserver" in window)) return;

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = links.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove("is-active"));
        link.classList.add("is-active");
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });

  links.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });
})();

(() => {
  // -- staggered scroll reveals -------------------------------------------
  // Classes are only added with JS available, so no-JS visitors, crawlers,
  // and screenshots always see the final layout (see styles.css note).
  if (PREFERS_REDUCED_MOTION) return;

  const groupSelectors = [
    ".problem__grid > .risk-card",
    ".act1__when > li",
    ".system-map__copy > article",
    ".pipeline > .pipeline__step",
    ".grid--features > .feature",
    ".audience > .audience-card",
    ".claims > .claim",
    ".install > .install__step",
    ".mcp__tools > span",
  ];
  const singleSelectors = [
    ".section__head",
    ".problem__bottom",
    ".problem__mid",
    ".problem__close",
    ".when__impact",
    ".control-plane",
    ".compare",
    ".mcp__code",
    ".section__impact",
    ".install__cta",
    ".final-cta",
    // kinetic statements hide their words until .is-in lands on the element
    // itself, so every [data-kinetic] must be swept directly
    "[data-kinetic]",
  ];

  const targets = [];
  groupSelectors.forEach((selector) => {
    const byParent = new Map();
    document.querySelectorAll(selector).forEach((el) => {
      const parent = el.parentElement;
      const index = byParent.get(parent) || 0;
      byParent.set(parent, index + 1);
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-i", String(Math.min(index, 7)));
      targets.push(el);
    });
  });
  singleSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.setAttribute("data-reveal", "");
      targets.push(el);
    });
  });
  if (!targets.length) return;

  document.documentElement.classList.add("js-reveal");

  // Scroll-driven (not IntersectionObserver) so the reveal line is the same
  // deterministic pipeline as the pulse spine below.
  let pending = targets.slice();
  let ticking = false;

  const sweep = () => {
    ticking = false;
    const line = window.scrollY + window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > line) return true;
      el.classList.add("is-in");
      return false;
    });
    if (!pending.length) window.removeEventListener("scroll", onScroll);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  sweep();
})();

(() => {
  // -- pulse spine: an EKG line that draws itself as you scroll ------------
  // The lightweight depth corridor supersedes this older document-wide rail.
  const ENABLE_LEGACY_SPINE = false;
  if (!ENABLE_LEGACY_SPINE) return;

  const main = document.querySelector("main");
  if (!main) return;

  const NS = "http://www.w3.org/2000/svg";
  const holder = document.createElement("div");
  holder.className = "spine";
  holder.setAttribute("aria-hidden", "true");
  document.body.appendChild(holder);

  let trace = null;
  let head = null;
  let nodes = [];
  let total = 0;
  let startY = 0;
  let endY = 0;
  let target = 0;
  let current = 0;
  let rafId = null;

  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  const build = () => {
    holder.innerHTML = "";
    nodes = [];

    const sections = Array.from(main.querySelectorAll(":scope > section")).slice(1);
    if (!sections.length) return;

    const mobile = window.matchMedia("(max-width: 680px)").matches;
    const x = mobile ? 11 : 26;
    const amp = mobile ? 5 : 7;

    startY = docTop(sections[0]) + 28;
    endY = docTop(main) + main.offsetHeight - 48;
    if (endY - startY < 400) return;

    let d = `M ${x} ${startY}`;
    const stops = [];
    sections.forEach((section) => {
      const y = docTop(section) + 104;
      if (y < startY + 60 || y > endY - 80) return;
      // EKG blip: short zig across the rail, then back on axis
      d += ` L ${x} ${y - 26} l ${amp} ${7} l ${-amp * 2} ${12} l ${amp} ${7}`;
      stops.push(y);
    });
    d += ` L ${x} ${endY}`;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "64");
    svg.setAttribute("height", String(Math.ceil(endY)));
    svg.setAttribute("viewBox", `0 0 64 ${Math.ceil(endY)}`);

    const defs = document.createElementNS(NS, "defs");
    const grad = document.createElementNS(NS, "linearGradient");
    grad.setAttribute("id", "spineGradient");
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", String(startY));
    grad.setAttribute("x2", "0");
    grad.setAttribute("y2", String(endY));
    [
      ["0%", "#22d3ee"],
      ["38%", "#3b82f6"],
      ["72%", "#a855f7"],
      ["100%", "#ec4899"],
    ].forEach(([offset, color]) => {
      const stop = document.createElementNS(NS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    const guide = document.createElementNS(NS, "path");
    guide.setAttribute("class", "spine__guide");
    guide.setAttribute("d", d);
    svg.appendChild(guide);

    trace = document.createElementNS(NS, "path");
    trace.setAttribute("class", "spine__trace");
    trace.setAttribute("d", d);
    svg.appendChild(trace);

    stops.forEach((y) => {
      const node = document.createElementNS(NS, "circle");
      node.setAttribute("class", "spine__node");
      node.setAttribute("cx", String(x));
      node.setAttribute("cy", String(y));
      node.setAttribute("r", "3.2");
      svg.appendChild(node);
      nodes.push({ el: node, y });
    });

    head = document.createElementNS(NS, "circle");
    head.setAttribute("class", "spine__head");
    head.setAttribute("r", "4");
    svg.appendChild(head);

    holder.appendChild(svg);

    total = trace.getTotalLength();
    trace.style.strokeDasharray = `${total} ${total}`;
    trace.style.strokeDashoffset = String(total);

    if (PREFERS_REDUCED_MOTION) {
      // Static fallback: fully drawn line, all nodes lit, no comet head
      trace.style.strokeDashoffset = "0";
      nodes.forEach((n) => n.el.classList.add("is-lit"));
      head.remove();
      return;
    }

    current = -1;
    retarget();
    kick();
  };

  const retarget = () => {
    const anchor = window.scrollY + window.innerHeight * 0.7;
    target = Math.min(1, Math.max(0, (anchor - startY) / (endY - startY)));
  };

  const frame = () => {
    rafId = null;
    if (!trace) return;
    current += (target - current) * 0.16;
    if (Math.abs(target - current) < 0.0004) current = target;

    const drawn = total * current;
    trace.style.strokeDashoffset = String(Math.max(0, total - drawn));

    const point = trace.getPointAtLength(Math.max(0, drawn));
    head.setAttribute("cx", String(point.x));
    head.setAttribute("cy", String(point.y));
    head.style.opacity = current > 0.004 && current < 0.998 ? "1" : "0";

    nodes.forEach((node) => {
      node.el.classList.toggle("is-lit", point.y >= node.y - 4);
    });

    if (current !== target) kick();
  };

  const kick = () => {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  };

  if (PREFERS_REDUCED_MOTION) {
    window.addEventListener("load", build);
    build();
    return;
  }

  window.addEventListener("scroll", () => {
    retarget();
    kick();
  }, { passive: true });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 180);
  });
  window.addEventListener("load", build);
  build();
})();

(() => {
  // -- hero stat counters ---------------------------------------------------
  const stats = document.querySelectorAll(".stat__value[data-count]");
  if (!stats.length || PREFERS_REDUCED_MOTION || !("IntersectionObserver" in window)) return;

  const animate = (el) => {
    const final = parseInt(el.getAttribute("data-count"), 10);
    if (!Number.isFinite(final)) return;
    const duration = 1200;
    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = String(Math.round(final * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  stats.forEach((el) => io.observe(el));
})();

(() => {
  // -- pointer-tracking glow on cards (desktop pointers only) --------------
  if (PREFERS_REDUCED_MOTION) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const selector = [
    ".risk-card",
    ".when__list li",
    ".system-map__copy article",
    ".pipeline__step",
    ".value-card",
    ".feature",
    ".audience-card",
    ".claim",
    ".install__step",
    ".knowledge__node",
    ".highlight",
  ].join(", ");

  document.querySelectorAll(selector).forEach((card) => {
    card.classList.add("glow-track");
    const spot = document.createElement("span");
    spot.className = "glow-spot";
    spot.setAttribute("aria-hidden", "true");
    card.prepend(spot);
  });

  let frame = null;
  document.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".glow-track");
    if (!card || frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  }, { passive: true });
})();

(() => {
  // -- back to top ----------------------------------------------------------
  const button = document.getElementById("toTop");
  if (!button) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      button.classList.toggle("is-visible", window.scrollY > window.innerHeight * 1.2);
    });
  }, { passive: true });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: PREFERS_REDUCED_MOTION ? "auto" : "smooth" });
  });
})();

(() => {
  // -- narrative layer flags ------------------------------------------------
  // js-pin: pinned scroll scenes (desktop only); js-stage / js-compare:
  // layout modes that need JS to switch content, so no-JS keeps the
  // plain stacked fallbacks defined in styles.css.
  const docEl = document.documentElement;
  docEl.classList.add("js-stage", "js-compare");
  if (PREFERS_REDUCED_MOTION) return;

  const mq = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
  const apply = () => docEl.classList.toggle("js-pin", mq.matches);
  apply();
  mq.addEventListener("change", apply);
})();

(() => {
  // -- kinetic type: split statements into per-word spans -------------------
  if (PREFERS_REDUCED_MOTION) return;

  document.querySelectorAll("[data-kinetic]").forEach((el) => {
    let w = 0;
    const wrap = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          // <i>, not <span>: legacy selectors like ".problem__close span"
          // style direct spans and must not match these word wrappers
          const word = document.createElement("i");
          word.className = "kword";
          word.style.setProperty("--w", String(w++));
          word.textContent = part;
          frag.appendChild(word);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // gradient text uses background-clip: text, which does not survive
        // per-word inline-blocks — animate those elements as one unit
        const cs = getComputedStyle(node);
        const clip = cs.webkitBackgroundClip || cs.backgroundClip || "";
        if (clip.includes("text")) {
          node.classList.add("kword", "kword--unit");
          node.style.setProperty("--w", String(w++));
          if (cs.display === "inline") node.style.display = "inline-block";
          return;
        }
        Array.from(node.childNodes).forEach(wrap);
      }
    };
    Array.from(el.childNodes).forEach(wrap);
  });
})();

(() => {
  // -- Act 1: pinned problem scene with degrading EKG -----------------------
  const stage = document.querySelector(".act1__stage");
  const track = document.querySelector(".act1__track");
  const canvas = document.querySelector(".act1__ekg");
  if (!stage || !track || !canvas || PREFERS_REDUCED_MOTION) return;

  const finaleKinetics = stage.querySelectorAll(".act1__scene--finale [data-kinetic]");
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let p = 0;
  let raf = null;

  const phaseFor = (v) => (v < 0.2 ? 0 : v < 0.52 ? 1 : v < 0.78 ? 2 : 3);

  const sizeCanvas = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Heartbeat trace: the whole unresolved act stays in the danger spectrum;
  // it gets hotter, noisier and weaker before ending in a flatline.
  const draw = () => {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    const fade = Math.min(1, p * 1.25);
    const amp = Math.max(0, 1 - p * 1.18);
    const jitter = p > 0.4 && p < 0.82 ? (p - 0.4) * 30 : 0;
    const base = H * 0.5;
    const r = 255;
    const g = Math.round(104 - 43 * fade);
    const b = Math.round(118 - 42 * fade);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.55)`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    const beat = 240;
    for (let x = 0; x <= W; x += 4) {
      const t = (x % beat) / beat;
      let y = 0;
      if (t > 0.42 && t < 0.46) y = -34;
      else if (t >= 0.46 && t < 0.52) y = 64;
      else if (t >= 0.52 && t < 0.56) y = -18;
      else if (t > 0.7 && t < 0.78) y = -10 * Math.sin(((t - 0.7) / 0.08) * Math.PI);
      let py = base + y * amp;
      if (jitter) py += (Math.random() - 0.5) * jitter;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  };

  const update = () => {
    raf = null;
    if (!document.documentElement.classList.contains("js-pin")) return;
    const rect = track.getBoundingClientRect();
    const span = track.offsetHeight - window.innerHeight;
    if (span <= 0) return;
    p = Math.min(1, Math.max(0, -rect.top / span));
    const phase = phaseFor(p);
    if (String(phase) !== stage.dataset.phase) {
      stage.dataset.phase = String(phase);
      finaleKinetics.forEach((el) => el.classList.toggle("is-in", phase >= 3));
    }
    if (rect.top < window.innerHeight && rect.bottom > 0) draw();
  };

  const kick = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", () => {
    sizeCanvas();
    kick();
  });
  window.addEventListener("load", () => {
    sizeCanvas();
    kick();
  });
  sizeCanvas();
  kick();
})();

(() => {
  // -- foreground depth planes ---------------------------------------------
  // Canvas provides the world; these wrappers make the real, accessible page
  // content move through that same fixed-height camera without hijacking scroll.
  // Disabled after usability review: product content must stay in normal flow.
  // The lightweight canvas corridor now carries the full depth effect.
  const ENABLE_FOREGROUND_DEPTH = false;
  if (!ENABLE_FOREGROUND_DEPTH) return;

  const root = document.documentElement;
  const body = document.body;
  const sections = Array.from(document.querySelectorAll("[data-depth-scene]"));
  if (!sections.length || !body) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const viewportQuery = window.matchMedia("(min-width: 1024px) and (min-height: 700px)");
  const hudIndex = document.querySelector(".depth-hud [data-depth-index]");
  const hudLabel = document.querySelector(".depth-hud [data-depth-label]");
  const hudValue = document.querySelector(".depth-hud [data-depth-value]");

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  const planeSpecs = [
    ["hero", ".hero__copy", "hero-copy", -1, 0],
    ["hero", ".hero__visual", "hero-visual", 1, 0.32],
    ["hero", ".hero__stats", "hero-stats", -1, 0.64],
    ["adlc", ".section__head", "", -1, 0],
    ["adlc", ".system-map", "", 1, 0.52],
    ["pipeline", ".section__head", "", -1, 0],
    ["pipeline", ".pipeline", "", 1, 0.46],
    ["value", ".section__head", "", -1, 0],
    ["value", ".compare", "", 1, 0.42],
    ["value", ".claims", "", -1, 0.76],
    ["evidence", ".section__head", "", -1, 0],
    ["features", ".section__head", "", -1, 0],
    ["agents", ".section__head", "", -1, 0],
    ["mcp", ".section__head", "", -1, 0],
    ["mcp", ".mcp", "", 1, 0.48],
    ["install", ".section__head", "", -1, 0],
    ["install", ".install", "", 1, 0.44],
    ["install", ".install__cta", "", -1, 0.78],
    ["claims", ".section__head", "", -1, 0],
    ["claims", ".section__impact", "", 1, 0.38],
    ["claims", ".final-cta", "", -1, 0.72],
  ];

  const planes = [];

  const wrapPlane = (element, scene, modifier, side, delay) => {
    if (!element || element.parentElement?.classList.contains("depth-plane-shell")) return;
    const shell = document.createElement("div");
    shell.className = `depth-plane-shell${modifier ? ` depth-plane-shell--${modifier}` : ""}`;
    shell.dataset.depthPlane = scene;
    shell.dataset.depthSide = String(side);
    shell.dataset.depthDelay = String(delay);
    element.parentNode.insertBefore(shell, element);
    shell.appendChild(element);
    shell.addEventListener("focusin", () => shell.classList.add("is-depth-focused"));
    shell.addEventListener("focusout", (event) => {
      if (!shell.contains(event.relatedTarget)) shell.classList.remove("is-depth-focused");
    });
    planes.push({ shell, scene, side, delay, center: 0 });
  };

  planeSpecs.forEach(([scene, selector, modifier, side, delay]) => {
    const section = sections.find((item) => item.dataset.depthScene === scene);
    if (!section) return;
    wrapPlane(section.querySelector(selector), scene, modifier, side, delay);
  });

  // Card constellations get independent shells so they converge as a graph,
  // while the cards themselves keep their reveal and pointer-tilt transforms.
  [
    ["features", ".feature"],
    ["agents", ".audience-card"],
  ].forEach(([scene, selector]) => {
    const section = sections.find((item) => item.dataset.depthScene === scene);
    if (!section) return;
    Array.from(section.querySelectorAll(selector)).forEach((card, index) => {
      wrapPlane(card, scene, "grid-card", index % 2 ? 1 : -1, 0.32 + index * 0.11);
    });
  });

  const chapterState = sections.map((section, index) => ({
    section,
    index,
    scene: section.dataset.depthScene || `chapter-${index}`,
    title: section.dataset.depthTitle || "Pulse",
    number: section.dataset.depthNumber || String(index).padStart(2, "0"),
    top: 0,
    bottom: 0,
  }));

  let enabled = false;
  let raf = 0;
  let layoutDirty = true;
  let activeScene = "";

  const documentTop = (element) => {
    let top = 0;
    let node = element;
    while (node) {
      top += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return top;
  };

  const measure = () => {
    planes.forEach((plane) => {
      plane.center = documentTop(plane.shell) + plane.shell.offsetHeight * 0.5;
    });
    chapterState.forEach((chapter) => {
      chapter.top = documentTop(chapter.section);
      chapter.bottom = chapter.top + chapter.section.offsetHeight;
    });
    layoutDirty = false;
  };

  const resetPlane = (plane) => {
    plane.shell.style.setProperty("--dp-x", "0px");
    plane.shell.style.setProperty("--dp-y", "0px");
    plane.shell.style.setProperty("--dp-z", "0px");
    plane.shell.style.setProperty("--dp-rx", "0deg");
    plane.shell.style.setProperty("--dp-ry", "0deg");
    plane.shell.style.setProperty("--dp-scale", "1");
    plane.shell.style.setProperty("--dp-opacity", "1");
    plane.shell.dataset.depthPlaneState = "active";
  };

  const setChapter = (chapter, scrollY, viewportHeight) => {
    if (activeScene !== chapter.scene) {
      activeScene = chapter.scene;
      body.dataset.depthAct = chapter.scene;
      if (hudIndex) hudIndex.textContent = chapter.number;
      if (hudLabel) hudLabel.textContent = chapter.title;
      root.style.setProperty("--depth-active-index", String(chapter.index));
    }
    root.style.setProperty(
      "--depth-active-local",
      clamp((scrollY + viewportHeight * 0.48 - chapter.top) / Math.max(1, chapter.bottom - chapter.top)).toFixed(4),
    );
  };

  const update = () => {
    raf = 0;
    if (!enabled) return;
    if (layoutDirty) measure();

    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = Math.max(1, window.innerHeight);
    const viewportWidth = Math.max(1, window.innerWidth);
    const horizon = scrollY + viewportHeight * 0.48;

    let chapter = chapterState[0];
    chapterState.forEach((candidate) => {
      if (horizon >= candidate.top) chapter = candidate;
    });
    setChapter(chapter, scrollY, viewportHeight);

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    const journey = clamp(scrollY / maxScroll);
    root.style.setProperty("--depth-foreground-progress", journey.toFixed(5));

    const rendererZ = Number.parseFloat(root.style.getPropertyValue("--depth-camera-z"));
    const displayZ = Number.isFinite(rendererZ) ? rendererZ : journey * 352;
    if (hudValue) hudValue.textContent = `Z ${displayZ.toFixed(1).padStart(5, "0")}`;

    planes.forEach((plane) => {
      const delayedCenter = plane.center + plane.delay * viewportHeight * 0.16;
      const delta = (delayedCenter - horizon) / viewportHeight;
      const distance = Math.abs(delta);
      const future = delta >= 0;

      const z = future
        ? -Math.min(1380, Math.max(0, delta - 0.025) * 960)
        : Math.min(470, Math.max(0, -delta - 0.02) * 720);
      const yFactor = future ? 0.74 : 0.86;
      const y = -delta * viewportHeight * yFactor;
      const lateral = plane.side * Math.min(viewportWidth * 0.075, distance * 112);
      const x = future ? lateral : lateral * 0.35;
      const ry = -plane.side * Math.min(11, distance * 9.5);
      const rx = clamp(delta * -4.5, -5, 5);
      const futureAlpha = 1 - smoothstep(0.28, 1.42, delta);
      const pastAlpha = 1 - smoothstep(0.05, 0.72, -delta);
      const opacity = clamp(future ? futureAlpha : pastAlpha);
      const scale = future
        ? 1 - Math.min(0.08, Math.max(0, delta) * 0.045)
        : 1 + Math.min(0.06, Math.max(0, -delta) * 0.05);

      plane.shell.style.setProperty("--dp-x", `${x.toFixed(2)}px`);
      plane.shell.style.setProperty("--dp-y", `${y.toFixed(2)}px`);
      plane.shell.style.setProperty("--dp-z", `${z.toFixed(2)}px`);
      plane.shell.style.setProperty("--dp-rx", `${rx.toFixed(2)}deg`);
      plane.shell.style.setProperty("--dp-ry", `${ry.toFixed(2)}deg`);
      plane.shell.style.setProperty("--dp-scale", scale.toFixed(4));
      plane.shell.style.setProperty("--dp-opacity", opacity.toFixed(4));
      plane.shell.dataset.depthPlaneState = opacity < 0.075 ? "far" : opacity > 0.72 ? "active" : "travel";
    });
  };

  const requestUpdate = () => {
    if (!enabled || raf) return;
    raf = window.requestAnimationFrame(update);
  };

  const applyMode = () => {
    const next = viewportQuery.matches && !motionQuery.matches;
    enabled = next;
    root.classList.toggle("js-depth", enabled);

    if (!enabled) {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      planes.forEach(resetPlane);
      delete body.dataset.depthAct;
      activeScene = "";
      return;
    }

    layoutDirty = true;
    requestUpdate();
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    layoutDirty = true;
    requestUpdate();
  }, { passive: true });
  window.addEventListener("load", () => {
    layoutDirty = true;
    requestUpdate();
  }, { once: true });

  if (typeof viewportQuery.addEventListener === "function") {
    viewportQuery.addEventListener("change", applyMode);
    motionQuery.addEventListener("change", applyMode);
  } else {
    viewportQuery.addListener(applyMode);
    motionQuery.addListener(applyMode);
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      layoutDirty = true;
      requestUpdate();
    });
    chapterState.forEach((chapter) => observer.observe(chapter.section));
  }

  applyMode();
})();

(() => {
  // -- Act 2: resuscitation spike + interactive control mesh ----------------
  const resus = document.querySelector(".resus");
  const mesh = document.querySelector("[data-control-mesh]");

  if (resus && !PREFERS_REDUCED_MOTION) {
    resus.classList.add("is-armed");
    const ignite = () => {
      if (resus.classList.contains("is-alive")) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resus.classList.add("is-alive"));
      });
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        ignite();
      }, { threshold: 0.14, rootMargin: "0px 0px -12% 0px" });
      observer.observe(resus);
    } else {
      const checkResus = () => {
        const rect = resus.getBoundingClientRect();
        if (rect.top >= window.innerHeight * 0.78 || rect.bottom <= 0) return;
        window.removeEventListener("scroll", checkResus);
        ignite();
      };
      window.addEventListener("scroll", checkResus, { passive: true });
      checkResus();
    }
  }

  if (!mesh) return;

  const stages = [
    { status: "01 / INGEST", core: "Intent → context", announcement: "Intent becomes shared context." },
    { status: "02 / GOVERN", core: "Rules → contract", announcement: "Rules become executable guardrails." },
    { status: "03 / ORCHESTRATE", core: "Agents → execution", announcement: "Every agent runs through one bus." },
    { status: "04 / PROVE", core: "Delivery → proof", announcement: "Every delivery leaves evidence." },
    { status: "05 / REMEMBER", core: "Outcomes → memory", announcement: "The next cycle starts informed." },
  ];
  const buttons = Array.from(mesh.querySelectorAll("[data-control-stage]"));
  const nodes = buttons.map((button) => button.closest(".control-mesh__node"));
  const edges = Array.from(mesh.querySelectorAll("[data-control-edge]"));
  const panels = Array.from(mesh.querySelectorAll("[data-control-panel]"));
  const status = mesh.querySelector("[data-control-status]");
  const coreState = mesh.querySelector("[data-control-core-state]");
  const scene = mesh.querySelector(".control-mesh__scene");
  const hub = mesh.querySelector(".control-mesh__hub");
  const beacons = buttons.map((button) => button.querySelector(".control-mesh__beacon"));
  const demoToggle = mesh.querySelector("[data-control-toggle]");
  const announcer = mesh.querySelector("[data-control-announcer]");
  if (buttons.length !== stages.length || panels.length !== stages.length) return;

  const saveData = Boolean(navigator.connection?.saveData);
  const staticMode = PREFERS_REDUCED_MOTION || saveData;
  let active = 0;
  let meshVisible = false;
  let demoStarted = false;
  let demoStopped = staticMode;
  let demoComplete = false;
  let demoIndex = 0;
  let demoTimer = 0;
  let edgeFrame = 0;

  const alignEdges = () => {
    edgeFrame = 0;
    if (!scene || !hub || window.matchMedia("(max-width: 680px)").matches) return;
    const sceneRect = scene.getBoundingClientRect();
    const hubRect = hub.getBoundingClientRect();
    const originX = hubRect.left + hubRect.width / 2 - sceneRect.left;
    const originY = hubRect.top + hubRect.height / 2 - sceneRect.top;

    edges.forEach((edge, index) => {
      const beaconRect = beacons[index]?.getBoundingClientRect();
      if (!beaconRect) return;
      const targetX = beaconRect.left + beaconRect.width / 2 - sceneRect.left;
      const targetY = beaconRect.top + beaconRect.height / 2 - sceneRect.top;
      const deltaX = targetX - originX;
      const deltaY = targetY - originY;
      edge.style.setProperty("--edge-angle", `${Math.atan2(deltaY, deltaX)}rad`);
      edge.style.setProperty("--edge-length", `${Math.hypot(deltaX, deltaY)}px`);
    });
  };

  const requestEdgeAlign = () => {
    if (edgeFrame) return;
    edgeFrame = requestAnimationFrame(alignEdges);
  };

  const syncDemoToggle = () => {
    if (!demoToggle) return;
    if (staticMode) {
      demoToggle.hidden = true;
      return;
    }
    demoToggle.hidden = false;
    const label = demoComplete ? "Replay" : demoStopped ? "Play" : "Pause";
    demoToggle.textContent = label;
    demoToggle.setAttribute(
      "aria-label",
      demoComplete
        ? "Replay automatic control mesh sequence"
        : demoStopped
          ? "Play automatic control mesh sequence"
          : "Pause automatic control mesh sequence"
    );
  };

  const setActive = (index, announce = false) => {
    active = (index + stages.length) % stages.length;
    mesh.dataset.active = String(active);
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === active;
      button.setAttribute("aria-pressed", String(selected));
      nodes[buttonIndex]?.classList.toggle("is-active", selected);
    });
    edges.forEach((edge, edgeIndex) => edge.classList.toggle("is-active", edgeIndex === active));
    panels.forEach((panel, panelIndex) => {
      const selected = panelIndex === active;
      panel.classList.toggle("is-active", selected);
      panel.setAttribute("aria-hidden", String(!selected));
    });
    if (status) status.textContent = stages[active].status;
    if (coreState) coreState.textContent = stages[active].core;
    if (announce && announcer) announcer.textContent = stages[active].announcement;
    requestEdgeAlign();
  };

  const clearDemoTimer = () => {
    if (!demoTimer) return;
    clearTimeout(demoTimer);
    demoTimer = 0;
  };

  const stopDemo = () => {
    demoStopped = true;
    clearDemoTimer();
    syncDemoToggle();
  };

  const scheduleDemo = (delay = 2200) => {
    if (demoStopped || demoComplete || !meshVisible || document.hidden) return;
    clearDemoTimer();
    demoTimer = window.setTimeout(() => {
      demoTimer = 0;
      demoIndex += 1;
      if (demoIndex >= stages.length) {
        demoComplete = true;
        syncDemoToggle();
        return;
      }
      setActive(demoIndex, false);
      if (demoIndex === stages.length - 1) {
        demoComplete = true;
        syncDemoToggle();
        return;
      }
      scheduleDemo(2400);
    }, delay);
  };

  const resumeDemo = () => {
    if (demoStopped || demoComplete || !meshVisible || document.hidden) return;
    if (!demoStarted) {
      demoStarted = true;
      demoIndex = active;
      scheduleDemo(1300);
      return;
    }
    if (!demoTimer) scheduleDemo(700);
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      stopDemo();
      setActive(index, true);
    });
    button.addEventListener("keydown", (event) => {
      let next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % stages.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + stages.length) % stages.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = stages.length - 1;
      if (next === null) return;
      event.preventDefault();
      stopDemo();
      setActive(next, true);
      buttons[next].focus({ preventScroll: true });
    });
  });
  mesh.addEventListener("focusin", (event) => {
    if (event.target.closest("[data-control-toggle]")) return;
    stopDemo();
  });

  demoToggle?.addEventListener("click", () => {
    if (!demoStopped && !demoComplete) {
      stopDemo();
      return;
    }
    const restart = demoComplete || active === stages.length - 1;
    demoStopped = false;
    demoComplete = false;
    if (restart) {
      demoStarted = false;
      demoIndex = 0;
      setActive(0, false);
    } else {
      demoIndex = active;
    }
    syncDemoToggle();
    resumeDemo();
  });

  mesh.classList.add("is-armed");
  setActive(0, false);
  syncDemoToggle();

  if (typeof ResizeObserver !== "undefined" && scene) {
    const edgeObserver = new ResizeObserver(requestEdgeAlign);
    edgeObserver.observe(scene);
  } else {
    window.addEventListener("resize", requestEdgeAlign, { passive: true });
  }
  document.fonts?.ready.then(requestEdgeAlign);
  window.addEventListener("load", requestEdgeAlign, { once: true });

  if (staticMode) {
    mesh.classList.add("is-static", "is-ready");
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      meshVisible = Boolean(entry?.isIntersecting);
      mesh.classList.toggle("is-visible", meshVisible);
      if (meshVisible) {
        mesh.classList.add("is-ready");
        resumeDemo();
      } else {
        clearDemoTimer();
      }
    }, { threshold: 0.28, rootMargin: "0px 0px -8% 0px" });
    observer.observe(mesh);
  } else {
    meshVisible = true;
    mesh.classList.add("is-visible", "is-ready");
    resumeDemo();
  }

  document.addEventListener("visibilitychange", () => {
    mesh.classList.toggle("is-paused", document.hidden);
    if (document.hidden) clearDemoTimer();
    else resumeDemo();
  });
})();

(() => {
  // -- Act 3a: [data-live] cascades — fire once when scrolled into view ------
  if (PREFERS_REDUCED_MOTION) return;
  const targets = Array.from(document.querySelectorAll("[data-live]"));
  if (!targets.length) return;

  let pending = targets.slice();
  let raf = null;

  const sweep = () => {
    raf = null;
    const line = window.scrollY + window.innerHeight * 0.78;
    pending = pending.filter((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > line) return true;
      el.classList.add("is-live");
      return false;
    });
    if (!pending.length) window.removeEventListener("scroll", onScroll);
  };

  const onScroll = () => {
    if (raf === null) raf = requestAnimationFrame(sweep);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll);
  sweep();
})();

(() => {
  // -- audience cards: 3D tilt on hover (fine pointers only) -----------------
  if (PREFERS_REDUCED_MOTION) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".audience-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      // inline transition overrides the slow reveal transition while tilting
      card.style.transition = "transform 160ms ease-out";
      card.style.transform =
        `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) ` +
        `rotateY(${(px * 7).toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
      card.style.transition = "";
    });
  });
})();

(() => {
  // -- Act 3b: evidence stage — sticky frame with crossfading shots ----------
  const shots = document.querySelector(".stage-ev__shots");
  const pathLabel = document.querySelector("[data-stage-path]");
  const chapters = Array.from(document.querySelectorAll(".stage-ev__chapter"));
  const pictures = Array.from(shots?.querySelectorAll("picture[data-shot]") || []);
  const zoomTrigger = document.querySelector("[data-evidence-zoom]");
  if (!shots || !chapters.length) return;

  let raf = null;
  let active = -1;

  const update = () => {
    raf = null;
    const line = window.innerHeight * 0.52;
    let next = 0;
    chapters.forEach((chapter, i) => {
      if (chapter.getBoundingClientRect().top < line) next = i;
    });
    if (next === active) return;
    active = next;
    shots.dataset.active = String(next);
    chapters.forEach((chapter, i) => chapter.classList.toggle("is-active", i === next));
    pictures.forEach((picture, i) => {
      const selected = i === next;
      picture.classList.toggle("is-active", selected);
      if (selected) picture.removeAttribute("aria-hidden");
      else picture.setAttribute("aria-hidden", "true");
    });
    if (pathLabel) pathLabel.textContent = chapters[next].dataset.path || "";
    if (zoomTrigger) {
      const label = chapters[next].querySelector(".surface-panel__label")?.textContent.trim()
        || chapters[next].querySelector("h3")?.textContent.trim()
        || `Screenshot ${next + 1}`;
      zoomTrigger.setAttribute("aria-label", `Enlarge screenshot: ${label}`);
    }
  };

  const kick = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  window.addEventListener("load", kick);
  kick();
})();

(() => {
  // -- Evidence lightbox: one trigger always opens the active screenshot ----
  const shots = document.querySelector(".stage-ev__shots");
  const trigger = document.querySelector("[data-evidence-zoom]");
  const lightbox = document.getElementById("shotLightbox");
  const image = lightbox?.querySelector(".lightbox__image");
  const title = document.getElementById("shotLightboxTitle");
  const closeButtons = Array.from(lightbox?.querySelectorAll("[data-lightbox-close]") || []);
  if (!shots || !trigger || !lightbox || !image || !title || !closeButtons.length) return;

  const background = [
    document.querySelector(".nav"),
    document.getElementById("mobileMenu"),
    document.querySelector("main"),
    document.querySelector(".foot"),
    document.getElementById("toTop"),
    document.getElementById("consent"),
  ].filter(Boolean);
  let lastFocus = null;

  const activePicture = () => {
    const active = shots.dataset.active || "0";
    return shots.querySelector(`picture[data-shot="${active}"]`);
  };

  const open = () => {
    const picture = activePicture();
    const source = picture?.querySelector("img");
    if (!source) return;

    const active = shots.dataset.active || "0";
    const chapter = document.querySelector(`.stage-ev__chapter[data-shot="${active}"]`);
    lastFocus = document.activeElement;
    image.src = source.currentSrc || source.src;
    image.alt = source.alt || "";
    title.textContent = chapter?.querySelector("h3")?.textContent.trim() || "Okto Pulse screenshot";
    lightbox.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("lightbox-open");
    background.forEach((element) => { element.inert = true; });
    lightbox.querySelector(".lightbox__close")?.focus();
  };

  const close = () => {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    image.removeAttribute("src");
    image.alt = "";
    trigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lightbox-open");
    background.forEach((element) => { element.inert = false; });
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  trigger.addEventListener("click", open);
  closeButtons.forEach((button) => button.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      lightbox.querySelector(".lightbox__close")?.focus();
    }
  });
})();

(() => {
  // -- compare slider (Value before/after) -----------------------------------
  const compare = document.querySelector("[data-compare]");
  if (!compare) return;
  const range = compare.querySelector(".compare__range");
  if (!range) return;

  const set = (value) => compare.style.setProperty("--cut", `${value}%`);
  range.addEventListener("input", () => set(range.value));
  set(range.value);
})();

(() => {
  // -- nav: current-section context label ------------------------------------
  const label = document.querySelector(".nav__context");
  if (!label || !("IntersectionObserver" in window)) return;

  const sections = Array.from(document.querySelectorAll("main section")).filter((section) =>
    section.querySelector(".section__eyebrow")
  );
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const eyebrow = entry.target.querySelector(".section__eyebrow");
        if (!eyebrow) return;
        label.textContent = eyebrow.textContent.trim();
        label.classList.add("is-on");
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );
  sections.forEach((section) => io.observe(section));

  const hero = document.querySelector(".hero");
  if (hero) {
    const heroIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) label.classList.remove("is-on");
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    heroIo.observe(hero);
  }
})();
