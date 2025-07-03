// Popup functionality for AI Image Caption Generator
document.addEventListener('DOMContentLoaded', function() {
  initializePopup();
  loadSettings();
  loadHistory();
  updateStats();
});

// Initialize popup interface
function initializePopup() {
  // Tab navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Remove active class from all tabs
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // Load content based on tab
      if (tabId === 'history') {
        loadHistory();
      }
    });
  });
  
  // Settings form handlers
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  
  // History handlers
  document.getElementById('exportBtn').addEventListener('click', showExportModal);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
  document.getElementById('historySearch').addEventListener('input', filterHistory);
  
  // Quick settings handlers
  document.getElementById('quickTone').addEventListener('change', updateQuickSettings);
  document.getElementById('quickLanguage').addEventListener('change', updateQuickSettings);
  
  // Export modal handlers
  document.querySelector('.modal-close').addEventListener('click', hideExportModal);
  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', exportHistory);
  });
  
  // Keyword feature logic
  const enableKeyword = document.getElementById('enableKeywordPopup');
  const keywordGroup = document.getElementById('keywordGroupPopup');
  const keywordInput = document.getElementById('keywordInputPopup');
  const generateBtn = document.getElementById('generateCaptionBtn');
  const regenerateBtn = document.getElementById('regenerateWithKeywordBtn');

  enableKeyword.addEventListener('change', function() {
    keywordGroup.style.display = this.checked ? '' : 'none';
    regenerateBtn.style.display = this.checked ? '' : 'none';
  });

  // When user clicks Generate Caption (initial, without keyword)
  generateBtn.addEventListener('click', async function() {
    // ...existing logic to generate caption...
    // After caption is generated, if keyword feature is enabled, show regenerate button
    if (enableKeyword.checked) {
      regenerateBtn.style.display = '';
    }
  });

  // When user clicks Regenerate with Keyword
  regenerateBtn.addEventListener('click', async function() {
    const keyword = keywordInput.value.trim();
    if (!keyword) {
      showNotification('Please enter a keyword to use.');
      return;
    }
    // Send message to content script to regenerate caption with keyword
    // (You may need to implement this message handler in content.js)
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'generateCaption',
        useKeyword: true,
        keyword: keyword
      });
    });
  });
}

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    tone: 'descriptive',
    language: 'en',
    apiKey: '',
    provider: 'huggingface',
    customEndpoint: '',
    useOnDevice: false,
    saveHistory: true,
    anonymousAnalytics: false
  });
  
  // Populate form fields
  document.getElementById('quickTone').value = settings.tone;
  document.getElementById('quickLanguage').value = settings.language;
  document.getElementById('defaultTone').value = settings.tone;
  document.getElementById('defaultLanguage').value = settings.language;
  document.getElementById('aiProvider').value = settings.provider;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('customEndpoint').value = settings.customEndpoint;
  document.getElementById('useOnDevice').checked = settings.useOnDevice;
  document.getElementById('saveHistory').checked = settings.saveHistory;
  document.getElementById('anonymousAnalytics').checked = settings.anonymousAnalytics;
}

// Save settings to storage
async function saveSettings() {
  const settings = {
    tone: document.getElementById('defaultTone').value,
    language: document.getElementById('defaultLanguage').value,
    apiKey: document.getElementById('apiKey').value,
    provider: document.getElementById('aiProvider').value,
    customEndpoint: document.getElementById('customEndpoint').value,
    useOnDevice: document.getElementById('useOnDevice').checked,
    saveHistory: document.getElementById('saveHistory').checked,
    anonymousAnalytics: document.getElementById('anonymousAnalytics').checked
  };
  
  await chrome.storage.sync.set(settings);
  showNotification('Settings saved successfully!');
}

// Reset settings to defaults
async function resetSettings() {
  const defaults = {
    tone: 'descriptive',
    language: 'en',
    apiKey: '',
    provider: 'openrouter',
    customEndpoint: '',
    useOnDevice: false,
    saveHistory: true,
    anonymousAnalytics: false
  };
  
  await chrome.storage.sync.set(defaults);
  loadSettings();
  showNotification('Settings reset to defaults!');
}

