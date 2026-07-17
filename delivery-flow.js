// Okto Pulse · narrative delivery relay
// Pulse owns the work state. Nexus coordinates ownership and handoffs.

(() => {
  "use strict";

  const demo = document.querySelector("[data-delivery-flow]");
  if (!demo || demo.dataset.deliveryReady === "true") return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const steps = Array.from(demo.querySelectorAll("[data-delivery-step]"));
  const stepButtons = steps.map((step) => step.querySelector("button"));
  const nodes = new Map(
    Array.from(demo.querySelectorAll("[data-delivery-node]")).map((node) => [node.dataset.deliveryNode, node])
  );
  const routes = new Map(
    Array.from(demo.querySelectorAll("[data-delivery-route]")).map((route) => [route.dataset.deliveryRoute, route])
  );

  const packet = demo.querySelector("[data-delivery-packet]");
  const pulseStatus = demo.querySelector("[data-delivery-pulse-status]");
  const nexusStatus = demo.querySelector("[data-delivery-nexus-status]");
  const workTitle = demo.querySelector("[data-delivery-work-title]");
  const stepNumber = demo.querySelector("[data-delivery-step-number]");
  const benefit = demo.querySelector("[data-delivery-benefit]");
  const phase = demo.querySelector("[data-delivery-phase]");
  const playbackStatus = demo.querySelector("[data-delivery-playback]");
  const announcer = demo.querySelector("[data-delivery-announcer]");
  const controls = demo.querySelector(".pulse-relay__controls");
  const stage = demo.querySelector(".pulse-relay__stage");
  const stepsViewport = demo.querySelector(".pulse-relay__steps");
  const previousButton = demo.querySelector('[data-delivery-action="previous"]');
  const toggleButton = demo.querySelector('[data-delivery-action="toggle"]');
  const nextButton = demo.querySelector('[data-delivery-action="next"]');
  const replayButton = demo.querySelector('[data-delivery-action="replay"]');

  if (
    steps.length !== 12 ||
    steps.some((step, index) => step.dataset.deliveryStep !== String(index)) ||
    stepButtons.some((button) => !button) ||
    nodes.size !== 6 ||
    routes.size !== 8 ||
    !packet ||
    !pulseStatus ||
    !nexusStatus ||
    !workTitle ||
    !stepNumber ||
    !benefit ||
    !phase ||
    !playbackStatus ||
    !announcer ||
    !controls ||
    !stage ||
    !stepsViewport ||
    !previousButton ||
    !toggleButton ||
    !nextButton ||
    !replayButton
  ) return;

  const STATES = [
    {
      phase: "ideation",
      phaseLabel: "IDEATION",
      pulse: "Ready for ideation",
      nexus: "No handoff yet",
      work: "Human asks Claude to begin",
      benefit: "Intent starts with a human request",
      activeNodes: ["human", "claude"],
      routes: [{ name: "human-claude" }],
    },
    {
      phase: "ideation",
      phaseLabel: "IDEATION",
      pulse: "Ideation saturated",
      nexus: "Direct agent work",
      work: "Mockups, KBs, and architecture attached",
      benefit: "Context becomes structured work",
      activeNodes: ["claude", "pulse"],
      routes: [{ name: "claude-pulse" }],
    },
    {
      phase: "refinement",
      phaseLabel: "HUMAN REVIEW",
      pulse: "Human feedback recorded",
      nexus: "Direct agent notification",
      work: "Comments stay on the ideation",
      benefit: "Feedback stays attached to the artifact",
      activeNodes: ["human", "pulse", "claude"],
      routes: [{ name: "human-pulse" }, { name: "human-claude" }],
    },
    {
      phase: "refinement",
      phaseLabel: "REFINEMENT",
      pulse: "Promoted to refinement",
      nexus: "No handoff yet",
      work: "Claude retrieves, revises, and promotes",
      benefit: "Refinement carries reviewed context",
      activeNodes: ["claude", "pulse"],
      routes: [{ name: "claude-pulse", reverse: true }, { name: "claude-pulse" }],
    },
    {
      phase: "refinement-validation",
      phaseLabel: "REFINEMENT VALIDATION",
      pulse: "Refinement ready",
      nexus: "Validation handoff open",
      work: "Claude requests independent validation",
      benefit: "Validation gets explicit ownership",
      activeNodes: ["claude", "nexus"],
      routes: [{ name: "claude-nexus" }],
    },
    {
      phase: "refinement-validation",
      phaseLabel: "REFINEMENT VALIDATION",
      pulse: "Refinement validated",
      nexus: "Antigravity claimed review",
      work: "Validation returns to Claude",
      benefit: "One eligible validator wins the claim",
      activeNodes: ["antigravity", "pulse", "nexus", "claude"],
      candidateNodes: ["codex", "antigravity"],
      ownerNodes: ["antigravity"],
      routes: [
        { name: "nexus-antigravity" },
        { name: "antigravity-pulse" },
        { name: "nexus-antigravity", reverse: true },
        { name: "claude-nexus", reverse: true },
      ],
    },
    {
      phase: "execution",
      phaseLabel: "SPEC + TASKS",
      pulse: "Spec submitted · tasks derived",
      nexus: "Execution handoff open",
      work: "Claude publishes implementation work",
      benefit: "Specs become executable tasks",
      activeNodes: ["claude", "pulse", "nexus"],
      routes: [{ name: "claude-pulse" }, { name: "claude-nexus" }],
    },
    {
      phase: "execution",
      phaseLabel: "EXECUTION",
      pulse: "Tasks ready for validation",
      nexus: "Codex owns execution",
      work: "Codex implements and updates Pulse",
      benefit: "Execution updates the source of truth",
      activeNodes: ["codex", "pulse", "nexus"],
      ownerNodes: ["codex"],
      routes: [{ name: "nexus-codex" }, { name: "codex-pulse" }],
    },
    {
      phase: "task-validation",
      phaseLabel: "TASK VALIDATION",
      pulse: "Tasks await validation",
      nexus: "Validation handoff open",
      work: "Codex requests an independent review",
      benefit: "Review becomes a separate responsibility",
      activeNodes: ["codex", "nexus"],
      routes: [{ name: "nexus-codex", reverse: true }],
    },
    {
      phase: "task-validation",
      phaseLabel: "TASK VALIDATION",
      pulse: "Validation submitted",
      nexus: "Antigravity owns review",
      work: "Antigravity validates directly in Pulse",
      benefit: "Validation lands beside the tasks",
      activeNodes: ["antigravity", "pulse", "nexus"],
      ownerNodes: ["antigravity"],
      routes: [{ name: "nexus-antigravity" }, { name: "antigravity-pulse" }],
    },
    {
      phase: "closeout",
      phaseLabel: "RETURN",
      pulse: "Validation recorded",
      nexus: "Codex notified",
      work: "Antigravity closes the review handoff",
      benefit: "The result returns to the implementer",
      activeNodes: ["antigravity", "nexus", "codex"],
      routes: [{ name: "nexus-antigravity", reverse: true }, { name: "nexus-codex" }],
    },
    {
      phase: "closeout",
      phaseLabel: "CLOSEOUT",
      pulse: "Delivery verified",
      nexus: "Workflow closed",
      work: "Claude notifies the human",
      benefit: "Every participant receives closure",
      activeNodes: ["codex", "nexus", "claude", "human", "pulse"],
      routes: [
        { name: "nexus-codex", reverse: true },
        { name: "claude-nexus", reverse: true },
        { name: "human-claude", reverse: true },
      ],
    },
  ];

  const referencedNodes = new Set(
    STATES.flatMap((state) => [
      ...(state.activeNodes || []),
      ...(state.candidateNodes || []),
      ...(state.ownerNodes || []),
    ])
  );
  const referencedRoutes = new Set(
    STATES.flatMap((state) => state.routes.map((route) => route.name))
  );
  if (
    Array.from(referencedNodes).some((name) => !nodes.has(name)) ||
    Array.from(referencedRoutes).some((name) => !routes.has(name))
  ) return;

  const PACKET_DURATION = 720;
  let currentStep = 0;
  let playing = false;
  let complete = false;
  let userPaused = motionQuery.matches || saveData;
  let inViewport = false;
  let timer = 0;
  let packetFrame = 0;
  let packetRun = 0;
  let togglePointerWasPlaying = false;

  const isStatic = () => motionQuery.matches || saveData;
  const dwellForStep = (index) => (index % 2 === 0 ? 2400 : 3400);

  const cancelTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };

  const cancelPacket = () => {
    packetRun += 1;
    if (packetFrame) window.cancelAnimationFrame(packetFrame);
    packetFrame = 0;
    packet?.classList.remove("is-moving");
  };

  const animatePacket = (routeConfigs) => {
    cancelPacket();
    const queue = Array.isArray(routeConfigs) ? routeConfigs : [];
    if (!packet || !queue.length || isStatic()) return;

    const activeRun = packetRun;
    const duration = queue.length > 2 ? 560 : PACKET_DURATION;

    const playRoute = (routeIndex) => {
      if (activeRun !== packetRun || routeIndex >= queue.length) {
        packet.classList.remove("is-moving");
        return;
      }

      const config = queue[routeIndex];
      const route = routes.get(config.name);
      if (!route || typeof route.getTotalLength !== "function") {
        playRoute(routeIndex + 1);
        return;
      }

      const length = route.getTotalLength();
      const startedAt = performance.now();
      packet.classList.add("is-moving");

      const draw = (now) => {
        if (activeRun !== packetRun) return;
        const raw = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        const distance = length * (config.reverse ? 1 - eased : eased);
        const point = route.getPointAtLength(distance);
        packet.setAttribute("cx", point.x.toFixed(2));
        packet.setAttribute("cy", point.y.toFixed(2));
        if (raw < 1) {
          packetFrame = window.requestAnimationFrame(draw);
          return;
        }
        packetFrame = window.requestAnimationFrame(() => playRoute(routeIndex + 1));
      };

      packetFrame = window.requestAnimationFrame(draw);
    };

    playRoute(0);
  };

  const scheduleNext = () => {
    cancelTimer();
    if (!playing) return;
    timer = window.setTimeout(() => {
      timer = 0;
      if (currentStep >= STATES.length - 1) {
        complete = true;
        setPlaying(false);
        return;
      }
      setStep(currentStep + 1, { animate: true, announce: false });
    }, dwellForStep(currentStep));
  };

  const syncPlayback = () => {
    demo.dataset.playing = String(playing);
    demo.dataset.static = String(isStatic());
    toggleButton.hidden = isStatic() || complete;
    replayButton.hidden = isStatic() || !complete;
    toggleButton.setAttribute(
      "aria-label",
      playing
        ? "Pause scenario"
        : currentStep === STATES.length - 1
          ? "Resume scenario"
          : "Play scenario"
    );
    if (!playbackStatus) return;
    playbackStatus.textContent = playing
      ? "Scenario playing"
      : complete
        ? "Scenario complete"
        : isStatic()
          ? "Manual mode"
          : "Scenario paused";
  };

  const setPlaying = (next) => {
    const wasPlaying = playing;
    playing = Boolean(next) && !complete && !isStatic() && inViewport && !document.hidden;
    syncPlayback();
    if (playing) {
      if (!wasPlaying) animatePacket(STATES[currentStep].routes);
      scheduleNext();
    } else {
      cancelTimer();
      cancelPacket();
    }
  };

  const keepActiveStepVisible = (smooth = false) => {
    if (!stepsViewport || stepsViewport.scrollHeight <= stepsViewport.clientHeight + 1) return;
    const activeStep = steps[currentStep];
    const top = activeStep.offsetTop - stepsViewport.offsetTop;
    const bottom = top + activeStep.offsetHeight;
    const viewportTop = stepsViewport.scrollTop;
    const viewportBottom = viewportTop + stepsViewport.clientHeight;
    let target = viewportTop;
    if (top < viewportTop) target = top;
    else if (bottom > viewportBottom) target = bottom - stepsViewport.clientHeight;
    else return;

    if (typeof stepsViewport.scrollTo === "function") {
      stepsViewport.scrollTo({
        top: Math.max(0, target),
        behavior: smooth && !motionQuery.matches ? "smooth" : "auto",
      });
    } else {
      stepsViewport.scrollTop = Math.max(0, target);
    }
  };

  const setStep = (next, options = {}) => {
    const { animate = true, announce = false } = options;
    currentStep = Math.max(0, Math.min(STATES.length - 1, next));
    if (currentStep < STATES.length - 1) complete = false;
    else if (!playing) complete = true;
    const state = STATES[currentStep];

    demo.dataset.step = String(currentStep);
    demo.dataset.phase = state.phase;
    demo.style.setProperty("--delivery-progress", `${((currentStep + 1) / STATES.length) * 100}%`);
    pulseStatus.textContent = state.pulse;
    nexusStatus.textContent = state.nexus;
    workTitle.textContent = state.work;
    stepNumber.textContent = String(currentStep + 1).padStart(2, "0");
    benefit.textContent = state.benefit;
    phase.textContent = state.phaseLabel;

    steps.forEach((step, index) => {
      const button = stepButtons[index];
      const selected = index === currentStep;
      step.classList.toggle("is-active", selected);
      step.classList.toggle("is-complete", index < currentStep);
      button.tabIndex = selected ? 0 : -1;
      if (selected) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    const activeNodes = new Set(state.activeNodes || []);
    const candidateNodes = new Set(state.candidateNodes || []);
    const ownerNodes = new Set(state.ownerNodes || []);
    const completedNodes = new Set(
      STATES.slice(0, currentStep).flatMap((previous) => previous.activeNodes || [])
    );

    nodes.forEach((node, name) => {
      node.classList.toggle("is-active", activeNodes.has(name));
      node.classList.toggle("is-complete", completedNodes.has(name) && !activeNodes.has(name));
      node.classList.toggle("is-candidate", candidateNodes.has(name));
      node.classList.toggle("is-owner", ownerNodes.has(name));
    });

    const activeRoutes = new Set(state.routes.map((route) => route.name));
    const completedRoutes = new Set(
      STATES.slice(0, currentStep).flatMap((previous) => previous.routes.map((route) => route.name))
    );
    routes.forEach((route, name) => {
      route.classList.toggle("is-active", activeRoutes.has(name));
      route.classList.toggle("is-complete", completedRoutes.has(name) && !activeRoutes.has(name));
    });

    if (previousButton) previousButton.disabled = currentStep === 0;
    if (nextButton) nextButton.disabled = currentStep === STATES.length - 1;

    syncPlayback();
    if (animate) animatePacket(state.routes);
    else cancelPacket();
    if (playing) scheduleNext();
    keepActiveStepVisible(announce);

    if (announce && announcer) {
      const title = stepButtons[currentStep].querySelector("strong")?.textContent?.trim() || "Event updated";
      announcer.textContent = `Step ${currentStep + 1}. ${title}. ${state.benefit}.`;
    }
  };

  controls?.setAttribute("role", "group");
  controls?.setAttribute("aria-label", "Scenario playback controls");
  if (controls) controls.hidden = false;
  stepButtons.forEach((button) => {
    button.disabled = false;
  });

  steps.forEach((step, index) => {
    const button = stepButtons[index];
    button.addEventListener("click", () => {
      userPaused = true;
      setPlaying(false);
      setStep(index, { animate: true, announce: true });
    });
    button.addEventListener("keydown", (event) => {
      let target = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (index + 1) % steps.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (index - 1 + steps.length) % steps.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = steps.length - 1;
      if (target === null) return;
      event.preventDefault();
      userPaused = true;
      setPlaying(false);
      setStep(target, { animate: true, announce: true });
      stepButtons[target].focus();
    });
  });

  previousButton?.addEventListener("click", () => {
    userPaused = true;
    setPlaying(false);
    setStep(currentStep - 1, { animate: true, announce: true });
  });

  nextButton?.addEventListener("click", () => {
    userPaused = true;
    setPlaying(false);
    setStep(currentStep + 1, { animate: true, announce: true });
  });

  toggleButton.addEventListener("pointerdown", (event) => {
    togglePointerWasPlaying = event.button === 0 && playing;
  });

  toggleButton.addEventListener("pointercancel", () => {
    togglePointerWasPlaying = false;
  });

  toggleButton?.addEventListener("click", () => {
    if (togglePointerWasPlaying) {
      togglePointerWasPlaying = false;
      userPaused = true;
      setPlaying(false);
      return;
    }
    if (playing) {
      userPaused = true;
      setPlaying(false);
      return;
    }
    userPaused = false;
    setPlaying(true);
  });

  replayButton?.addEventListener("click", () => {
    userPaused = false;
    complete = false;
    setStep(0, { animate: false, announce: true });
    toggleButton?.focus({ preventScroll: true });
    setPlaying(true);
  });

  demo.addEventListener("focusin", () => {
    if (!playing) return;
    userPaused = true;
    setPlaying(false);
  });

  demo.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || !playing) return;
    userPaused = true;
    setPlaying(false);
  });

  const visibilityObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.35);
        if (!inViewport) setPlaying(false);
        else if (!userPaused && currentStep < STATES.length - 1) setPlaying(true);
      },
      { threshold: [0, 0.35, 0.6], rootMargin: "0px 0px -6% 0px" }
    )
    : null;

  if (visibilityObserver) visibilityObserver.observe(stage);
  else {
    inViewport = true;
    userPaused = true;
    setPlaying(false);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) setPlaying(false);
    else if (inViewport && !userPaused && currentStep < STATES.length - 1) setPlaying(true);
  });

  const onMotionChange = () => {
    userPaused = true;
    setPlaying(false);
    setStep(currentStep, { animate: false, announce: false });
  };

  if (typeof motionQuery.addEventListener === "function") motionQuery.addEventListener("change", onMotionChange);
  else motionQuery.addListener(onMotionChange);

  demo.dataset.deliveryReady = "true";
  demo.classList.add("is-ready");
  setStep(0, { animate: false, announce: false });
  syncPlayback();
  if (playbackStatus && !isStatic()) playbackStatus.textContent = "Scenario ready";
})();
