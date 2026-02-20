# NeoClaw Credentials Setup Guide

## Credentials Saved

Your NeoClaw AI Gateway credentials have been configured:

- **URL:** `https://ai-hacker-neoclaw.securebrowser.com`
- **Token:** `kOwC16C2Y6vhu1RrLz2s7wwpJAFfBwPhCcIZ8ym8nSWsgooF`

## What Was Done

### 1. Updated Default Settings
The credentials have been added to the default settings in:
- `background.js` (lines 13-22) - Default settings that apply on fresh install
- `settings.js` (lines 82-91) - Default settings for reset functionality

### 2. Files Modified
- ✅ `background.js` - Added credentials to DEFAULT_SETTINGS
- ✅ `settings.js` - Added credentials to reset defaults
- 📄 `setup-credentials.js` - Created quick setup script

## How to Apply the Credentials

### Method 1: Reload Extension (Recommended for Fresh Install)
1. Open Chrome and go to `chrome://extensions/`
2. Find "AI Chat Extension"
3. Click the reload icon (🔄) to reload the extension
4. The extension will initialize with the credentials

### Method 2: Use Settings Page (If Extension Already Running)
1. Click the extension icon in Chrome toolbar
2. Click "⚙️ Settings" button
3. Scroll to "🔗 NeoClaw Connection" section
4. Verify the URL and Token are filled in
5. Click "🔌 Test Connection" to verify it works
6. If empty, paste:
   - **URL:** `https://ai-hacker-neoclaw.securebrowser.com`
   - **Token:** `kOwC16C2Y6vhu1RrLz2s7wwpJAFfBwPhCcIZ8ym8nSWsgooF`
7. Click "💾 Save Settings"

### Method 3: Quick Setup Script (For Existing Extension)
1. Click the extension icon in Chrome toolbar
2. Right-click on the popup and select "Inspect"
3. Go to the Console tab
4. Copy and paste the contents of `setup-credentials.js` into the console
5. Press Enter to run the script
6. You should see: `✅ NeoClaw credentials saved successfully!`

## Verify Connection

### Test the Connection
1. Open Settings page (⚙️ Settings in popup)
2. In the "🔗 NeoClaw Connection" section
3. Click "🔌 Test Connection" button
4. You should see: `✅ Connected!`

### Test the Chat
1. Click the extension icon
2. Type a message like "Hello" or "What tabs do I have open?"
3. Click "Send" or press Enter
4. You should get a response from NeoClaw AI
5. The response should reference your browsing context (history, tabs, memories)

## Expected Behavior

### Before Credentials Were Set
❌ Error message: "I'm not connected to NeoClaw AI yet. Please set your NeoClaw credentials in Settings."

### After Credentials Are Set
✅ AI responds with contextual information
✅ Can see your browsing history (if enabled)
✅ Can see your open tabs (if enabled)  
✅ Can access stored memories
✅ Provides personalized responses

## Troubleshooting

### Issue: Still showing "not connected" message
**Solution:**
1. Reload the extension completely
2. Or use Method 2 or Method 3 above to manually set credentials
3. Check the console for errors

### Issue: Connection test fails
**Solution:**
1. Verify the URL is exactly: `https://ai-hacker-neoclaw.securebrowser.com`
2. Verify the token hasn't been truncated or modified
3. Check your internet connection
4. Open browser console (F12) and check for network errors

### Issue: Credentials not saving
**Solution:**
1. Open Chrome DevTools (F12)
2. Go to Application tab → Storage → Local Storage
3. Look for the extension's storage
4. Manually verify `ai_settings` contains `neoClawUrl` and `neoClawToken`

### Check Credentials Programmatically
Open the extension popup, right-click → Inspect, then in console run:

```javascript
chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
  console.log('Settings:', response.data);
  console.log('URL:', response.data.neoClawUrl);
  console.log('Token Set:', !!response.data.neoClawToken);
});
```

## Security Notes

🔒 **Token Security:**
- The token is stored in Chrome's local storage (encrypted by Chrome)
- The token is shown as a password field (hidden by default) in Settings
- Never share your token publicly
- The token is sent via HTTPS to your NeoClaw instance

🔐 **Banking Protection:**
- "Never Remember Banking Sites" is enabled by default
- This prevents the AI from accessing financial website data
- You can customize this in Settings

## Next Steps

1. ✅ **Reload the extension** to apply the credentials
2. ✅ **Test the connection** in Settings page
3. ✅ **Try chatting** with the AI in the popup
4. ✅ **Review settings** to customize data sources and privacy options

## Files Reference

- `background.js` - Main service worker, handles NeoClaw API calls
- `settings.html` - Settings page UI
- `settings.js` - Settings page logic
- `setup-credentials.js` - Quick setup script (run in console)
- `popup.html` - Extension popup UI
- `popup.js` - Extension popup logic

## API Details

The extension uses the NeoClaw API with these settings:

```javascript
{
  endpoint: '/v1/responses',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json',
    'x-openclaw-agent-id': 'main'
  },
  body: {
    model: 'openclaw',
    stream: false,
    input: [/* messages */]
  }
}
```

## Questions?

If you have any issues:
1. Check the browser console for errors
2. Check the background service worker console (chrome://extensions/ → service worker link)
3. Verify credentials in Settings page
4. Test connection using the "Test Connection" button
5. Try the quick setup script if needed

---

**Status:** ✅ Credentials configured and ready to use!
**Last Updated:** February 19, 2026
