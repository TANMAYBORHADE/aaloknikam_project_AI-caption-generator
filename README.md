# 🎨 AI Image Caption Generator

A powerful Chrome extension that generates AI-powered captions for any image with a simple right-click. Perfect for content creators, social media managers, accessibility advocates, and anyone who needs quick, intelligent image descriptions.

## ✨ Features

- **🤖 Multiple AI Providers**: Choose from Hugging Face (free), OpenRouter (premium), Google Vision, or custom APIs
- **🎭 Multiple Caption Tones**: Descriptive, Professional, Funny, SEO-optimized
- **🌍 Multilingual Support**: Generate captions in 12+ languages
- **📱 Social Media Integration**: Direct sharing to Twitter, LinkedIn, Facebook, Instagram
- **📊 Export Options**: CSV, JSON formats for data analysis
- **🔒 Privacy-First**: All processing respects user privacy and GDPR compliance
- **📈 Usage Analytics**: Track your captioning activity
- **⚡ Fast & Reliable**: Optimized for speed with smart caching

## 🚀 Quick Start

### Installation
1. Download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

### Getting API Keys

#### OpenRouter (Recommended - Best Quality)
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Go to [Keys](https://openrouter.ai/keys) section
4. Create a new API key
5. Add credits to your account (pay-per-use pricing)
6. Models available: GPT-4 Vision, Claude 3, Gemini Pro Vision, LLaVA, and more

**Why OpenRouter?**
- ✅ Higher quality captions
- ✅ Multiple premium models
- ✅ Better reliability
- ✅ Faster response times
- ✅ Advanced vision capabilities

#### Hugging Face (Free Alternative)
1. Visit [Hugging Face](https://huggingface.co)
2. Create a free account
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Create a new token with "Read" permissions
5. Note: Free models may have limitations and occasional downtime

### Setup
1. Click the extension icon
2. Go to the **Settings** tab
3. Select your preferred **AI Provider** (OpenRouter recommended)
4. Enter your **API Key**
5. Choose your default **tone** and **language**
6. Click **Save Settings**

### Usage
1. **Right-click** on any image on the web
2. Select **"Generate AI Caption"** from the context menu
3. Wait for the AI to process the image
4. **Copy**, **Share**, or **Regenerate** the caption as needed

## 🎯 Advanced Features

### Caption Tones
- **Descriptive**: Detailed, factual descriptions
- **Professional**: Business-appropriate, formal tone
- **Funny**: Humorous and witty captions
- **SEO-Friendly**: Optimized with keywords and hashtags

### Multi-Language Support
Generate captions in:
- English, Spanish, French, German
- Italian, Portuguese, Chinese, Japanese
- Korean, Arabic, Hindi, Russian

### Social Media Integration
- **Twitter/X**: Direct posting with optimized character count
- **LinkedIn**: Professional sharing with context
- **Facebook**: Social sharing with engagement focus  
- **Instagram**: Caption formatting with hashtags

### Data Export
- **CSV Format**: Spreadsheet-compatible for analysis
- **JSON Format**: Developer-friendly structured data
- Include metadata: timestamp, tone, language, source URL

## 🔧 Configuration Options

### AI Provider Settings
| Provider | Cost | Quality | Speed | Models Available |
|----------|------|---------|-------|------------------|
| **OpenRouter** | Paid | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | GPT-4V, Claude 3, Gemini Pro |
| Hugging Face | Free | ⭐⭐⭐ | ⚡⚡ | BLIP, GIT, ViT-GPT2 |
| Google Vision | Paid | ⭐⭐⭐⭐ | ⚡⚡⚡ | Vision API |
| Custom API | Varies | Varies | Varies | Your choice |

### OpenRouter Model Options
Configure in settings for different use cases:
- `openai/gpt-4-vision-preview` - Best overall quality
- `anthropic/claude-3-opus-20240229` - Creative descriptions  
- `google/gemini-pro-vision` - Fast and accurate
- `liuhaotian/llava-13b` - Open source alternative

## 🛠️ Troubleshooting

### Common Issues

**"Invalid API Key" Error**
- Verify your API key is correct and active
- Check if you have sufficient credits (OpenRouter)
- Ensure the key has proper permissions

**"Model Not Found" Error**  
- Try switching to a different model in settings
- Check if the model is currently available
- Use the default recommended models

**Slow Response Times**
- Switch to OpenRouter for faster processing
- Check your internet connection
- Try during off-peak hours

**Extension Not Working**
- Refresh the page after installation
- Check Chrome developer console for errors
- Ensure you're right-clicking on actual images

### Getting Help
- Check the [GitHub Issues](https://github.com/yourusername/ai-caption-generator/issues)
- Email support: support@example.com
- Review the [Privacy Policy](privacy-policy.html)

## 🔒 Privacy & Security

- **Local Storage**: All settings and history stored locally on your device
- **No Data Collection**: We don't collect or store your images or captions
- **API Security**: Keys are encrypted and never shared
- **GDPR Compliant**: Full compliance with European privacy regulations
- **Open Source**: Code is transparent and auditable

## 📊 Pricing Comparison

### OpenRouter (Recommended)
- **GPT-4 Vision**: ~$0.01-0.03 per image
- **Claude 3**: ~$0.015 per image  
- **Gemini Pro**: ~$0.0025 per image
- **Pay-per-use**: Only pay for what you use
- **No monthly fees**: Credits don't expire

### Alternatives
- **Hugging Face**: Free (with limitations)
- **Google Vision**: $1.50 per 1,000 images
- **Custom APIs**: Varies by provider

## 🚀 Coming Soon

- [ ] Batch processing for multiple images
- [ ] Custom prompt templates
- [ ] OCR text extraction from images
- [ ] Image editing suggestions
- [ ] WordPress plugin integration
- [ ] Mobile app version

## 💻 For Developers

### Architecture
- **Manifest V3**: Latest Chrome extension standard
- **Modular Design**: Clean separation of concerns
- **Error Handling**: Comprehensive error recovery
- **Performance**: Optimized for speed and reliability

### API Integration
```javascript
// Example OpenRouter API call
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4-vision-preview',
    messages: [/* message structure */]
  })
});
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🏆 Acknowledgments

- OpenRouter team for excellent API service
- Hugging Face for open-source models
- Chrome extension community
- Beta testers and contributors

---

**Made with ❤️ for the content creation community** 