// -----------------------------------------------------------------------------
// Okto Pulse · lightweight depth corridor
// A deterministic Canvas2D world follows native scroll. There is no permanent
// animation loop and no transform is ever applied to product content.
// -----------------------------------------------------------------------------

(() => {
  "use strict";

  const canvas = document.getElementById("pulseDepthCanvas");
  const sceneElements = Array.from(document.querySelectorAll("[data-depth-scene]"));
  if (!canvas || !sceneElements.length) return;

  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context) return;

  const TAU = Math.PI * 2;
  const CHAPTER_DEPTH = 20;
  const NEAR = 0.8;
  const FAR = 30;

  const COLORS = {
    dark: [6, 6, 10],
    white: [232, 242, 250],
    danger: [255, 61, 76],
    dangerHot: [255, 104, 76],
    cyan: [34, 211, 238],
    blue: [59, 130, 246],
    violet: [168, 85, 247],
    magenta: [236, 72, 153],
  };

  const SCENES = {
    hero: { label: "SIGNAL", accent: COLORS.cyan },
    problem: { label: "CONTROL LOSS", accent: COLORS.danger },
    adlc: { label: "FEATURE TRACE", accent: COLORS.cyan },
    pipeline: { label: "DELIVERY FLOW", accent: COLORS.cyan },
    value: { label: "SYSTEM VALUE", accent: COLORS.blue },
    evidence: { label: "EVIDENCE", accent: COLORS.violet },
    knowledge: { label: "PROJECT MEMORY", accent: COLORS.violet },
    features: { label: "CAPABILITIES", accent: COLORS.cyan },
    agents: { label: "USE CASES", accent: COLORS.magenta },
    mcp: { label: "MCP SURFACE", accent: COLORS.violet },
    install: { label: "ACTIVATE", accent: COLORS.cyan },
    claims: { label: "CONTROL", accent: COLORS.magenta },
  };

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return t * t * (3 - 2 * t);
  };
  const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
  const mix = (from, to, amount) => [
    Math.round(lerp(from[0], to[0], amount)),
    Math.round(lerp(from[1], to[1], amount)),
    Math.round(lerp(from[2], to[2], amount)),
  ];
  const rgba = (color, alpha) =>
    `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${clamp(alpha).toFixed(4)})`;

  const hash = (value) => {
    let x = value | 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
  };

  const sceneState = sceneElements.map((element, index) => {
    const name = element.dataset.depthScene || `chapter-${index}`;
    return {
      element,
      index,
      name,
      meta: SCENES[name] || { label: "PULSE", accent: COLORS.cyan },
      top: 0,
      bottom: 0,
    };
  });

  const objects = {
    gates: [],
    panels: [],
    nodes: [],
    edges: [],
    shards: [],
    stars: [],
    packets: [],
  };

  sceneState.forEach((scene, sceneIndex) => {
    const baseZ = sceneIndex * CHAPTER_DEPTH;
    objects.gates.push(
      { z: baseZ + 6, sceneIndex, label: `${String(sceneIndex).padStart(2, "0")} / ${scene.meta.label}` },
      { z: baseZ + 16, sceneIndex, label: scene.meta.label },
    );

    objects.panels.push({
      z: baseZ + 11,
      x: sceneIndex % 2 ? 5.2 : -5.2,
      y: -0.9 + (sceneIndex % 3) * 0.8,
      side: sceneIndex % 2 ? 1 : -1,
      sceneIndex,
      label: scene.meta.label,
    });

    const nodeStart = objects.nodes.length;
    for (let nodeIndex = 0; nodeIndex < 6; nodeIndex += 1) {
      const seed = sceneIndex * 41 + nodeIndex * 17;
      objects.nodes.push({
        z: baseZ + 4.5 + nodeIndex * 2.45,
        x: (hash(seed) - 0.5) * 9.2,
        y: (hash(seed + 9) - 0.5) * 5.4,
        sceneIndex,
        seed,
      });
      if (nodeIndex > 0) objects.edges.push([nodeStart + nodeIndex - 1, nodeStart + nodeIndex]);
      if (nodeIndex > 1 && nodeIndex % 2 === 0) objects.edges.push([nodeStart, nodeStart + nodeIndex]);
    }
  });

  const problemIndex = Math.max(0, sceneState.findIndex((scene) => scene.name === "problem"));
  const problemZ = problemIndex * CHAPTER_DEPTH;
  for (let index = 0; index < 22; index += 1) {
    objects.shards.push({
      z: problemZ + 1.5 + hash(index * 31) * (CHAPTER_DEPTH - 2.5),
      x: (hash(index * 47 + 3) - 0.5) * 15,
      y: (hash(index * 61 + 7) - 0.5) * 8,
      size: 0.08 + hash(index * 73 + 11) * 0.24,
      rotation: hash(index * 89 + 13) * TAU,
    });
  }

  for (let index = 0; index < 82; index += 1) {
    objects.stars.push({
      x: (hash(index * 29 + 5) - 0.5) * 18,
      y: (hash(index * 43 + 7) - 0.5) * 10,
      z: hash(index * 59 + 11) * FAR,
      size: 0.35 + hash(index * 71 + 17) * 1.15,
    });
  }

  for (let index = 0; index < 20; index += 1) {
    objects.packets.push({
      lane: (index % 5) - 2,
      z: hash(index * 37 + 19) * (FAR - 2) + 1,
      size: 0.04 + hash(index * 53 + 23) * 0.05,
    });
  }

  objects.gates.sort((a, b) => b.z - a.z);
  objects.panels.sort((a, b) => b.z - a.z);

  const reducedMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    focal: 1,
    scrollY: window.scrollY || 0,
    cameraZ: 0,
    activeIndex: 0,
    localProgress: 0,
    layoutDirty: true,
    raf: 0,
    enabled: true,
  };
  let lastDraw = 0;

  const documentTop = (element) => {
    let top = 0;
    let current = element;
    while (current) {
      top += current.offsetTop || 0;
      current = current.offsetParent;
    }
    return top;
  };

  const measure = () => {
    sceneState.forEach((scene) => {
      scene.top = documentTop(scene.element);
      scene.bottom = scene.top + scene.element.offsetHeight;
    });
    state.layoutDirty = false;
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, Math.round(rect.width || window.innerWidth));
    state.height = Math.max(1, Math.round(rect.height || window.innerHeight));
    state.enabled = state.width >= 1024 && state.height >= 700 && !reducedMedia.matches && !saveData;
    const dprCap = state.enabled ? 1.25 : 1;
    const pixelBudgetDpr = Math.sqrt(2_100_000 / Math.max(1, state.width * state.height));
    state.dpr = Math.max(0.25, Math.min(window.devicePixelRatio || 1, dprCap, pixelBudgetDpr));
    state.focal = Math.min(state.width, state.height) * 0.88;

    const pixelWidth = Math.max(1, Math.round(state.width * state.dpr));
    const pixelHeight = Math.max(1, Math.round(state.height * state.dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    state.layoutDirty = true;
  };

  const readScroll = () => {
    if (state.layoutDirty) measure();
    state.scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const focusY = state.scrollY + state.height * 0.48;

    let activeIndex = 0;
    for (let index = 1; index < sceneState.length; index += 1) {
      if (focusY >= sceneState[index].top) activeIndex = index;
      else break;
    }

    const current = sceneState[activeIndex];
    const nextTop = activeIndex < sceneState.length - 1
      ? sceneState[activeIndex + 1].top
      : Math.max(current.bottom, document.documentElement.scrollHeight);
    const localProgress = clamp((focusY - current.top) / Math.max(1, nextTop - current.top));

    state.activeIndex = activeIndex;
    state.localProgress = localProgress;
    state.cameraZ = (activeIndex + localProgress) * CHAPTER_DEPTH;

  };

  const project = (x, y, worldZ) => {
    const depth = worldZ - state.cameraZ;
    if (depth <= NEAR || depth >= FAR) return null;
    const scale = state.focal / depth;
    const nearFade = smoothstep(NEAR, NEAR + 1.3, depth);
    const farFade = 1 - smoothstep(FAR - 8, FAR, depth);
    return {
      x: state.width * 0.5 + x * scale,
      y: state.height * 0.49 + y * scale,
      scale,
      alpha: nearFade * farFade,
      depth,
    };
  };

  const line = (from, to, color, alpha, width = 1) => {
    if (!from || !to || alpha <= 0.002) return;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.strokeStyle = rgba(color, alpha);
    context.lineWidth = width;
    context.stroke();
  };

  const currentLook = () => {
    const scene = sceneState[state.activeIndex];
    let danger = 0;
    let portal = 0;
    if (scene.name === "problem") {
      danger = 1;
      portal = smoothstep(0.8, 0.98, state.localProgress);
    }
    if (scene.name === "adlc") {
      danger = 1 - smoothstep(0.02, 0.38, state.localProgress);
      portal = 1 - smoothstep(0.04, 0.62, state.localProgress);
    }
    return {
      scene,
      danger,
      portal,
      accent: mix(scene.meta.accent, COLORS.danger, danger),
    };
  };

  const drawBackdrop = ({ accent, danger }) => {
    const glow = context.createRadialGradient(
      state.width * 0.5,
      state.height * 0.48,
      0,
      state.width * 0.5,
      state.height * 0.48,
      Math.max(state.width, state.height) * 0.72,
    );
    glow.addColorStop(0, rgba(accent, lerp(0.065, 0.1, danger)));
    glow.addColorStop(0.42, rgba(accent, lerp(0.02, 0.035, danger)));
    glow.addColorStop(1, rgba(COLORS.dark, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, state.width, state.height);
  };

  const drawStars = ({ accent, danger }) => {
    for (let index = 0; index < objects.stars.length; index += 1) {
      const star = objects.stars[index];
      const depth = NEAR + 0.2 + mod(star.z - state.cameraZ * 0.16, FAR - NEAR - 0.4);
      const jitter = (hash(index + Math.floor(state.cameraZ * 3)) - 0.5) * 0.35 * danger;
      const point = project(star.x + jitter, star.y - jitter * 0.4, state.cameraZ + depth);
      if (!point) continue;
      const size = clamp(star.size * point.scale * 0.012, 0.35, 1.8);
      context.fillStyle = rgba(mix(COLORS.white, accent, 0.52), point.alpha * 0.2);
      context.fillRect(point.x, point.y, size, size);
    }
  };

  const drawCorridor = ({ accent, danger }) => {
    const lanes = [-6.8, -3.4, 0, 3.4, 6.8];
    const start = state.cameraZ + NEAR + 0.2;
    const end = state.cameraZ + FAR - 0.4;

    lanes.forEach((lane, laneIndex) => {
      let previousGround = null;
      let previousCeiling = null;
      let segment = 0;
      for (let z = start; z < end; z += 3.1) {
        const seed = laneIndex * 101 + segment * 29 + Math.floor(state.cameraZ * 2);
        const noise = (hash(seed) - 0.5) * 1.15 * danger;
        const ground = project(lane + noise, 4.2 + noise * 0.2, z);
        const ceiling = project(lane * 0.9 - noise * 0.4, -4.1, z);
        const broken = hash(seed + 17) < 0.28 * danger;
        if (!broken && previousGround && ground) {
          line(previousGround, ground, accent, Math.min(previousGround.alpha, ground.alpha) * 0.25, laneIndex === 2 ? 1.1 : 0.65);
        }
        if (!broken && previousCeiling && ceiling) {
          line(previousCeiling, ceiling, accent, Math.min(previousCeiling.alpha, ceiling.alpha) * 0.12, 0.55);
        }
        previousGround = ground;
        previousCeiling = ceiling;
        segment += 1;
      }
    });

    const spacing = lerp(4.3, 5.4, danger);
    for (let z = Math.ceil(start / spacing) * spacing; z < end; z += spacing) {
      if (hash(Math.floor(z * 13)) < 0.24 * danger) continue;
      const left = project(-8.2, 4.2, z);
      const right = project(8.2, 4.2, z);
      line(left, right, accent, (left?.alpha || 0) * 0.17, 0.65);
    }
  };

  const drawGate = (gate, look) => {
    const depth = gate.z - state.cameraZ;
    if (depth <= NEAR || depth >= FAR) return;
    const jitter = (hash(gate.sceneIndex * 79 + Math.floor(state.cameraZ * 4)) - 0.5) * 0.4 * look.danger;
    const corners = [
      project(-8 + jitter, -4.15, gate.z),
      project(8 + jitter, -4.15 + jitter, gate.z),
      project(8 - jitter, 4.15, gate.z),
      project(-8 - jitter, 4.15 - jitter, gate.z),
    ];
    if (corners.some((point) => !point)) return;
    const alpha = Math.min(...corners.map((point) => point.alpha));
    context.beginPath();
    context.moveTo(corners[0].x, corners[0].y);
    for (let index = 1; index < corners.length; index += 1) context.lineTo(corners[index].x, corners[index].y);
    context.closePath();
    context.strokeStyle = rgba(look.accent, alpha * 0.35);
    context.lineWidth = 0.8;
    context.stroke();

    const width = Math.abs(corners[1].x - corners[0].x);
    if (width > 180 && alpha > 0.12) {
      context.font = '500 9px "IBM Plex Mono", monospace';
      context.fillStyle = rgba(look.accent, alpha * 0.62);
      context.textAlign = "left";
      context.fillText(gate.label, corners[0].x + 9, corners[0].y - 8);
    }
  };

  const drawPanel = (panel, look) => {
    const center = project(panel.x, panel.y, panel.z);
    if (!center) return;
    const width = clamp(center.scale * 3.4, 26, 290);
    const height = width * 0.48;
    const x = center.x - width * 0.5;
    const y = center.y - height * 0.5;
    context.fillStyle = rgba(mix(COLORS.dark, look.accent, 0.08), center.alpha * 0.34);
    context.strokeStyle = rgba(look.accent, center.alpha * 0.34);
    context.lineWidth = 0.7;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);
    context.fillStyle = rgba(look.accent, center.alpha * 0.3);
    context.fillRect(x + width * 0.08, y + height * 0.34, width * 0.62, 1);
    context.fillRect(x + width * 0.08, y + height * 0.58, width * 0.42, 1);

    if (width > 118) {
      context.font = '500 8px "IBM Plex Mono", monospace';
      context.fillStyle = rgba(look.accent, center.alpha * 0.58);
      context.fillText(panel.label, x + width * 0.08, y + height * 0.2);
    }
  };

  const drawGraph = (look) => {
    for (let index = 0; index < objects.edges.length; index += 1) {
      const [fromIndex, toIndex] = objects.edges[index];
      const fromNode = objects.nodes[fromIndex];
      const toNode = objects.nodes[toIndex];
      const from = project(fromNode.x, fromNode.y, fromNode.z);
      const to = project(toNode.x, toNode.y, toNode.z);
      if (!from || !to) continue;
      const broken = hash(index * 43 + Math.floor(state.cameraZ * 3)) < 0.32 * look.danger;
      if (!broken) line(from, to, look.accent, Math.min(from.alpha, to.alpha) * 0.16, 0.65);
    }

    for (let index = 0; index < objects.nodes.length; index += 1) {
      const node = objects.nodes[index];
      const point = project(node.x, node.y, node.z);
      if (!point) continue;
      const radius = clamp(point.scale * 0.052, 0.7, 3.2);
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, TAU);
      context.fillStyle = rgba(look.accent, point.alpha * 0.55);
      context.fill();
    }
  };

  const drawPackets = (look) => {
    for (let index = 0; index < objects.packets.length; index += 1) {
      const packet = objects.packets[index];
      const depth = NEAR + mod(packet.z - state.cameraZ * 0.42, FAR - NEAR);
      const drift = (hash(index + Math.floor(state.cameraZ * 5)) - 0.5) * 0.9 * look.danger;
      const point = project(packet.lane * 3.4 + drift, 4.08, state.cameraZ + depth);
      if (!point) continue;
      const radius = clamp(packet.size * point.scale, 0.7, 3.5);
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, TAU);
      context.fillStyle = rgba(look.accent, point.alpha * 0.55);
      context.fill();
    }
  };

  const drawShards = (look) => {
    if (look.danger < 0.03) return;
    for (let index = 0; index < objects.shards.length; index += 1) {
      const shard = objects.shards[index];
      const point = project(shard.x, shard.y, shard.z);
      if (!point) continue;
      const radius = clamp(shard.size * point.scale, 0.8, 14);
      const rotation = shard.rotation + state.cameraZ * 0.03;
      context.beginPath();
      for (let vertex = 0; vertex < 3; vertex += 1) {
        const angle = rotation + vertex * TAU / 3;
        const x = point.x + Math.cos(angle) * radius;
        const y = point.y + Math.sin(angle) * radius * 0.62;
        if (vertex === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.strokeStyle = rgba(COLORS.dangerHot, point.alpha * look.danger * 0.26);
      context.lineWidth = 0.6;
      context.stroke();
    }
  };

  const drawPortal = (look) => {
    if (look.portal < 0.02) return;
    const centerX = state.width * 0.5;
    const centerY = state.height * 0.49;
    const radius = Math.min(state.width, state.height) * (0.18 + look.portal * 0.22);
    const portalColor = mix(COLORS.cyan, COLORS.danger, look.danger);
    for (let ring = 0; ring < 3; ring += 1) {
      context.beginPath();
      context.arc(centerX, centerY, radius * (0.72 + ring * 0.16), 0, TAU);
      context.strokeStyle = rgba(portalColor, look.portal * (0.24 - ring * 0.05));
      context.lineWidth = 1;
      context.stroke();
    }
  };

  const render = (time) => {
    state.raf = 0;
    if (state.enabled && time - lastDraw < 32) {
      state.raf = window.requestAnimationFrame(render);
      return;
    }
    lastDraw = time;
    readScroll();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!state.enabled) return;

    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    const look = currentLook();

    drawBackdrop(look);
    drawStars(look);
    drawCorridor(look);
    for (let index = 0; index < objects.gates.length; index += 1) drawGate(objects.gates[index], look);
    drawPortal(look);
    for (let index = 0; index < objects.panels.length; index += 1) drawPanel(objects.panels[index], look);
    drawGraph(look);
    drawPackets(look);
    drawShards(look);
  };

  const schedule = () => {
    if (!state.enabled && !state.layoutDirty) return;
    if (!state.raf) state.raf = window.requestAnimationFrame(render);
  };

  const onResize = () => {
    resize();
    schedule();
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  window.addEventListener("load", () => {
    state.layoutDirty = true;
    schedule();
  }, { once: true });

  if (typeof reducedMedia.addEventListener === "function") {
    reducedMedia.addEventListener("change", onResize);
  } else if (typeof reducedMedia.addListener === "function") {
    reducedMedia.addListener(onResize);
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      state.layoutDirty = true;
      schedule();
    });
    observer.observe(document.documentElement);
  }

  resize();
  measure();
  canvas.dataset.depthRenderer = "ready";
  schedule();
})();
