# 🚀 Quick Setup Guide - AI Chat with NeoClaw

## ✅ What's Included

Your AI Chat extension now integrates with **NeoClaw AI** instead of simulated responses!

### Features:
- ✅ Real AI responses from your NeoClaw instance
- ✅ Browsing context (history, tabs, bookmarks) sent to AI
- ✅ Memory management (view, filter, delete)
- ✅ Privacy controls (block banking sites, auto-delete)
- ✅ Smart context building for AI

## 📦 Installation

1. **Load the Extension**:
   ```
   1. Open Neo Browser
   2. Go to chrome://extensions/
   3. Enable "Developer mode"
   4. Click "Load unpacked"
   5. Select: C:\Users\Bhavya.Chandrabose\source\NeoClaw\ai-chat-extension
   ```

2. **Configure NeoClaw Connection**:
   ```
   1. Click the extension icon
   2. Click "⚙️ Settings"
   3. Enter your NeoClaw Gateway URL
   4. Enter your NeoClaw Auth Token
   5. Click "🔌 Test Connection"
   6. Click "💾 Save Settings"
   ```

## 🔧 NeoClaw Configuration

### Get Your Credentials

From your existing NeoClaw extension setup:
- **Gateway URL**: The URL from your auth login (e.g., `https://your-instance.replit.app`)
- **Auth Token**: The token stored in your NeoClaw extension

### Settings to Configure:

```
NeoClaw Gateway URL: https://[your-instance].replit.app
NeoClaw Auth Token: [your-token-here]
```

## 💬 How It Works

1. **User sends message** → Extension gathers context
2. **Context includes**:
   - Recent browsing history (configurable)
   - Open tabs (configurable)
   - Bookmarks (configurable)
   - Stored memories
3. **Context sent to NeoClaw** → AI understands your browsing
4. **AI responds** → Response stored as memory

## 📊 Context Example

When you chat, NeoClaw receives:

```
📜 RECENT HISTORY (10 items):
- How to build Chrome extensions (github.com)
- NeoClaw documentation (docs.openclaw.ai)
...

📑 OPEN TABS (5 tabs):
- Google Search [ACTIVE]
- GitHub Repository
...

💾 STORED MEMORIES (3 memories):
- [user] What is NeoClaw?
- [ai] NeoClaw is an AI platform...
```

## 🎯 Key Features

### 1. Smart Memory Dashboard
- View all AI interactions
- Filter by source, topic, time
- Delete individual or bulk memories
- See memory statistics

### 2. Privacy Controls
- ✅ Never remember banking sites (auto-enabled)
- ✅ Block specific domains
- ✅ Disable data sources
- ✅ Auto-delete old memories

### 3. Context Awareness
AI sees your:
- Browsing history
- Open tabs
- Bookmarks
- Previous conversations

## 🔒 Security

- NeoClaw token stored securely in `chrome.storage`
- Banking sites automatically blocked
- All data stays local except AI requests
- No tracking or analytics

## 🧪 Testing

### Test the Connection:
1. Go to Settings
2. Enter NeoClaw credentials
3. Click "Test Connection"
4. Should see "✅ Connected!"

### Test AI Chat:
1. Click extension icon
2. Type: "What can you see in my browsing context?"
3. AI should respond with your current context

### Test Memory:
1. Chat with AI
2. Click "📊 Memory Dashboard"
3. See all chat messages stored
4. Try filtering and deleting

## 📝 Example Usage

```
You: "What was I researching about Chrome extensions?"

AI: [Analyzes your history and responds]
"Based on your recent browsing, you've been looking at:
- Chrome extension manifest v3 documentation
- React TypeScript setup guides
- How to use chrome.storage API
..."
```

## ⚙️ Default Settings

```javascript
{
  enableHistory: true,
  enableBookmarks: true,
  enableTabs: true,
  neverRememberBanking: true,
  autoDeleteDays: 30,
  maxMemories: 1000
}
```

## 🎨 Customization

### To modify context sent to AI:
Edit `buildContextMessage()` in `background.js`

### To change AI model:
Edit `NEOCLAW_CONFIG.model` in `background.js`

### To add more memory types:
Extend the memory structure in `addMemory()`

## 🚀 Next Steps

1. ✅ Install extension
2. ✅ Configure NeoClaw credentials
3. ✅ Test connection
4. ✅ Start chatting!
5. 📊 Explore Memory Dashboard
6. ⚙️ Customize settings

## 📖 Architecture

```
User Message
    ↓
Gather Context (history, tabs, bookmarks, memories)
    ↓
Build Context Message
    ↓
Send to NeoClaw API
    ↓
Receive AI Response
    ↓
Store as Memory
    ↓
Display to User
```

## 🛠️ Troubleshooting

**"Not connected to NeoClaw"**
- Check Settings → NeoClaw Connection
- Verify URL and token are correct
- Test connection

**"Error connecting to NeoClaw"**
- Check your internet connection
- Verify NeoClaw instance is running
- Check token hasn't expired

**No context shown**
- Check Settings → Data Sources
- Enable History, Tabs, or Bookmarks
- Grant necessary permissions

---

**You're all set!** 🎉

Your AI Chat extension now has:
- ✅ Real NeoClaw AI
- ✅ Smart context awareness
- ✅ Memory management
- ✅ Privacy controls

Perfect for hackathon demos! 🚀
