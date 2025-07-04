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
  
  // Drag and Drop functionality
  const dragDropArea = document.getElementById('dragDropArea');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileDetails = document.getElementById('fileDetails');
  const filePreview = document.getElementById('filePreview');

  dragDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragDropArea.classList.add('drag-over');
  });

  dragDropArea.addEventListener('dragleave', () => {
    dragDropArea.classList.remove('drag-over');
  });

  dragDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDropArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  document.getElementById('browseBtn').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
  });

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Please select a valid image file.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      filePreview.innerHTML = `<img src="${event.target.result}" alt="Image preview">`;
      fileDetails.innerHTML = `<div class="file-name">${file.name}</div><div class="file-size">${(file.size / 1024).toFixed(2)} KB</div>`;
      fileInfo.style.display = 'flex';
      generateBtn.disabled = false; // Enable the generate button
    };
    reader.readAsDataURL(file);
  }

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
    try {
      // Get the uploaded image
      const imageFile = fileInput.files[0];
      if (!imageFile) {
        showNotification('Please select an image first.', true);
        return;
      }

      // Show loading state
      generateBtn.innerHTML = '<div class="loading-spinner"></div>Generating...';
      generateBtn.disabled = true;

      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target.result;
        
        // Get current settings
        const tone = document.getElementById('quickTone').value;
        const language = document.getElementById('quickLanguage').value;
        const keyword = enableKeyword.checked ? keywordInput.value.trim() : null;
        
        // Generate caption
        const caption = await generateCaptionFromFile(imageDataUrl, {
          tone,
          language,
          useKeyword: enableKeyword.checked,
          keyword
        });
        
        // Display result
        document.getElementById('captionText').textContent = caption;
        document.getElementById('captionResult').style.display = 'block';
        
        // Show regenerate button if keyword feature is enabled
        if (enableKeyword.checked) {
          regenerateBtn.style.display = '';
        }
        
        // Save to history
        chrome.runtime.sendMessage({
          action: 'saveCaption',
          data: {
            imageUrl: imageDataUrl,
            caption: caption,
            tone: tone,
            language: language,
            pageUrl: 'Extension Upload',
            timestamp: Date.now()
          }
        });
        
        updateStats();
      };
      reader.readAsDataURL(imageFile);
      
    } catch (error) {
      console.error('Error generating caption:', error);
      showNotification('Error generating caption: ' + error.message, true);
    } finally {
      generateBtn.innerHTML = 'Generate Caption';
      generateBtn.disabled = false;
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
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'generateCaption',
        useKeyword: true,
        keyword: keyword
      });
    });
  });
  
  // Result area copy and share handlers
  document.getElementById('copyResultBtn').addEventListener('click', function() {
    const caption = document.getElementById('captionText').textContent;
    navigator.clipboard.writeText(caption).then(() => {
      showNotification('Caption copied to clipboard!');
    }).catch(() => {
      showNotification('Failed to copy caption', true);
    });
  });
  
  document.getElementById('shareResultBtn').addEventListener('click', function() {
    const caption = document.getElementById('captionText').textContent;
    if (navigator.share) {
      navigator.share({
        title: 'AI Generated Caption',
        text: caption
      });
    } else {
      navigator.clipboard.writeText(caption).then(() => {
        showNotification('Caption copied to clipboard for sharing!');
      });
    }
  });
}

// Generate caption from uploaded file
async function generateCaptionFromFile(imageDataUrl, settings) {
  try {
    // Get API settings
    const apiSettings = await chrome.storage.sync.get({
      apiKey: '',
      provider: 'huggingface',
      customEndpoint: ''
    });
    
    // Use the same caption generation logic as content script
    return await generateCaption(imageDataUrl, settings, apiSettings);
  } catch (error) {
    console.error('Error generating caption from file:', error);
    throw error;
  }
}

