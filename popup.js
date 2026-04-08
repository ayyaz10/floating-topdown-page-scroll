const STORAGE_KEY_COLORS = 'button_colors';
const STORAGE_KEY_OPACITY = 'button_opacity';

const bgColorInput = document.getElementById('bgColor');
const textColorInput = document.getElementById('textColor');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const resetBtn = document.getElementById('resetBtn');
const closeBtn = document.getElementById('closeBtn');
const paletteSwatches = document.querySelectorAll('.palette-swatch');

function hexToRgba(hex, alpha) {
  const trimmed = hex.replace('#', '');
  const r = parseInt(trimmed.substring(0, 2), 16);
  const g = parseInt(trimmed.substring(2, 4), 16);
  const b = parseInt(trimmed.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

function parseRgbaAlpha(rgba) {
  const match = rgba.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d*\.?\d+)\s*\)/);
  return match ? Math.round(parseFloat(match[1]) * 100) : null;
}

function loadSettings() {
  const stored = localStorage.getItem(STORAGE_KEY_COLORS);
  const storedOpacity = localStorage.getItem(STORAGE_KEY_OPACITY);
  
  if (stored) {
    try {
      const colors = JSON.parse(stored);
      const bgColor = colors.bgColor;
      if (bgColor.startsWith('rgba(')) {
        bgColorInput.value = '#000000';
        const opacity = parseRgbaAlpha(bgColor);
        if (opacity !== null) {
          opacityInput.value = opacity;
          opacityValue.textContent = opacity + '%';
        }
      } else {
        bgColorInput.value = bgColor;
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
  const bgRgba = hexToRgba(bgColor, parseInt(opacity, 10));
  localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify({ bgColor: bgRgba, textColor }));
  localStorage.setItem(STORAGE_KEY_OPACITY, opacity.toString());

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateColors',
        bgColor: bgRgba,
        textColor: textColor
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

paletteSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    const bg = swatch.getAttribute('data-bg');
    const text = swatch.getAttribute('data-text');
    const opacity = swatch.getAttribute('data-opacity');

    bgColorInput.value = bg;
    textColorInput.value = text;
    opacityInput.value = opacity;
    opacityValue.textContent = opacity + '%';
    saveSettings(bg, text, opacity);
  });
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

loadSettings();
