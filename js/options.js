// Options page functionality
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
  document.getElementById('saveSettings').addEventListener('click', saveAllSettings);
  document.getElementById('resetSettings').addEventListener('click', resetAllSettings);
  document.getElementById('testConnection').addEventListener('click', testApiConnection);
  document.getElementById('exportSettings').addEventListener('click', exportSettings);
  document.getElementById('importSettings').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importSettings);
  document.getElementById('enableKeyword').addEventListener('change', function() {
    document.getElementById('keywordGroup').style.display = this.checked ? '' : 'none';
  });
}

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get({
      // AI Configuration
      provider: 'huggingface',
      apiKey: '',
      customEndpoint: '',
      modelName: '',
      
      // Default Preferences
      tone: 'descriptive',
      language: 'en',
      maxTokens: 300,
      
      // Performance & Features
      useOnDevice: false,
      enableCache: true,
      autoShare: false,
      
      // Privacy & Data
      saveHistory: true,
      anonymousAnalytics: false,
      gdprCompliance: false,
      
      // Export & Backup
      exportFormat: 'csv',
      backupFrequency: 'never',
      
      // Keywords
      enableKeyword: false,
      keyword: ''
    });
    
    // Populate form fields
    populateFormFields(settings);
    
  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
}

// Populate form fields with settings data
function populateFormFields(settings) {
  // AI Configuration
  document.getElementById('aiProvider').value = settings.provider;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('customEndpoint').value = settings.customEndpoint;
  document.getElementById('modelName').value = settings.modelName;
  
  // Default Preferences
  document.getElementById('defaultTone').value = settings.tone;
  document.getElementById('defaultLanguage').value = settings.language;
  document.getElementById('maxTokens').value = settings.maxTokens;
  
  // Performance & Features
  document.getElementById('useOnDevice').checked = settings.useOnDevice;
  document.getElementById('enableCache').checked = settings.enableCache;
  document.getElementById('autoShare').checked = settings.autoShare;
  
  // Privacy & Data
  document.getElementById('saveHistory').checked = settings.saveHistory;
  document.getElementById('anonymousAnalytics').checked = settings.anonymousAnalytics;
  document.getElementById('gdprCompliance').checked = settings.gdprCompliance;
  
  // Export & Backup
  document.getElementById('exportFormat').value = settings.exportFormat;
  document.getElementById('backupFrequency').value = settings.backupFrequency;
  
  // Keywords
  document.getElementById('enableKeyword').checked = settings.enableKeyword;
  document.getElementById('keywordGroup').style.display = settings.enableKeyword ? '' : 'none';
  document.getElementById('keywordInput').value = settings.keyword;
}

// Save all settings
async function saveAllSettings() {
  try {
    const settings = {
      // AI Configuration
      provider: document.getElementById('aiProvider').value,
      apiKey: document.getElementById('apiKey').value,
      customEndpoint: document.getElementById('customEndpoint').value,
      modelName: document.getElementById('modelName').value,
      
      // Default Preferences
      tone: document.getElementById('defaultTone').value,
      language: document.getElementById('defaultLanguage').value,
      maxTokens: parseInt(document.getElementById('maxTokens').value),
      
      // Performance & Features
      useOnDevice: document.getElementById('useOnDevice').checked,
      enableCache: document.getElementById('enableCache').checked,
      autoShare: document.getElementById('autoShare').checked,
      
      // Privacy & Data
      saveHistory: document.getElementById('saveHistory').checked,
      anonymousAnalytics: document.getElementById('anonymousAnalytics').checked,
      gdprCompliance: document.getElementById('gdprCompliance').checked,
      
      // Export & Backup
      exportFormat: document.getElementById('exportFormat').value,
      backupFrequency: document.getElementById('backupFrequency').value,
      
      // Keywords
      enableKeyword: document.getElementById('enableKeyword').checked,
      keyword: document.getElementById('keywordInput').value
    };
    
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!', 'success');
    
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// Reset all settings to defaults
async function resetAllSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    return;
  }
  
  try {
    const defaults = {
      provider: 'openrouter',
      apiKey: '',
      customEndpoint: '',
      modelName: '',
      tone: 'descriptive',
      language: 'en',
      maxTokens: 300,
      useOnDevice: false,
      enableCache: true,
      autoShare: false,
      saveHistory: true,
      anonymousAnalytics: false,
      gdprCompliance: false,
      exportFormat: 'csv',
      backupFrequency: 'never',
      enableKeyword: false,
      keyword: ''
    };
    
    await chrome.storage.sync.set(defaults);
    populateFormFields(defaults);
    showStatus('Settings reset to defaults!', 'success');
    
  } catch (error) {
    showStatus('Error resetting settings: ' + error.message, 'error');
  }
}