// Generate caption using AI service (same as content script)
async function generateCaption(imageUrl, settings, apiSettings) {
  const provider = apiSettings.provider || 'huggingface';
  
  switch (provider) {
    case 'huggingface':
      return await generateHuggingFaceCaption(imageUrl, settings, apiSettings);
    case 'openrouter':
      return await generateOpenRouterCaption(imageUrl, settings, apiSettings);
    case 'google':
      return await generateGoogleCaption(imageUrl, settings, apiSettings);
    case 'custom':
      return await generateCustomCaption(imageUrl, settings, apiSettings);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Generate caption using Hugging Face API (simplified version)
async function generateHuggingFaceCaption(imageDataUrl, settings, apiSettings) {
  const models = [
    'Salesforce/blip-image-captioning-base',
    'Salesforce/blip-image-captioning-large'
  ];
  
  // Convert data URL to blob
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  
  for (const modelName of models) {
    try {
      const formData = new FormData();
      formData.append('file', blob);
      
      const headers = {};
      if (apiSettings.apiKey) {
        headers['Authorization'] = `Bearer ${apiSettings.apiKey}`;
      }
      
      const apiResponse = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      if (!apiResponse.ok) {
        continue; // Try next model
      }
      
      const data = await apiResponse.json();
      let caption;
      
      if (Array.isArray(data) && data.length > 0) {
        caption = data[0]?.generated_text || data[0]?.label || data[0];
      } else if (data.generated_text) {
        caption = data.generated_text;
      } else {
        continue; // Try next model
      }
      
      if (typeof caption === 'string' && caption.trim()) {
        return applyToneToCaption(caption.trim(), settings.tone);
      }
    } catch (error) {
      console.warn(`Error with model ${modelName}:`, error);
      continue;
    }
  }
  
  throw new Error('All Hugging Face models failed. Please try again later.');
}

// Generate caption using OpenRouter API (simplified version)
async function generateOpenRouterCaption(imageDataUrl, settings, apiSettings) {
  if (!apiSettings.apiKey) {
    throw new Error('OpenRouter API key is required.');
  }
  
  const model = 'mistralai/mistral-7b-instruct:free';
  const prompt = generatePrompt(settings.tone, settings.language, settings.keyword);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiSettings.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai-caption-extension.com',
      'X-Title': 'AI Caption Generator Extension'
    },
    body: JSON.stringify({
      model: model,
      messages: [{
        role: 'user',
        content: [{
          type: 'text',
          text: prompt
        }, {
          type: 'image_url',
          image_url: {
            url: imageDataUrl,
            detail: 'auto'
          }
        }]
      }],
      max_tokens: 300,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }
  
  const data = await response.json();
  const caption = data.choices?.[0]?.message?.content;
  
  if (!caption) {
    throw new Error('No response from OpenRouter API');
  }
  
  return applyToneToCaption(caption.trim(), settings.tone);
}

// Placeholder for other providers
async function generateGoogleCaption(imageDataUrl, settings, apiSettings) {
  throw new Error('Google Vision API not implemented yet.');
}

async function generateCustomCaption(imageDataUrl, settings, apiSettings) {
  throw new Error('Custom API not implemented yet.');
}

// Apply tone modifications to caption
function applyToneToCaption(caption, tone) {
  if (!tone || tone === 'descriptive') return caption;
  
  switch (tone) {
    case 'funny':
      return caption + ' 😄';
    case 'professional':
      return caption.charAt(0).toUpperCase() + caption.slice(1) + '.';
    case 'seo':
      return caption + ' #photography #image';
    default:
      return caption;
  }
}

// Generate prompt based on settings
function generatePrompt(tone, language, keyword) {
  let basePrompt = 'Generate a caption for this image';
  
  if (tone) {
    switch (tone) {
      case 'funny':
        basePrompt += ' with a humorous and witty tone';
        break;
      case 'professional':
        basePrompt += ' with a professional and formal tone';
        break;
      case 'descriptive':
        basePrompt += ' with detailed and descriptive language';
        break;
      case 'seo':
        basePrompt += ' optimized for SEO with relevant keywords';
        break;
    }
  }
  
  if (language && language !== 'en') {
    basePrompt += ` in ${language}`;
  }
  
  if (keyword) {
    basePrompt += `. Use the keyword: "${keyword}" in the caption`;
  }
  
  basePrompt += '. Keep it concise but meaningful.';
  
  return basePrompt;
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
  try {
    const history = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getHistory' }, (response) => {
        resolve(response || []);
      });
    });
    
    displayHistory(history);
    updateStats();
  } catch (error) {
    console.error('Error loading history:', error);
    displayHistory([]);
  }
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
        <span>Source: ${item.pageUrl && item.pageUrl !== 'Extension Upload' ? (item.pageUrl.startsWith('http') ? new URL(item.pageUrl).hostname : item.pageUrl) : 'Extension Upload'}</span>
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
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'clearHistory' }, (response) => {
          resolve(response);
        });
      });
      
      if (response.success) {
        loadHistory();
        updateStats();
        showNotification('History cleared successfully!');
      } else {
        showNotification('Failed to clear history: ' + response.error, true);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      showNotification('Failed to clear history', true);
    }
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
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'exportHistory', format }, (response) => {
        resolve(response);
      });
    });
    
    if (response.success) {
      downloadFile(response.data, response.filename, format === 'csv' ? 'text/csv' : 'application/json');
      hideExportModal();
      showNotification(`History exported as ${format.toUpperCase()}!`);
    } else {
      showNotification('Export failed: ' + response.error, true);
    }
  } catch (error) {
    console.error('Error exporting history:', error);
    showNotification('Export failed', true);
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
  try {
    const history = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getHistory' }, (response) => {
        resolve(response || []);
      });
    });
    
    const today = new Date().toDateString();
    const todayCount = history.filter(item => 
      new Date(item.timestamp).toDateString() === today
    ).length;
    
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('totalCount').textContent = history.length;
  } catch (error) {
    console.error('Error updating stats:', error);
    document.getElementById('todayCount').textContent = '0';
    document.getElementById('totalCount').textContent = '0';
  }
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