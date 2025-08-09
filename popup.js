// Toggle overlay on button click
const toggleBtn = document.getElementById('toggleOverlayBtn');
toggleBtn.addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'toggleOverlay' });
  });
});

// Color options logic
const colorOptions = document.querySelectorAll('.color-option');

// Load and highlight the saved color
chrome.storage.local.get(['pokernowPrimaryColor'], (result) => {
  const savedColor = result.pokernowPrimaryColor || '#4CAF50';
  colorOptions.forEach(option => {
    if (option.dataset.color === savedColor) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
});

colorOptions.forEach(option => {
  option.addEventListener('click', () => {
    const color = option.dataset.color;
    // Save color
    chrome.storage.local.set({ pokernowPrimaryColor: color }, () => {
      // Highlight selected
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      // Send color to content script
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'setPrimaryColor', color });
      });
    });
  });
}); 