// Test API connection
async function testApiConnection() {
  const testBtn = document.getElementById('testConnection');
  const originalText = testBtn.textContent;
  
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;
  
  try {
    const provider = document.getElementById('aiProvider').value;
    const apiKey = document.getElementById('apiKey').value;
    const customEndpoint = document.getElementById('customEndpoint').value;
    const modelName = document.getElementById('modelName').value;
    
    if (!apiKey && provider !== 'custom') {
      throw new Error('API key is required');
    }
    
    // Test with a simple text-only request
    const endpoint = provider === 'custom' ? customEndpoint : getEndpointForProvider(provider);
    const response = await testApiEndpoint(endpoint, apiKey, modelName, provider);
    
    if (response.success) {
      showStatus('API connection successful!', 'success');
    } else {
      throw new Error(response.error || 'Connection failed');
    }
    
  } catch (error) {
    showStatus('API test failed: ' + error.message, 'error');
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

// Get endpoint for provider
function getEndpointForProvider(provider) {
  switch (provider) {
    case 'huggingface':
      return 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'google':
      return 'https://vision.googleapis.com/v1/images:annotate';
    default:
      return null;
  }
}

// Test API endpoint
async function testApiEndpoint(endpoint, apiKey, modelName, provider) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    let testData = {};
    
    // Configure request based on provider
    if (provider === 'huggingface') {
      headers['Authorization'] = `Bearer ${apiKey}`;
      testData = { inputs: 'test' }; // Simple test input
    } else if (provider === 'openrouter') {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'https://ai-caption-extension.com';
      headers['X-Title'] = 'AI Caption Generator Extension';
      // Simple test message
      testData = {
        model: modelName || 'qwen/qwen-2-vl-7b-instruct:free',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      };
    } else if (provider === 'google') {
      headers['Authorization'] = `Bearer ${apiKey}`;
      testData = {
        requests: [{
          image: { content: '' },
          features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
        }]
      };
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(testData)
    });
    
    if (response.status === 401) {
      return { success: false, error: 'Invalid API key or expired token' };
    } else if (response.status === 402) {
      return { success: false, error: 'Insufficient credits (OpenRouter)' };
    } else if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded - please wait and try again' };
    } else if (response.status === 404) {
      if (provider === 'openrouter') {
        return { success: false, error: 'Model not found - check model name in settings' };
      }
      return { success: false, error: 'API endpoint not found' };
    } else if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    // If we get here, the API key is valid and the endpoint is reachable
    return { success: true };
    
  } catch (error) {
    return { success: false, error: `Connection failed: ${error.message}` };
  }
}

// Export settings
function exportSettings() {
  chrome.storage.sync.get(null, (settings) => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-caption-generator-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showStatus('Settings exported successfully!', 'success');
  });
}

// Import settings
function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const settings = JSON.parse(e.target.result);
      
      // Validate settings object
      if (typeof settings !== 'object' || settings === null) {
        throw new Error('Invalid settings file format');
      }
      
      await chrome.storage.sync.set(settings);
      populateFormFields(settings);
      showStatus('Settings imported successfully!', 'success');
      
    } catch (error) {
      showStatus('Error importing settings: ' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
  event.target.value = ''; // Reset file input
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}