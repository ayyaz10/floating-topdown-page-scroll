// Prevent duplicate injection and ignore iframes.
if (window.__scrollButtonsInjected || window.top !== window.self) {
  // already injected or running inside an iframe
} else {
  window.__scrollButtonsInjected = true;

  function initScrollButtons() {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const STORAGE_KEY_SCROLL = `scroll_pos_${location.pathname}`;
    const STORAGE_KEY_CONTAINER = `container_pos_${location.pathname}`;
    const STORAGE_KEY_COLORS = "button_colors";

    const DEFAULT_BG_COLOR = "rgba(0, 0, 0, 0.7)";
    const DEFAULT_TEXT_COLOR = "white";
    const MAX_RESTORE_ATTEMPTS = 3;
    const RESTORE_RETRY_DELAYS = [150, 400, 900];

    let currentBgColor = DEFAULT_BG_COLOR;
    let currentTextColor = DEFAULT_TEXT_COLOR;
    let isDragging = false;
    let dragMoved = false;
    let hasUserInteracted = false;
    let restoreTimer = null;
    let restoreAttempts = 0;
    let restoreCompleted = false;

    const savedScrollValue = localStorage.getItem(STORAGE_KEY_SCROLL);
    const savedScrollTarget = Number.parseInt(savedScrollValue ?? "", 10);
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    const navigationType = navigationEntry ? navigationEntry.type : "navigate";
    const shouldRestoreScroll =
      Number.isFinite(savedScrollTarget) &&
      (navigationType === "reload" || navigationType === "back_forward");

    function getStoredColors() {
      const stored = localStorage.getItem(STORAGE_KEY_COLORS);

      if (stored) {
        try {
          const colors = JSON.parse(stored);
          currentBgColor = colors.bgColor;
          currentTextColor = colors.textColor;
          return colors;
        } catch (error) {
          return { bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR };
        }
      }

      return { bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR };
    }

    function saveColors(bgColor, textColor) {
      currentBgColor = bgColor;
      currentTextColor = textColor;
      localStorage.setItem(
        STORAGE_KEY_COLORS,
        JSON.stringify({ bgColor, textColor }),
      );
    }

    function saveScrollPosition() {
      const scrollPos = window.scrollY || window.pageYOffset;
      localStorage.setItem(STORAGE_KEY_SCROLL, scrollPos.toString());
    }

    function getMaxScrollHeight() {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
      );
    }

    function getMaxScrollTop() {
      return Math.max(0, getMaxScrollHeight() - window.innerHeight);
    }

    function clearScheduledRestore() {
      if (restoreTimer !== null) {
        clearTimeout(restoreTimer);
        restoreTimer = null;
      }
    }

    function cancelScrollRestore() {
      hasUserInteracted = true;
      clearScheduledRestore();
    }

    function restoreScrollPosition() {
      if (!shouldRestoreScroll || restoreCompleted || hasUserInteracted) {
        return;
      }

      const targetPos = Math.min(savedScrollTarget, getMaxScrollTop());
      const currentPos = window.scrollY || window.pageYOffset;

      if (Math.abs(currentPos - targetPos) <= 2) {
        restoreCompleted = true;
        clearScheduledRestore();
        return;
      }

      window.scrollTo({ top: targetPos, behavior: "auto" });
      restoreAttempts += 1;

      const updatedPos = window.scrollY || window.pageYOffset;
      const reachedTarget = Math.abs(updatedPos - targetPos) <= 2;

      if (reachedTarget || restoreAttempts >= MAX_RESTORE_ATTEMPTS) {
        restoreCompleted = true;
        clearScheduledRestore();
        return;
      }

      clearScheduledRestore();
      restoreTimer = window.setTimeout(
        restoreScrollPosition,
        RESTORE_RETRY_DELAYS[restoreAttempts] ??
          RESTORE_RETRY_DELAYS[RESTORE_RETRY_DELAYS.length - 1],
      );
    }

    function scheduleInitialScrollRestore() {
      if (!shouldRestoreScroll || hasUserInteracted || restoreCompleted) {
        return;
      }

      clearScheduledRestore();
      restoreTimer = window.setTimeout(
        restoreScrollPosition,
        RESTORE_RETRY_DELAYS[0],
      );
    }

    function saveContainerPosition(container) {
      const pos = {
        left: container.style.left,
        top: container.style.top,
        right: container.style.right,
        transform: container.style.transform,
      };
      localStorage.setItem(STORAGE_KEY_CONTAINER, JSON.stringify(pos));
    }

    function restoreContainerPosition(container) {
      const savedPos = localStorage.getItem(STORAGE_KEY_CONTAINER);
      if (savedPos !== null) {
        try {
          const pos = JSON.parse(savedPos);
          if (pos.left) container.style.left = pos.left;
          if (pos.top) container.style.top = pos.top;
          if (pos.right) container.style.right = pos.right;
          if (pos.transform) container.style.transform = pos.transform;
        } catch (error) {
          // ignore parsing errors
        }
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleInitialScrollRestore);
      window.addEventListener("load", scheduleInitialScrollRestore);
    } else if (document.readyState === "interactive") {
      scheduleInitialScrollRestore();
      window.addEventListener("load", scheduleInitialScrollRestore);
    } else {
      scheduleInitialScrollRestore();
    }

    let scrollTimeout;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(saveScrollPosition, 300);
      },
      { passive: true },
    );

    window.addEventListener("wheel", cancelScrollRestore, {
      passive: true,
      once: true,
    });
    window.addEventListener("mousedown", cancelScrollRestore, { once: true });
    window.addEventListener("touchstart", cancelScrollRestore, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", cancelScrollRestore, { once: true });
    window.addEventListener("beforeunload", () => {
      clearScheduledRestore();
      saveScrollPosition();
    });

    const colors = getStoredColors();
    const container = document.createElement("div");
    container.id = "scroll-buttons-container";
    container.style.cssText = `
      position: fixed;
      right: 20px;
      top: 20px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      touch-action: none;
      cursor: grab;
    `;

    const buttons = [];

    function createButton(label, onClick) {
      const button = document.createElement("button");
      button.innerHTML = label;
      button.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: ${colors.bgColor};
        color: ${colors.textColor};
        border: none;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        pointer-events: auto;
      `;

      button.addEventListener("click", (event) => {
        if (!isDragging && !dragMoved) {
          onClick();
        } else {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      });

      button.addEventListener("mouseenter", () => {
        if (!isDragging && !dragMoved) {
          button.style.transform = "scale(1.1)";
          button.style.opacity = "0.9";
        }
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.opacity = "1";
      });

      buttons.push(button);
      return button;
    }

    const upButton = createButton("&#9650;", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const downButton = createButton("&#9660;", () => {
      window.scrollTo({ top: getMaxScrollHeight(), behavior: "smooth" });
    });

    container.appendChild(upButton);
    container.appendChild(downButton);

    if (document.body) {
      document.body.appendChild(container);
    } else {
      const bodyWait = setInterval(() => {
        if (document.body) {
          clearInterval(bodyWait);
          document.body.appendChild(container);
        }
      }, 100);
    }

    restoreContainerPosition(container);

    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragStartX = 0;
    let dragStartY = 0;

    function startDrag(event) {
      if (event.button !== 0) return;

      const rect = container.getBoundingClientRect();
      if (container.style.transform) {
        container.style.transform = "none";
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.top}px`;
        container.style.right = "auto";
      }

      isDragging = true;
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      container.style.cursor = "grabbing";
      event.preventDefault();
    }

    function drag(event) {
      if (!isDragging) return;

      const deltaX = Math.abs(event.clientX - dragStartX);
      const deltaY = Math.abs(event.clientY - dragStartY);
      if (deltaX > 5 || deltaY > 5) {
        dragMoved = true;
      }

      container.style.left = `${event.clientX - dragOffsetX}px`;
      container.style.top = `${event.clientY - dragOffsetY}px`;
    }

    function stopDrag() {
      if (!isDragging) return;

      isDragging = false;
      container.style.cursor = "grab";
      saveContainerPosition(container);
    }

    container.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("mouseleave", stopDrag);

    function updateVisibility() {
      const shouldShow = window.scrollY > 100;
      container.style.display = shouldShow ? "flex" : "none";
      container.style.opacity = shouldShow ? "1" : "0";
      container.style.pointerEvents = shouldShow ? "auto" : "none";
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "updateColors") {
        buttons.forEach((button) => {
          button.style.background = request.bgColor;
          button.style.color = request.textColor;
        });
        saveColors(request.bgColor, request.textColor);
        sendResponse({ success: true });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollButtons);
  } else {
    initScrollButtons();
  }
}
