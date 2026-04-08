// Prevent duplicate injection
if (window.__scrollButtonsInjected) {
  // already injected
} else {
  window.__scrollButtonsInjected = true;

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

  function getStoredColors() {
    const stored = localStorage.getItem(STORAGE_KEY_COLORS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return { bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR };
      }
    }
    return { bgColor: DEFAULT_BG_COLOR, textColor: DEFAULT_TEXT_COLOR };
  }

  function saveColors(bgColor, textColor) {
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
    button.addEventListener("click", onClick);
    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.1)";
      button.style.opacity = "0.9";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
      button.style.opacity = "1";
    });
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

  // Create settings button
  const settingsButton = createButton("⚙", () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
  });

  // Create settings panel - FIXED TOP-RIGHT
  const settingsPanel = document.createElement("div");
  settingsPanel.id = "scroll-buttons-settings";
  settingsPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(20, 20, 20, 0.98);
    border: 2px solid rgba(100, 100, 100, 0.8);
    border-radius: 12px;
    padding: 20px;
    display: none;
    z-index: 10000;
    min-width: 250px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const panelTitle = document.createElement("div");
  panelTitle.style.cssText = `
    color: white;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 15px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 10px;
  `;
  panelTitle.textContent = "Color Settings";

  const bgColorLabel = document.createElement("label");
  bgColorLabel.style.cssText = `
    display: block;
    color: white;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
  `;
  bgColorLabel.textContent = "Background Color";

  const bgColorInput = document.createElement("input");
  bgColorInput.type = "color";
  bgColorInput.value = colors.bgColor.includes('rgba') ? '#000000' : colors.bgColor;
  bgColorInput.style.cssText = `
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 15px;
  `;

  const textColorLabel = document.createElement("label");
  textColorLabel.style.cssText = `
    display: block;
    color: white;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
  `;
  textColorLabel.textContent = "Arrow Color";

  const textColorInput = document.createElement("input");
  textColorInput.type = "color";
  textColorInput.value = colors.textColor === 'white' ? '#ffffff' : colors.textColor;
  textColorInput.style.cssText = `
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 15px;
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
  `;

  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset";
  resetButton.style.cssText = `
    flex: 1;
    background: rgba(100, 100, 100, 0.8);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
  `;
  resetButton.addEventListener("click", () => {
    bgColorInput.value = '#000000';
    textColorInput.value = '#ffffff';
    updateColors('#000000', '#ffffff');
  });
  resetButton.addEventListener("mouseenter", () => {
    resetButton.style.background = 'rgba(120, 120, 120, 0.9)';
  });
  resetButton.addEventListener("mouseleave", () => {
    resetButton.style.background = 'rgba(100, 100, 100, 0.8)';
  });

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = `
    flex: 1;
    background: rgba(70, 70, 70, 0.8);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
  `;
  closeButton.addEventListener("click", () => {
    settingsPanel.style.display = 'none';
  });
  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.background = 'rgba(90, 90, 90, 0.9)';
  });
  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.background = 'rgba(70, 70, 70, 0.8)';
  });

  function updateColors(bgColor, textColor) {
    const bgRgba = bgColor === '#000000' ? DEFAULT_BG_COLOR : bgColor + 'B3';
    const buttons = [upButton, downButton, settingsButton];
    buttons.forEach(btn => {
      btn.style.background = bgRgba;
      btn.style.color = textColor;
    });
    saveColors(bgRgba, textColor);
  }

  bgColorInput.addEventListener("input", (e) => {
    updateColors(e.target.value, textColorInput.value);
  });

  textColorInput.addEventListener("input", (e) => {
    updateColors(bgColorInput.value, e.target.value);
  });

  buttonContainer.appendChild(resetButton);
  buttonContainer.appendChild(closeButton);

  settingsPanel.appendChild(panelTitle);
  settingsPanel.appendChild(bgColorLabel);
  settingsPanel.appendChild(bgColorInput);
  settingsPanel.appendChild(textColorLabel);
  settingsPanel.appendChild(textColorInput);
  settingsPanel.appendChild(buttonContainer);

  // Append buttons to container
  container.appendChild(upButton);
  container.appendChild(downButton);
  container.appendChild(settingsButton);

  // Append container to body
  document.body.appendChild(container);
  document.body.appendChild(settingsPanel);

  // Restore container position
  restoreContainerPosition(container);

  let isDragging = false;
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

  // Close settings on click outside
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target) && !settingsPanel.contains(e.target)) {
      settingsPanel.style.display = 'none';
    }
  });
}
