const { ipcRenderer } = require("electron");

const allowedMotionStates = new Set(["idle", "run-left", "run-right"]);
const allowedReactionStates = new Set(["idle", "running-right", "running-left", "waving", "jumping", "failed", "waiting", "running", "review"]);
let lastInteractiveHit = null;
let dragging = false;

// --- Mochi drag / bounce settle ---
function setDraggingVisual(active) {
  document.body.classList.toggle("dragging", active);
  if (!active) {
    document.body.classList.add("mochi-settle");
    setTimeout(() => document.body.classList.remove("mochi-settle"), 400);
  }
}

// --- Eye follow: flip sprite to face cursor direction ---
let lastCursorSide = "right";
function applyCursorSide(side) {
  if (side === lastCursorSide) return;
  lastCursorSide = side;
  document.documentElement.dataset.cursorSide = side;
}

// Track cursor relative to the pet center when mouse is inside the window
function updateCursorSideFromEvent(event) {
  const hitbox = document.querySelector(".pet-hitbox");
  if (!hitbox) return;
  const rect = hitbox.getBoundingClientRect();
  const petCenterX = rect.left + rect.width / 2;
  applyCursorSide(event.clientX < petCenterX ? "left" : "right");
}

// Main process sends global cursor direction when mouse is outside window
ipcRenderer.on("nekodrift:cursor-direction", (_event, side) => {
  if (side === "left" || side === "right") applyCursorSide(side);
});

const dismissBubble = (event) => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const bubble = target.closest(".bubble");
  if (!bubble) return;

  const dismissToken = bubble.dataset.dismissToken;
  if (!dismissToken) return;

  event.preventDefault();
  event.stopPropagation();

  bubble.remove();

  const newTarget = document.elementFromPoint(event.clientX, event.clientY);
  const stillInteractive = Boolean(newTarget && newTarget.closest(".pet-hitbox, .pet-shell, .bubble")) || dragging;
  reportInteractiveHit(stillInteractive, "bubble-dismiss", true);

  ipcRenderer.send("nekodrift:bubble-dismissed", dismissToken);
};

ipcRenderer.on("nekodrift:pet-motion", (_event, state) => {
  if (!allowedMotionStates.has(state)) {
    return;
  }

  const apply = () => {
    document.documentElement.dataset.motionState = state;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
});

ipcRenderer.on("nekodrift:pet-reaction-state", (_event, state) => {
  if (!allowedReactionStates.has(state)) {
    return;
  }

  const apply = () => {
    document.documentElement.dataset.reactionState = state;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
});

ipcRenderer.on("nekodrift:pet-content-state", (_event, state) => {
  if (!state || typeof state.bodyHtml !== "string" || state.bodyHtml.length > 64 * 1024 || !allowedReactionStates.has(state.reactionState)) {
    return;
  }

  const apply = () => {
    document.documentElement.dataset.reactionState = state.reactionState;
    document.body.innerHTML = state.bodyHtml;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
});

const getInteractiveTarget = (event) => {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  return target && target.closest(".pet-hitbox, .pet-shell, .bubble");
};

const reportInteractiveHit = (interactive, source, force = false) => {
  if (!force && lastInteractiveHit === interactive) return;
  lastInteractiveHit = interactive;
  ipcRenderer.send("nekodrift:pet-hit-test", interactive, source);
};

const setInteractiveHit = (interactive, source = "mouse") => {
  if (lastInteractiveHit === interactive) return;
  reportInteractiveHit(interactive, source);
};

const updateInteractiveHit = (event) => {
  setInteractiveHit(Boolean(getInteractiveTarget(event)) || dragging);
};

ipcRenderer.on("nekodrift:pet-probe-hit-test", (_event, point) => {
  if (!point || typeof point.clientX !== "number" || typeof point.clientY !== "number" || !Number.isFinite(point.clientX) || !Number.isFinite(point.clientY)) return;
  const clientX = point.clientX;
  const clientY = point.clientY;
  const target = document.elementFromPoint(clientX, clientY);
  reportInteractiveHit(Boolean(target && target.closest(".pet-hitbox, .pet-shell, .bubble")) || dragging, typeof point.reason === "string" ? point.reason.slice(0, 80) : "probe", true);
});

const installMouseInterop = () => {
  lastInteractiveHit = null;
  dragging = false;

  document.addEventListener("click", dismissBubble);

  document.addEventListener("mousemove", (event) => {
    updateInteractiveHit(event);
    updateCursorSideFromEvent(event);
    if (dragging) ipcRenderer.send("nekodrift:pet-drag-move", { screenX: event.screenX, screenY: event.screenY });
  }, { passive: true });

  document.addEventListener("mousedown", (event) => {
    const target = getInteractiveTarget(event);
    setInteractiveHit(Boolean(target));
    if (event.button !== 0 || !target?.closest(".pet-hitbox, .pet-shell")) return;
    event.preventDefault();
    dragging = true;
    setInteractiveHit(true);
    setDraggingVisual(true);
    ipcRenderer.send("nekodrift:pet-drag-start", { screenX: event.screenX, screenY: event.screenY });
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    setDraggingVisual(false);
    ipcRenderer.send("nekodrift:pet-drag-end");
  });

  document.addEventListener("mouseleave", () => {
    if (!dragging) setInteractiveHit(false);
  }, { passive: true });

  setInteractiveHit(false, "ready");
  ipcRenderer.send("nekodrift:pet-ready");
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installMouseInterop, { once: true });
} else {
  installMouseInterop();
}
