# 🚀 OpenRouter Setup Guide

## Why OpenRouter?

OpenRouter provides access to premium AI models through a single API, offering:
- **🏆 Superior Quality**: GPT-4 Vision, Claude 3, Gemini Pro Vision
- **⚡ Faster Processing**: 2-5x faster than free alternatives
- **🔄 Model Variety**: Choose from 20+ vision models
- **💰 Cost-Effective**: Pay only for what you use
- **🛡️ Reliability**: 99.9% uptime with enterprise support

## 🎯 Quick Setup (2 minutes - FREE!)

### Step 1: Create OpenRouter Account
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Click **"Sign Up"** (free account)
3. Verify your email address

### Step 2: Get API Key
1. Go to [Keys](https://openrouter.ai/keys) section
2. Click **"Create Key"**
3. Copy your API key (starts with `sk-or-...`)

### Step 3: Skip Credits (FREE Models!)
✅ **No payment needed!** Free models don't require credits

### Step 4: Configure Extension
1. Click the **AI Caption Generator** extension icon
2. Go to **Settings** tab
3. Select **"OpenRouter (Paid)"** as provider
4. Paste your API key
5. Set Model Name to: `qwen/qwen-2-vl-7b-instruct:free`
6. Click **"Save Settings"**

### Step 5: Test & Use
1. Click **"Test API Connection"** to verify
2. Right-click any image → **"Generate AI Caption"**
3. Enjoy **FREE** high-quality captions! 🎉

## 💡 Model Recommendations

### 🆓 **Completely FREE Models**
```
qwen/qwen-2-vl-7b-instruct:free
```
- **Cost**: 💯 **FREE FOREVER**
- **Quality**: ⭐⭐⭐⭐ (excellent for free!)
- **Use for**: Everything! Vision + reasoning at no cost
- **Default**: ✅ Works immediately with OpenRouter account

```
meta-llama/llama-3.2-11b-vision-instruct:free
```
- **Cost**: 💯 **FREE FOREVER**
- **Quality**: ⭐⭐⭐⭐
- **Use for**: Great alternative free vision model

### 🧠 Best Reasoning (Accessible)
```
openai/o3-mini
```
- **Cost**: ~$0.01-0.05 per image
- **Quality**: ⭐⭐⭐⭐⭐ 
- **Use for**: Great reasoning, no OpenAI key required
- **Default**: ✅ Works immediately with just OpenRouter

### 🚀 Ultimate Reasoning (Requires Setup)
```
openai/o3-pro
```
- **Cost**: ~$0.05-0.15 per image (premium)
- **Quality**: ⭐⭐⭐⭐⭐⭐ (6/5 stars!)
- **Use for**: Maximum quality, complex analysis
- **Requirement**: ⚠️ Needs OpenAI API key linked to OpenRouter

### Best Overall Quality
```
openai/gpt-4-vision-preview
```
- **Cost**: ~$0.01-0.03 per image
- **Quality**: ⭐⭐⭐⭐⭐
- **Use for**: Professional content, detailed descriptions

### Creative & Funny Captions
```
anthropic/claude-3-opus-20240229
```
- **Cost**: ~$0.015 per image  
- **Quality**: ⭐⭐⭐⭐⭐
- **Use for**: Social media, creative writing

### Fast & Affordable
```
google/gemini-pro-vision
```
- **Cost**: ~$0.0025 per image
- **Quality**: ⭐⭐⭐⭐
- **Use for**: Bulk processing, quick captions

### Open Source Alternative
```
liuhaotian/llava-13b
```
- **Cost**: ~$0.001 per image
- **Quality**: ⭐⭐⭐
- **Use for**: Budget-conscious users

## 🔧 Advanced Configuration

### Custom Model Selection
1. Go to extension **Settings**
2. In **"Model Name"** field, enter:
   - `openai/o3-mini` (default - great reasoning, works immediately)
   - `openai/o3-pro` (ultimate quality - requires OpenAI key setup)
   - `openai/gpt-4-vision-preview` (balanced)
   - `anthropic/claude-3-opus-20240229` (creative)
   - `google/gemini-pro-vision` (fast & affordable)
   - Or any other [supported model](https://openrouter.ai/docs#models)

### Tone Optimization
OpenRouter models are smart enough to handle tone instructions well:
- **Professional**: Works great for business content
- **Funny**: Generates witty, engaging captions
- **SEO**: Adds relevant keywords and hashtags
- **Descriptive**: Provides detailed, accurate descriptions

### 🔑 Setting Up o3-pro (Optional)
If you want the absolute best quality with `openai/o3-pro`:

1. Get an **OpenAI API key**:
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Add credits to your OpenAI account

2. **Link it to OpenRouter**:
   - Go to [OpenRouter Integrations](https://openrouter.ai/settings/integrations)
   - Add your OpenAI API key
   - This allows OpenRouter to access OpenAI's o3-pro model

3. **Update Extension**:
   - Change Model Name to: `openai/o3-pro`
   - Test connection
   - Enjoy ultimate quality captions!

## 💰 Cost Calculator

**o3-pro Usage (premium reasoning model)**:
- **Light User**: 10 images = $0.50-1.50
- **Regular User**: 50 images = $2.50-7.50  
- **Heavy User**: 200 images = $10.00-30.00

**Mixed Usage (o3-pro + other models)**:
- **Casual**: $5-15/month
- **Professional**: $20-75/month
- **Enterprise**: $75-300/month

### 🧠 **o3-pro Special Features**
- **Advanced Reasoning**: Understands context, relationships, and complex visual elements
- **Multi-step Analysis**: Can break down complex scenes systematically
- **Professional Quality**: Ideal for business, academic, and technical content
- **Detailed Explanations**: Provides reasoning behind caption choices

## 🛠️ Troubleshooting

### "Invalid API Key" Error
- ✅ Check key format: starts with `sk-or-`
- ✅ Verify key is active on OpenRouter dashboard
- ✅ Ensure no extra spaces when copying

### "Insufficient Credits" Error  
- ✅ Add credits to your OpenRouter account
- ✅ Check balance at [openrouter.ai/credits](https://openrouter.ai/credits)
- ✅ Some models require minimum balance

### "Model Not Found" Error
- ✅ Use exact model name from [OpenRouter docs](https://openrouter.ai/docs#models)
- ✅ Check if model is currently available
- ✅ Try default: `openai/o3-mini`

### "OpenAI is requiring a key" Error (403)
- ✅ This happens with `o3-pro` - you need OpenAI API key
- ✅ Switch to `o3-mini` for immediate use
- ✅ Or add OpenAI key to [OpenRouter Integrations](https://openrouter.ai/settings/integrations)

### Slow Performance
- ✅ Try different model (Gemini Pro is fastest)
- ✅ Check OpenRouter status page
- ✅ Verify internet connection

## 📊 Comparison vs Free Alternatives

| Feature | OpenRouter | Hugging Face | Google Vision |
|---------|------------|--------------|---------------|
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⚡⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ |
| **Reliability** | 99.9% | 85% | 95% |
| **Cost** | $0.001-0.03 | Free | $0.0015 |
| **Models** | 20+ premium | 4 basic | 1 standard |
| **Support** | Enterprise | Community | Standard |

## 🎯 Use Cases

### Content Creators
- **Instagram**: Creative, engaging captions
- **YouTube**: Video thumbnail descriptions  
- **Blog Posts**: SEO-optimized image alt text

### Businesses
- **E-commerce**: Product descriptions
- **Marketing**: Ad copy and social posts
- **Accessibility**: Alt text for websites

### Developers
- **Apps**: Automated image tagging
- **Websites**: Dynamic content generation
- **APIs**: Image analysis services

## 🔐 Security & Privacy

- **API Keys**: Stored locally, encrypted
- **Images**: Processed by OpenRouter, not stored
- **Data**: No personal data collection
- **Compliance**: GDPR, SOC2, enterprise-grade

## 📞 Support

- **Extension Issues**: Create [GitHub issue](https://github.com/yourusername/ai-caption-generator/issues)
- **OpenRouter API**: [OpenRouter Support](https://openrouter.ai/docs)
- **Billing**: OpenRouter dashboard
- **Feature Requests**: Extension GitHub repo

---

**Ready to get started? [Set up OpenRouter now!](https://openrouter.ai) 🚀** 