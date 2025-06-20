// Background service worker for AI Image Caption Generator
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for images
  chrome.contextMenus.create({
    id: 'generateCaption',
    title: 'Generate AI Caption',
    contexts: ['image']
  });
  
  console.log('AI Image Caption Generator installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generateCaption') {
    try {
      // Check if tab exists and is valid
      if (!tab || !tab.id) {
        console.error('Invalid tab information');
        return;
      }

      // Inject content script if not already present
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content.js']
      });

      // Wait a moment for content script to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send message to content script with image info
      await chrome.tabs.sendMessage(tab.id, {
        action: 'generateCaption',
        imageUrl: info.srcUrl,
        imageAlt: info.alt || '',
        pageUrl: info.pageUrl
      });

    } catch (error) {
      console.error('Error sending message to content script:', error);
      
      // Show notification to user if messaging fails
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Caption Generator',
        message: 'Please refresh the page and try again.'
      });
    }
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'saveCaption':
      saveCaptionToHistory(request.data);
      sendResponse({ success: true });
      break;
      
    case 'getHistory':
      getCaptionHistory().then(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'clearHistory':
      clearCaptionHistory().then(sendResponse);
      return true;
      
    case 'exportHistory':
      exportCaptionHistory(request.format).then(sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Save caption to local storage history
async function saveCaptionToHistory(captionData) {
  try {
    const result = await chrome.storage.local.get(['captionHistory']);
    const history = result.captionHistory || [];
    
    // Add timestamp and limit history to 100 items
    const newEntry = {
      ...captionData,
      timestamp: Date.now(),
      id: generateId()
    };
    
    history.unshift(newEntry);
    if (history.length > 100) {
      history.splice(100);
    }
    
    await chrome.storage.local.set({ captionHistory: history });
  } catch (error) {
    console.error('Error saving caption:', error);
  }
}

// Get caption history
async function getCaptionHistory() {
  try {
    const result = await chrome.storage.local.get(['captionHistory']);
    return result.captionHistory || [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

// Clear caption history
async function clearCaptionHistory() {
  try {
    await chrome.storage.local.remove(['captionHistory']);
    return { success: true };
  } catch (error) {
    console.error('Error clearing history:', error);
    return { success: false, error: error.message };
  }
}

// Export caption history
async function exportCaptionHistory(format) {
  try {
    const history = await getCaptionHistory();
    
    if (format === 'csv') {
      return exportToCSV(history);
    } else if (format === 'json') {
      return exportToJSON(history);
    }
    
    return { success: false, error: 'Unsupported format' };
  } catch (error) {
    console.error('Error exporting history:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function exportToCSV(history) {
  const headers = ['Timestamp', 'Image URL', 'Caption', 'Tone', 'Language', 'Page URL'];
  const csvContent = [
    headers.join(','),
    ...history.map(item => [
      new Date(item.timestamp).toISOString(),
      `"${item.imageUrl || ''}"`,
      `"${item.caption || ''}"`,
      item.tone || '',
      item.language || '',
      `"${item.pageUrl || ''}"`
    ].join(','))
  ].join('\n');
  
  return {
    success: true,
    data: csvContent,
    filename: `image-captions-${new Date().toISOString().split('T')[0]}.csv`
  };
}

function exportToJSON(history) {
  return {
    success: true,
    data: JSON.stringify(history, null, 2),
    filename: `image-captions-${new Date().toISOString().split('T')[0]}.json`
  };
} 