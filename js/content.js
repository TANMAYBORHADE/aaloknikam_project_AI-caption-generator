// Content script for AI Image Caption Generator
(function() {
  // Prevent multiple injections
  if (window.aiCaptionExtensionLoaded) {
    console.log('AI Caption Extension already loaded, skipping...');
    return; // Now this return is legal inside the function
  }
  window.aiCaptionExtensionLoaded = true;

  let captionOverlay = null;
  let currentImage = null;

  // Listen for messages from background script and popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateCaption') {
      console.log('Received generateCaption message:', request);
      
      // Create image data object from request (right-click) or currentImage (popup)
      const imageData = {
        imageUrl: request.imageUrl || currentImage?.imageUrl,
        imageAlt: request.imageAlt || currentImage?.imageAlt || '',
        pageUrl: request.pageUrl || currentImage?.pageUrl || window.location.href,
        useKeyword: request.useKeyword || false,
        keyword: request.keyword || ''
      };
      
      console.log('Processing image data:', imageData);
      
      // Validate that we have an image URL
      if (!imageData.imageUrl) {
        console.error('No image URL provided in request');
        sendResponse({ error: 'No image URL provided' });
        return false;
      }
      
      // Handle the caption generation
      handleImageCaption(imageData);
      sendResponse({ received: true });
      return true;
    }
    
    return false;
  });

  // Handle image captioning request
  async function handleImageCaption(imageData) {
    try {
      currentImage = imageData;
      // Show loading overlay
      showCaptionOverlay('Generating caption...', true);
      
      // Get user settings
      const settings = await getSettings();
      
      // If keyword feature is used, add to settings
      if (imageData.useKeyword && imageData.keyword) {
        settings.useKeyword = true;
        settings.keyword = imageData.keyword;
      }
      
      // Generate caption
      const caption = await generateCaption(imageData.imageUrl, settings);
      
      // Show caption in overlay
      showCaptionOverlay(caption, false);
      
      // Save to history
      saveCaptionToHistory({
        imageUrl: imageData.imageUrl,
        caption: caption,
        tone: settings.tone,
        language: settings.language,
        pageUrl: imageData.pageUrl
      });
      
    } catch (error) {
      console.error('Error generating caption:', error);
      
      // Show specific error message to user
      let errorMessage = 'Error generating caption. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      showCaptionOverlay(errorMessage, false, true);
    }
  }

  // Generate caption using AI service
  async function generateCaption(imageUrl, settings) {
    const apiSettings = await getApiSettings();
    
    if (settings.useOnDevice && window.aiCaptionModel) {
      // Use on-device model if available
      return await generateOnDeviceCaption(imageUrl, settings);
    } else {
      // Use cloud API
      return await generateCloudCaption(imageUrl, settings, apiSettings);
    }
  }

  // Generate caption using cloud API
  async function generateCloudCaption(imageUrl, settings, apiSettings) {
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

  // Generate caption using Custom API
  async function generateCustomCaption(imageUrl, settings, apiSettings) {
    if (!apiSettings.endpoint) {
      throw new Error('Custom API endpoint is required');
    }
    
    const response = await fetch(apiSettings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiSettings.apiKey}`
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: generatePrompt(settings.tone, settings.language, settings.keyword),
        max_tokens: settings.maxTokens || 300
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Custom API request failed');
    }
    
    // Return the caption from the custom API response
    // The exact field depends on the custom API implementation
    return data.caption || data.text || data.result || 'Custom API response format not recognized';
  }

  // Test API token validity
  async function testHuggingFaceToken(apiKey) {
    try {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API token is valid for user:', data.name);
        return true;
      } else {
        console.error('API token test failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error testing API token:', error);
      return false;
    }
  }

  // Generate caption using Hugging Face API
  async function generateHuggingFaceCaption(imageUrl, settings, apiSettings) {
    // List of models to try in order of preference
    const models = [
      'Salesforce/blip-image-captioning-base',
      'Salesforce/blip-image-captioning-large', 
      'microsoft/git-base-coco',
      'nlpconnect/vit-gpt2-image-captioning'
    ];

    console.log('Starting Hugging Face caption generation...');
    console.log('Available API key:', apiSettings.apiKey ? `${apiSettings.apiKey.substring(0, 8)}...` : 'None');
    
    let lastError = null;
    let triedWithoutAuth = false;
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        // Convert image URL to blob for Hugging Face
        console.log('Fetching image from URL:', imageUrl);
        const imageBlob = await fetch(imageUrl).then(r => {
          if (!r.ok) throw new Error(`Failed to fetch image: ${r.status} ${r.statusText}`);
          return r.blob();
        });
        console.log('Image blob size:', imageBlob.size, 'bytes, type:', imageBlob.type);
        
        // Create FormData for Hugging Face API (they prefer binary data)
        const formData = new FormData();
        formData.append('file', imageBlob);
        
        // Try with authentication first, then without if token fails
        const attempts = [];
        if (apiSettings.apiKey) {
          attempts.push({ 
            headers: { 'Authorization': `Bearer ${apiSettings.apiKey}` },
            label: 'with authentication'
          });
        }
        attempts.push({ 
          headers: {},
          label: 'without authentication'
        });

        let response = null;
        let attemptUsed = '';

        for (const attempt of attempts) {
          try {
            console.log(`Making request to ${modelName} ${attempt.label}...`);
            response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
              method: 'POST',
              headers: attempt.headers,
              body: formData
            });
            attemptUsed = attempt.label;
            
            console.log(`Hugging Face response (${attemptUsed}):`, response.status, response.statusText);
            
            // Check if we need to retry this model with a different approach
            if (!response.ok) {
              const errorText = response.status !== 401 ? await response.text() : '';
              
              if (response.status === 401) {
                console.warn(`Authentication failed for ${modelName} (${attemptUsed})`);
                if (attemptUsed === 'with authentication') {
                  console.log('Will try without authentication...');
                  continue; // Try next attempt (without auth) for same model
                } else {
                  lastError = new Error('Authentication failed. Please check your Hugging Face token.');
                  break; // Move to next model
                }
              } else if (response.status === 404) {
                console.warn(`Model ${modelName} not found (${attemptUsed}), trying next model...`);
                lastError = new Error(`Model ${modelName} not found`);
                break; // No point trying without auth for 404, move to next model
              } else if (response.status === 429) {
                console.warn(`Rate limit exceeded for ${modelName} (${attemptUsed}), trying next model...`);
                lastError = new Error(`Rate limit exceeded for ${modelName}`);
                break; // Try next model
              } else if (response.status === 503) {
                console.warn(`Model ${modelName} is loading (${attemptUsed}), trying next model...`);
                lastError = new Error(`Model ${modelName} is loading`);
                break; // Try next model
              } else {
                console.error(`HTTP ${response.status} (${attemptUsed}):`, errorText);
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                break; // Try next model
              }
            } else {
              // Success! Break out of attempts loop and process response
              break;
            }
          } catch (fetchError) {
            console.warn(`Fetch failed for ${modelName} ${attempt.label}:`, fetchError);
            if (attempt === attempts[attempts.length - 1]) {
              throw fetchError; // Last attempt failed
            }
          }
        }
        
        // If we're here and response is not ok, continue to next model
        if (!response.ok) {
          continue;
        }
        
        // Get response text first to handle both success and error cases
        const responseText = await response.text();
        console.log('Hugging Face raw response:', responseText.substring(0, 200) + '...');
        
        // Check if response looks like "Not Found" or other plain text errors
        if (!responseText.trim().startsWith('[') && !responseText.trim().startsWith('{')) {
          console.warn(`Unexpected response format from ${modelName}, trying next model...`);
          lastError = new Error(`Unexpected API response from ${modelName}: ${responseText}`);
          continue; // Try next model
        }
        
        // Try to parse JSON response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.warn(`Invalid JSON from ${modelName}, trying next model...`);
          lastError = new Error(`Invalid JSON response from ${modelName}: ${responseText}`);
          continue; // Try next model
        }
        
        // Handle different response formats from Hugging Face
        let caption;
        if (Array.isArray(data) && data.length > 0) {
          // Standard format: [{"generated_text": "caption"}]
          caption = data[0]?.generated_text || data[0]?.label || data[0];
        } else if (data.generated_text) {
          // Alternative format: {"generated_text": "caption"}
          caption = data.generated_text;
        } else if (typeof data === 'string') {
          // Direct string response
          caption = data;
        } else {
          console.log(`Unexpected HF response format from ${modelName}:`, data);
          lastError = new Error(`Unexpected response format from ${modelName}`);
          continue; // Try next model
        }
        
        // Clean up and validate caption
        if (typeof caption !== 'string' || !caption.trim()) {
          console.warn(`Empty caption from ${modelName}, trying next model...`);
          lastError = new Error(`Empty caption from ${modelName}`);
          continue; // Try next model
        }
        
        // Apply tone modifications
        caption = applyToneToCaption(caption.trim(), settings.tone);
        
        console.log(`Successfully generated caption using ${modelName}:`, caption);
        return caption;
        
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        lastError = error;
        continue; // Try next model
      }
    }
    
    // If we get here, all models failed
    console.error('All Hugging Face models failed. Tried models:', models);
    console.error('Last error:', lastError);
    
    // Create a more helpful error message
    let errorMessage = 'All Hugging Face models are currently unavailable. ';
    if (lastError?.message.includes('not found')) {
      errorMessage += 'This might be a temporary issue with Hugging Face servers. Please try again in a few minutes.';
    } else if (lastError?.message.includes('token')) {
      errorMessage += 'Please check your API token in the extension settings.';
    } else {
      errorMessage += 'Please try again later or check your internet connection.';
    }
    
    throw new Error(errorMessage);
  }

  // Generate caption using Google Vision API (placeholder)
// Generate caption using Google Vision API (label detection)
async function generateGoogleCaption(imageUrl, settings, apiSettings) {
  if (!apiSettings.apiKey) {
    throw new Error('Google Vision API key is required. Please add your token in the extension settings.');
  }

  try {
    // First, try to download image with error handling
    console.log('Attempting to fetch image from URL:', imageUrl);
    
    let response;
    try {
      response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    } catch (fetchError) {
      throw new Error(`Cannot access image URL. This might be due to CORS restrictions or network issues. Try using the popup to upload the image directly instead.`);
    }
    
    if (!response.ok) {
      let errorMessage = '';
      if (response.status === 404) {
        errorMessage = 'Image not found (404). The image may have been moved or deleted.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied (403). The website may be blocking direct image access.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication required (401). This image requires login to access.';
      } else {
        errorMessage = `Failed to fetch image: ${response.status} ${response.statusText}`;
      }
      errorMessage += ' Try uploading the image directly using the extension popup instead.';
      throw new Error(errorMessage);
    }
    
    // Check if response is actually an image
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (!contentType || !contentType.startsWith('image/')) {
      let errorMessage = `The URL returns ${contentType || 'unknown content'} instead of an image.`;
      if (contentType && contentType.includes('text/html')) {
        errorMessage += ' This usually means the image URL is broken or redirected to a webpage.';
      }
      errorMessage += ' Try right-clicking on the actual image and selecting "Copy image address", then use the extension popup to upload it directly.';
      throw new Error(errorMessage);
    }
    
    const imageBlob = await response.blob();
    
    // Validate blob size (Google Vision has limits)
    if (imageBlob.size > 20 * 1024 * 1024) { // 20MB limit
      throw new Error('Image is too large. Google Vision API supports images up to 20MB.');
    }
    
    const base64Image = await blobToBase64(imageBlob);
    
    // Validate that we actually got an image data URL
    if (!base64Image.startsWith('data:image/')) {
      throw new Error(`Invalid image data. Expected image data URL, got: ${base64Image.substring(0, 50)}...`);
    }
    
    // Remove data URL prefix
    const base64Content = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

  // Call Google Vision API
  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiSettings.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Content },
            features: [{ type: 'LABEL_DETECTION', maxResults: 5 }]
          }
        ]
      })
    }
  );

  const data = await visionResponse.json();

  if (!visionResponse.ok || !data.responses || !data.responses[0].labelAnnotations) {
    throw new Error('Google Vision API error: ' + (data.error?.message || 'Unknown error'));
  }

  // Create natural captions from labels
  const labels = data.responses[0].labelAnnotations.map(l => l.description);
  let caption;
  
  // Create more natural caption from detected labels
  caption = createNaturalCaption(labels, settings.tone, settings.useKeyword ? settings.keyword : null);

  return caption;
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
}

  // Create natural captions from Google Vision labels
  function createNaturalCaption(labels, tone, keyword) {
    if (!labels || labels.length === 0) {
      return keyword ? `${keyword}: A serene scene captured.` : 'A serene scene captured.';
    }

    const relevantLabels = labels.slice(0, 5);
    let caption = '';
    const scenery = ['sky', 'cloud', 'sunset', 'sunrise', 'ocean', 'mountain', 'landscape', 'nature'];
    const people = ['person', 'human', 'face', 'smile', 'portrait', 'selfie', 'group'];
    const hasScenery = relevantLabels.some(label => scenery.some(s => label.toLowerCase().includes(s)));
    const hasPeople = relevantLabels.some(label => people.some(p => label.toLowerCase().includes(p)));

    if (hasScenery) {
      switch (tone) {
        case 'professional':
          caption = `An awe-inspiring ${relevantLabels[0].toLowerCase()} paints the sky in relaxing hues, epitomizing tranquility.`;
          break;
        case 'funny':
          caption = `Looks like the ${relevantLabels[0].toLowerCase()} is throwing a flamboyant costume party! 🌄🎉`;
          break;
        case 'seo':
          const hashtags = relevantLabels.map(label => `#${label.toLowerCase().replace(/\s+/g, '')}`).join(' ');
          caption = `Gorgeous view of ${relevantLabels[0].toLowerCase()}, a highlight for photography! ${hashtags}`;
          break;
        default:
          caption = `A breathtaking view of ${relevantLabels[0].toLowerCase()} stretching beyond the horizon.`;
      }
    } else if (hasPeople) {
      switch (tone) {
        case 'professional':
          caption = `A beautifully captured moment showcasing human connection and essence.`;
          break;
        case 'funny':
          caption = `When humans try to outshine the natural beauty! 😄📸`;
          break;
        case 'seo':
          caption = `Unforgettable human expressions captured for posterity. #portrait #memories #humanity`;
          break;
        default:
          caption = `Capturing the charm and magic of human moments.`;
      }
    } else {
      const mainSubject = relevantLabels[0].toLowerCase();
      switch (tone) {
        case 'professional':
          caption = `A refined depiction of ${mainSubject}, showcasing intricate details.`;
          break;
        case 'funny':
          caption = `Who knew ${mainSubject} could be this entertaining! 🎨`;
          break;
        case 'seo':
          const objectHashtags = relevantLabels.map(label => `#${label.toLowerCase().replace(/\s+/g, '')}`).join(' ');
          caption = `Focused depiction of ${mainSubject}, a unique display! ${objectHashtags}`;
          break;
        default:
          caption = `The elegance and allure of ${mainSubject} on display.`;
      }
    }

    return keyword ? `${keyword}: ${caption}` : caption;
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

  // Generate caption using on-device model (placeholder)
  async function generateOnDeviceCaption(imageUrl, settings) {
    // This would integrate with TensorFlow.js or similar
    // For now, return a placeholder
    return `[On-device caption for image in ${settings.tone} tone, ${settings.language} language]`;
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

  // Show caption overlay
  function showCaptionOverlay(text, isLoading = false, isError = false) {
    // Remove existing overlay
    if (captionOverlay) {
      captionOverlay.remove();
    }
    
    // Create overlay
    captionOverlay = document.createElement('div');
    captionOverlay.className = `ai-caption-overlay ${isLoading ? 'loading' : ''} ${isError ? 'error' : ''}`;
    
    captionOverlay.innerHTML = `
      <div class="ai-caption-content">
        <div class="ai-caption-header">
          <span class="ai-caption-title">AI Caption</span>
          <button class="ai-caption-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="ai-caption-text">${isLoading ? '<div class="loading-spinner"></div>' : ''}${text}</div>
        ${!isLoading && !isError ? `
          <div class="ai-caption-actions">
            <button class="ai-caption-btn copy-btn" onclick="copyToClipboard('${text.replace(/'/g, "\\'")}')">Copy</button>
            <button class="ai-caption-btn share-btn" onclick="showShareOptions('${text.replace(/'/g, "\\'")}')">Share</button>
            <button class="ai-caption-btn regenerate-btn" onclick="regenerateCaption()">Regenerate</button>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(captionOverlay);
    
    // Auto-hide after 10 seconds if not loading
    if (!isLoading) {
      setTimeout(() => {
        if (captionOverlay && captionOverlay.parentNode) {
          captionOverlay.remove();
        }
      }, 10000);
    }
  }

  // Copy to clipboard with fallback methods
  window.copyToClipboard = function(text) {
    // Method 1: Modern clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification('Caption copied to clipboard!');
      }).catch(err => {
        console.error('Clipboard API failed:', err);
        // Fallback to legacy method
        fallbackCopyToClipboard(text);
      });
    } else {
      // Fallback for older browsers or when clipboard API is not available
      fallbackCopyToClipboard(text);
    }
  };

  // Fallback copy method using textarea
  function fallbackCopyToClipboard(text) {
    try {
      // Create temporary textarea
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Try to copy using document.execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showNotification('Caption copied to clipboard!');
      } else {
        showNotification('Please manually copy the caption text', true);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      // Last resort: show the text in a prompt for manual copy
      showCopyPrompt(text);
    }
  }

  // Show copy prompt as last resort
  function showCopyPrompt(text) {
    const promptOverlay = document.createElement('div');
    promptOverlay.className = 'ai-caption-copy-prompt';
    promptOverlay.innerHTML = `
      <div class="copy-prompt-content">
        <h3>Copy Caption</h3>
        <p>Please manually copy the caption below:</p>
        <textarea readonly onclick="this.select()">${text}</textarea>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    document.body.appendChild(promptOverlay);
  }

  // Show share options
  window.showShareOptions = function(caption) {
    const shareOverlay = document.createElement('div');
    shareOverlay.className = 'ai-caption-share-overlay';
    shareOverlay.innerHTML = `
      <div class="ai-caption-share-content">
        <h3>Share Caption</h3>
        <div class="share-buttons">
          <button onclick="shareToTwitter('${caption.replace(/'/g, "\\'")}')">Twitter/X</button>
          <button onclick="shareToLinkedIn('${caption.replace(/'/g, "\\'")}')">LinkedIn</button>
          <button onclick="shareToFacebook('${caption.replace(/'/g, "\\'")}')">Facebook</button>
          <button onclick="copyForInstagram('${caption.replace(/'/g, "\\'")}')">Instagram</button>
        </div>
        <button class="close-share" onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    document.body.appendChild(shareOverlay);
  };

  // Social sharing functions
  window.shareToTwitter = function(caption) {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  window.shareToLinkedIn = function(caption) {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  window.shareToFacebook = function(caption) {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  };

  window.copyForInstagram = function(caption) {
    navigator.clipboard.writeText(caption).then(() => {
      showNotification('Caption copied! Paste it in Instagram.');
    });
  };

  // Regenerate caption
  window.regenerateCaption = function() {
    if (currentImage) {
      handleImageCaption(currentImage);
    }
  };

  // Show notification
  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `ai-caption-notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Get user settings
  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        tone: 'descriptive',
        language: 'en',
        model: '',
        useOnDevice: false,
        maxTokens: 300
      }, resolve);
    });
  }

  // Get API settings
  async function getApiSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        apiKey: '',
        endpoint: '',
        provider: 'huggingface'
      }, resolve);
    });
  }

  // Save caption to history
  function saveCaptionToHistory(captionData) {
    chrome.runtime.sendMessage({
      action: 'saveCaption',
      data: captionData
    });
  }

  // Generate caption using OpenRouter API
  async function generateOpenRouterCaption(imageUrl, settings, apiSettings) {
    console.log('Starting OpenRouter caption generation...');
    
    if (!apiSettings.apiKey) {
      throw new Error('OpenRouter API key is required. Please add your token in the extension settings.');
    }

    // Default to best free vision model, but allow custom model selection
   const model = apiSettings.modelName || 'google/gemma-3-27b-it:free';

    
    try {
      // Convert image to base64
      console.log('Converting image to base64...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const imageBlob = await response.blob();
      const base64Image = await blobToBase64(imageBlob);
      
      console.log(`Making request to OpenRouter with model: ${model}`);
      
      // Generate a contextual prompt based on settings (including keyword)
      const prompt = generateOpenRouterPrompt(settings.tone, settings.language, settings.keyword);
      
      const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiSettings.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-caption-extension.com', // Replace with your site
          'X-Title': 'AI Caption Generator Extension'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image,
                    detail: 'auto'
                  }
                }
              ]
            }
          ],
          max_tokens: apiSettings.maxTokens || 300,
          temperature: 0.7,
          n: 1,
          stop: null
        })
      });

      console.log('OpenRouter response status:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('OpenRouter API error:', errorText);
        
        if (apiResponse.status === 401) {
          throw new Error('Invalid OpenRouter API key. Please check your token in settings.');
        } else if (apiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please wait and try again.');
        } else if (apiResponse.status === 402) {
          throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
        } else {
          throw new Error(`OpenRouter API error (${apiResponse.status}): ${errorText}`);
        }
      }

      const data = await apiResponse.json();
      console.log('OpenRouter response:', data);

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      let caption = data.choices[0]?.message?.content;
      if (!caption || typeof caption !== 'string') {
        throw new Error('Invalid response format from OpenRouter API');
      }

      // Clean up the caption and handle multiple options
      caption = caption.trim();
      
      // Enhanced detection for multiple options in any language
      const multipleOptionPatterns = [
        /option\s*\d+/i,
        /\d+\s*[.\)\:]\s*/,
        /\*\*\d+\*\*/,
        /choice\s*\d+/i,
        /caption\s*\d+/i,
        /version\s*\d+/i,
        /opción\s*\d+/i,  // Spanish
        /opção\s*\d+/i,   // Portuguese
        /option\s*\d+/i,  // French
        /variante\s*\d+/i, // French/Italian
        /\d+\s*\)/,
        /^\d+\s*-/,
        /here\s+are/i,
        /different\s+captions/i,
        /multiple\s+options/i
      ];
      
      const hasMultipleOptions = multipleOptionPatterns.some(pattern => pattern.test(caption));
      
      if (hasMultipleOptions || caption.split('\n').length > 2) {
        // Split by various separators and take the first meaningful caption
        const lines = caption.split(/\n|option\s*\d+[.:)]?|choice\s*\d+[.:)]?|caption\s*\d+[.:)]?|\d+\s*[.\)\:]-?|\*\*\d+\*\*|opción\s*\d+|opção\s*\d+|variante\s*\d+/i);
        
        for (const line of lines) {
          let cleanLine = line.trim();
          // Remove common prefixes
          cleanLine = cleanLine.replace(/^[:\-\s\*]+/, '').trim();
          cleanLine = cleanLine.replace(/^(here\s+(is|are)|caption|option|choice|opción|opção|variante)\s*:?\s*/i, '').trim();
          
          if (cleanLine && 
              cleanLine.length > 15 && 
              !cleanLine.toLowerCase().includes('option') &&
              !cleanLine.toLowerCase().includes('choice') &&
              !cleanLine.toLowerCase().includes('caption') &&
              !cleanLine.toLowerCase().includes('here are') &&
              !/^\d+[.\)\:]/.test(cleanLine)) {
            caption = cleanLine;
            break;
          }
        }
      }
      
      // Apply tone modifications if needed (OpenRouter models usually handle this well already)
      caption = applyToneToCaption(caption, settings.tone);

      console.log('Successfully generated caption using OpenRouter:', caption);
      return caption;

    } catch (error) {
      console.error('OpenRouter caption generation failed:', error);
      throw error;
    }
  }

  // Generate prompt for OpenRouter based on settings
  function generateOpenRouterPrompt(tone, language, keyword = null) {
    let prompt = 'Please provide a single caption for this image';
    
    // Add tone instructions
    switch (tone) {
      case 'funny':
        prompt += ' with a humorous and witty tone';
        break;
      case 'professional':
        prompt += ' with a professional and formal tone suitable for business use';
        break;
      case 'descriptive':
        prompt += ' with detailed and descriptive language';
        break;
      case 'seo':
        prompt += ' optimized for SEO with relevant keywords and hashtags';
        break;
      default:
        prompt += ' in a clear and engaging way';
    }
    
    // Add keyword integration instructions (IMPROVED)
    if (keyword && keyword.trim()) {
      prompt += `. IMPORTANT: Naturally incorporate the concept "${keyword.trim()}" into the caption content. Don't just add it as a prefix or suffix - weave it meaningfully into the description so it feels natural and relevant to what's shown in the image`;
    }
    
    // Add language instructions
    if (language && language !== 'en') {
      const languageNames = {
        'es': 'Spanish',
        'fr': 'French', 
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'ru': 'Russian'
      };
      prompt += ` in ${languageNames[language] || language}`;
    }
    
    prompt += '. Keep the caption concise but meaningful, suitable for social media use. Provide only one caption, not multiple options or variations.';
    
    return prompt;
  }


  // Helper function to convert blob to base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
})();