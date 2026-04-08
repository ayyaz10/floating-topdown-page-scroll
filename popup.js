const STORAGE_KEY_COLORS = 'button_colors';
const STORAGE_KEY_OPACITY = 'button_opacity';

const bgColorInput = document.getElementById('bgColor');
const textColorInput = document.getElementById('textColor');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const resetBtn = document.getElementById('resetBtn');
const closeBtn = document.getElementById('closeBtn');

function loadSettings() {
  const stored = localStorage.getItem(STORAGE_KEY_COLORS);
  const storedOpacity = localStorage.getItem(STORAGE_KEY_OPACITY);
  
  if (stored) {
    try {
      const colors = JSON.parse(stored);
      if (colors.bgColor.includes('rgba')) {
        bgColorInput.value = '#000000';
      } else {
        bgColorInput.value = colors.bgColor;
      }
      textColorInput.value = colors.textColor === 'white' ? '#ffffff' : colors.textColor;
    } catch (e) {
      console.error('Error loading colors:', e);
    }
  }

  if (storedOpacity) {
    opacityInput.value = storedOpacity;
    opacityValue.textContent = storedOpacity + '%';
  }
}

function saveSettings(bgColor, textColor, opacity) {
  const bgRgba = bgColor === '#000000' ? `rgba(0, 0, 0, ${opacity / 100})` : bgColor + Math.round(opacity * 2.55).toString(16).padStart(2, '0');
  localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify({ bgColor: bgRgba, textColor }));
  localStorage.setItem(STORAGE_KEY_OPACITY, opacity.toString());

  // Send message to content script to update colors
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateColors',
        bgColor: bgRgba,
        textColor: textColor,
        opacity: opacity
      }).catch(() => {
        // Silent fail if content script not available
      });
    }
  });
}

bgColorInput.addEventListener('input', () => {
  saveSettings(bgColorInput.value, textColorInput.value, opacityInput.value);
});

textColorInput.addEventListener('input', () => {
  saveSettings(bgColorInput.value, textColorInput.value, opacityInput.value);
});

opacityInput.addEventListener('input', (e) => {
  opacityValue.textContent = e.target.value + '%';
  saveSettings(bgColorInput.value, textColorInput.value, e.target.value);
});

resetBtn.addEventListener('click', () => {
  bgColorInput.value = '#000000';
  textColorInput.value = '#ffffff';
  opacityInput.value = '70';
  opacityValue.textContent = '70%';
  saveSettings('#000000', '#ffffff', '70');
});

closeBtn.addEventListener('click', () => {
  window.close();
});

// Load settings on popup open
loadSettings();
