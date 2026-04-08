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

  function saveScrollPosition() {
    const scrollPos = window.scrollY || window.pageYOffset;
    localStorage.setItem(STORAGE_KEY_SCROLL, scrollPos.toString());
  }

  function restoreScrollPosition() {
    const savedPos = localStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedPos !== null) {
      const targetPos = parseInt(savedPos, 10);
      // Try multiple times to ensure scroll happens after page fully loads
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

// Create up button
const upButton = document.createElement("button");
upButton.innerHTML = "▲";
upButton.style.cssText = `
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
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
upButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
upButton.addEventListener("mouseenter", () => {
  upButton.style.transform = "scale(1.1)";
  upButton.style.opacity = "0.9";
});
upButton.addEventListener("mouseleave", () => {
  upButton.style.transform = "scale(1)";
  upButton.style.opacity = "1";
});

// Create down button
const downButton = document.createElement("button");
downButton.innerHTML = "▼";
downButton.style.cssText = `
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
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
downButton.addEventListener("click", () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});
downButton.addEventListener("mouseenter", () => {
  downButton.style.transform = "scale(1.1)";
  downButton.style.opacity = "0.9";
});
downButton.addEventListener("mouseleave", () => {
  downButton.style.transform = "scale(1)";
  downButton.style.opacity = "1";
});

// Append buttons to container
container.appendChild(upButton);
container.appendChild(downButton);

// Append container to body
document.body.appendChild(container);

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
}
