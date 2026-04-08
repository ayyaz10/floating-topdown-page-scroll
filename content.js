// Prevent duplicate injection
if (window.__scrollButtonsInjected) {
  // already injected
} else {
  window.__scrollButtonsInjected = true;

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
