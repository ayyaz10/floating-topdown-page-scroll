// Prevent duplicate injection
if (window.__scrollButtonsInjected) {
  // already injected
} else {
  window.__scrollButtonsInjected = true;

  function initScrollButtons() {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll position persistence
    const STORAGE_KEY_SCROLL = `scroll_pos_${location.pathname}`;
    const STORAGE_KEY_CONTAINER = `container_pos_${location.pathname}`;
    const STORAGE_KEY_COLORS = `button_colors`;

    // Default colors
    const DEFAULT_BG_COLOR = 'rgba(0, 0, 0, 0.7)';
    const DEFAULT_TEXT_COLOR = 'white';

    let currentBgColor = DEFAULT_BG_COLOR;
    let currentTextColor = DEFAULT_TEXT_COLOR;
    let isDragging = false;

    function getStoredColors() {
      const stored = localStorage.getItem(STORAGE_KEY_COLORS);
      
      if (stored) {
        try {
          const colors = JSON.parse(stored);
          currentBgColor = colors.bgColor;
          currentTextColor = colors.textColor;
          return colors;
        } catch (e) {
          return { bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR };
        }
      }
      return { bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR };
    }

    function saveColors(bgColor, textColor) {
      currentBgColor = bgColor;
      currentTextColor = textColor;
      localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify({ bgColor, textColor }));
    }

    function saveScrollPosition() {
      const scrollPos = window.scrollY || window.pageYOffset;
      localStorage.setItem(STORAGE_KEY_SCROLL, scrollPos.toString());
    }

    function restoreScrollPosition() {
      const savedPos = localStorage.getItem(STORAGE_KEY_SCROLL);
      if (savedPos !== null) {
        const targetPos = parseInt(savedPos, 10);
        setTimeout(() => {
          window.scrollTo(0, targetPos);
        }, 500);
        setTimeout(() => {
          window.scrollTo(0, targetPos);
        }, 1000);
        setTimeout(() => {
          window.scrollTo(0, targetPos);
        }, 2000);
      }
    }

    function saveContainerPosition(container) {
      const rect = container.getBoundingClientRect();
      const pos = {
        left: container.style.left,
        top: container.style.top,
        right: container.style.right,
        transform: container.style.transform
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
        } catch (e) {
          // ignore parsing errors
        }
      }
    }

    function getMaxScrollHeight() {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
    }

    // Restore position on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', restoreScrollPosition);
      window.addEventListener('load', restoreScrollPosition);
    } else if (document.readyState === 'interactive') {
      restoreScrollPosition();
      window.addEventListener('load', restoreScrollPosition);
    } else {
      restoreScrollPosition();
    }

    // Save position on scroll (debounced)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 300);
    });

    // Also save on page unload
    window.addEventListener('beforeunload', saveScrollPosition);

    // Get stored colors
    const colors = getStoredColors();

    // Create container
    const container = document.createElement("div");
    container.id = "scroll-buttons-container";
    container.style.cssText = `
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: auto;
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
      
      // Prevent click while dragging
      button.addEventListener("click", (e) => {
        if (!isDragging) {
          onClick();
        }
      });
      
      button.addEventListener("mouseenter", () => {
        if (!isDragging) {
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

    // Create up button
    const upButton = createButton("▲", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Create down button
    const downButton = createButton("▼", () => {
      const maxHeight = getMaxScrollHeight();
      window.scrollTo({ top: maxHeight, behavior: "smooth" });
    });

    // Append buttons to container
    container.appendChild(upButton);
    container.appendChild(downButton);

    // Append container to body
    if (document.body) {
      document.body.appendChild(container);
    } else {
      // Wait for body
      const bodyWait = setInterval(() => {
        if (document.body) {
          clearInterval(bodyWait);
          document.body.appendChild(container);
        }
      }, 100);
    }

    // Restore container position
    restoreContainerPosition(container);

    let dragOffsetX = 0;
    let dragOffsetY = 0;

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
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      container.style.cursor = "grabbing";
      event.preventDefault();
    }

    function drag(event) {
      if (!isDragging) return;
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

    // Show/hide based on scroll position
    function updateVisibility() {
      if (window.scrollY > 100) {
        container.style.opacity = "1";
      } else {
        container.style.opacity = "0";
      }
    }

    // Initial check
    updateVisibility();

    // Listen for scroll events
    window.addEventListener("scroll", updateVisibility);

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateColors') {
        buttons.forEach(btn => {
          btn.style.background = request.bgColor;
          btn.style.color = request.textColor;
        });
        saveColors(request.bgColor, request.textColor);
        sendResponse({ success: true });
      }
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollButtons);
  } else {
    initScrollButtons();
  }
}