// Update quick settings
async function updateQuickSettings() {
  const tone = document.getElementById('quickTone').value;
  const language = document.getElementById('quickLanguage').value;
  
  await chrome.storage.sync.set({ tone, language });
}

// Load and display history
async function loadHistory() {
  const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
  const history = response || [];
  
  displayHistory(history);
}

// Display history items
function displayHistory(history) {
  const historyList = document.getElementById('historyList');
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-state"><p>No captions generated yet. Right-click on any image to get started!</p></div>';
    return;
  }
  
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-item-header">
        <span class="history-date">${new Date(item.timestamp).toLocaleDateString()}</span>
        <div class="history-actions-item">
          <button class="btn-small btn-secondary" onclick="copyCaption('${item.caption.replace(/'/g, "\\'")}')">Copy</button>
          <button class="btn-small btn-primary" onclick="shareCaption('${item.caption.replace(/'/g, "\\'")}')">Share</button>
        </div>
      </div>
      <div class="history-caption">${item.caption}</div>
      <div class="history-meta">
        <span>Tone: ${item.tone}</span>
        <span>Language: ${item.language}</span>
        <span>Source: ${item.pageUrl ? new URL(item.pageUrl).hostname : 'Unknown'}</span>
      </div>
    </div>
  `).join('');
}

// Filter history based on search
function filterHistory() {
  const searchTerm = document.getElementById('historySearch').value.toLowerCase();
  const historyItems = document.querySelectorAll('.history-item');
  
  historyItems.forEach(item => {
    const caption = item.querySelector('.history-caption').textContent.toLowerCase();
    const isVisible = caption.includes(searchTerm);
    item.style.display = isVisible ? 'block' : 'none';
  });
}

// Clear history
async function clearHistory() {
  if (confirm('Are you sure you want to clear all caption history?')) {
    await chrome.runtime.sendMessage({ action: 'clearHistory' });
    loadHistory();
    updateStats();
    showNotification('History cleared successfully!');
  }
}

// Show export modal
function showExportModal() {
  document.getElementById('exportModal').classList.add('active');
}

// Hide export modal
function hideExportModal() {
  document.getElementById('exportModal').classList.remove('active');
}

// Export history
async function exportHistory(event) {
  const format = event.target.getAttribute('data-format');
  const response = await chrome.runtime.sendMessage({ action: 'exportHistory', format });
  
  if (response.success) {
    downloadFile(response.data, response.filename, format === 'csv' ? 'text/csv' : 'application/json');
    hideExportModal();
    showNotification(`History exported as ${format.toUpperCase()}!`);
  } else {
    showNotification('Export failed: ' + response.error, true);
  }
}

// Download file helper
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Update usage statistics
async function updateStats() {
  const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
  const history = response || [];
  
  const today = new Date().toDateString();
  const todayCount = history.filter(item => 
    new Date(item.timestamp).toDateString() === today
  ).length;
  
  document.getElementById('todayCount').textContent = todayCount;
  document.getElementById('totalCount').textContent = history.length;
}

// Copy caption to clipboard (global function for history items)
window.copyCaption = function(caption) {
  navigator.clipboard.writeText(caption).then(() => {
    showNotification('Caption copied to clipboard!');
  }).catch(() => {
    showNotification('Failed to copy caption', true);
  });
};

// Share caption (global function for history items)
window.shareCaption = function(caption) {
  if (navigator.share) {
    navigator.share({
      title: 'AI Generated Caption',
      text: caption
    });
  } else {
    // Fallback to copy
    navigator.clipboard.writeText(caption).then(() => {
      showNotification('Caption copied to clipboard for sharing!');
    });
  }
};

// Show notification
function showNotification(message, isError = false) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${isError ? '#ef4444' : '#10b981'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 10001;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}