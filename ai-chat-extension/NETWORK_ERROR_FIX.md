# Network Error: Failed to Fetch - Diagnosis & Fix

## Error You're Seeing

```
[AI Chat] ❌ Error in batch LLM topic check: TypeError: Failed to fetch
```

## What This Means

The browser extension **cannot connect** to your NeoClaw server. This is a network/connectivity issue, not a code issue.

## Common Causes

### 1. **CORS (Cross-Origin Resource Sharing) Issue** ⚠️ MOST LIKELY

**Problem:** The NeoClaw server at `https://ai-hacker-neoclaw.securebrowser.com` is blocking requests from the Chrome extension.

**Why:** Browser extensions are treated as different origins, and the server needs to explicitly allow them.

**Solution:** The NeoClaw server needs to include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, x-openclaw-agent-id
```

### 2. **Network/Firewall Blocking**

**Problem:** Your network, firewall, or antivirus is blocking the request.

**Check:**
- Can you access `https://ai-hacker-neoclaw.securebrowser.com` in a normal browser tab?
- Is there a corporate firewall or VPN blocking the connection?
- Try disabling antivirus/firewall temporarily to test

### 3. **Invalid URL or Server Down**

**Problem:** The server URL is incorrect or the server is not responding.

**Check:**
- Verify URL is exactly: `https://ai-hacker-neoclaw.securebrowser.com`
- No trailing slash
- HTTPS (not HTTP)
- Server is actually running

### 4. **SSL/Certificate Issue**

**Problem:** The HTTPS certificate is invalid or self-signed.

**Check:**
- Visit the URL in browser - do you get certificate warnings?
- Self-signed certificates may be blocked by fetch API

## Diagnostic Steps

### Step 1: Check URL in Browser Console

Open background service worker console and run:

```javascript
// Test the connection
chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (result) => {
  console.log('Test result:', result);
});
```

This will show detailed error information.

### Step 2: Manual Fetch Test

In background service worker console:

```javascript
// Get settings
chrome.storage.local.get('ai_settings', async (result) => {
  const url = result.ai_settings.neoClawUrl;
  const token = result.ai_settings.neoClawToken;
  
  console.log('Testing URL:', url);
  console.log('Token present:', !!token);
  
  try {
    const response = await fetch(`${url}/v1/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main'
      },
      body: JSON.stringify({
        model: 'openclaw',
        stream: false,
        input: [{
          type: 'message',
          role: 'user',
          content: 'ping'
        }]
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Fetch error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  }
});
```

### Step 3: Check Network Tab

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Try the delete operation again
4. Look for the request to `ai-hacker-neoclaw.securebrowser.com`
5. Check:
   - Does the request appear?
   - What's the status? (failed, 403, 404, etc.)
   - What error message?

### Step 4: Check Manifest Permissions

Verify `manifest.json` has:
```json
{
  "host_permissions": [
    "<all_urls>"
  ]
}
```

✅ This is already correct in your manifest.

## Solutions

### Solution 1: Fix CORS on Server (Best)

**If you control the NeoClaw server:**

Add these headers to the server response:

```javascript
// Node.js/Express example
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-openclaw-agent-id');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

### Solution 2: Use Proxy (Workaround)

If you can't modify the server, set up a proxy:

1. Create a local proxy server that forwards requests
2. Point extension to proxy: `http://localhost:3000`
3. Proxy forwards to `https://ai-hacker-neoclaw.securebrowser.com`

### Solution 3: Test with Different URL

Try changing the URL to see if it's a network issue:

**In Settings:**
- Try: `http://ai-hacker-neoclaw.securebrowser.com` (HTTP instead of HTTPS)
- Or try: Your server's IP address directly

### Solution 4: Check for Typos

Verify the URL character by character:
```
https://ai-hacker-neoclaw.securebrowser.com
```

Common mistakes:
- Extra space at end
- Missing 's' in 'https'
- Wrong domain

## Quick Test Commands

### Test 1: Verify Settings

```javascript
chrome.storage.local.get('ai_settings', (result) => {
  console.log('URL:', result.ai_settings?.neoClawUrl);
  console.log('Token:', result.ai_settings?.neoClawToken);
});
```

### Test 2: Simple Ping

```javascript
fetch('https://ai-hacker-neoclaw.securebrowser.com/v1/responses', {
  method: 'OPTIONS'
}).then(r => console.log('CORS preflight:', r.status))
  .catch(e => console.error('CORS blocked:', e));
```

### Test 3: Full Request

Use the manual fetch test from Step 2 above.

## Enhanced Logging

With the updated code, you'll now see:

```javascript
[AI Chat] Sending batch request to LLM for 5 memories
[AI Chat] Search term: programming
[AI Chat] NeoClaw URL: https://ai-hacker-neoclaw.securebrowser.com
[AI Chat] Token present: true
[AI Chat] Full endpoint: https://ai-hacker-neoclaw.securebrowser.com/v1/responses
[AI Chat] Request payload: {...}
```

This helps identify exactly where the failure occurs.

## Expected Behavior

### If Connection Works:
```
[AI Chat] ✓ LLM configured - using intelligent content analysis
[AI Chat] Sending batch request...
[AI Chat] Fetch completed, status: 200
[AI Chat] LLM batch response: 1,3,5
[AI Chat] ✅ Connection successful!
```

### If CORS Blocked:
```
[AI Chat] Sending batch request...
[AI Chat] ❌ Error in batch LLM topic check: TypeError: Failed to fetch
[AI Chat] Falling back to simple string matching
```

## Temporary Workaround

While you fix the network issue, the extension will use **simple string matching**:

- Searches only the `topic` field
- Case-insensitive
- Substring matching
- Less intelligent, but functional

**Example:**
- Search "chat" → Finds memories with `topic: "chat"`
- Search "programming" → Only finds `topic: "programming"` (not "coding" or content-based)

## Action Items

1. **Verify URL is accessible:** Open `https://ai-hacker-neoclaw.securebrowser.com` in browser
2. **Check CORS:** Contact server admin or check server logs for CORS errors
3. **Test connection:** Use the diagnostic commands above
4. **Enable CORS:** Add CORS headers to server (if you control it)
5. **Reload extension:** After server changes, reload extension

## Getting More Info

Run this comprehensive diagnostic:

```javascript
// In background service worker console
(async () => {
  console.log('=== NEOCLAW DIAGNOSTIC ===');
  
  // Check settings
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  console.log('URL:', ai_settings?.neoClawUrl);
  console.log('Token present:', !!ai_settings?.neoClawToken);
  console.log('Token length:', ai_settings?.neoClawToken?.length);
  
  // Test connection
  const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
  console.log('Test result:', result);
  
  // Check manifest
  const manifest = chrome.runtime.getManifest();
  console.log('Host permissions:', manifest.host_permissions);
  
  console.log('=== END DIAGNOSTIC ===');
})();
```

## Summary

**Root cause:** Network connectivity issue - most likely **CORS blocking** from the server.

**Quick fix:** Add CORS headers to NeoClaw server.

**Temporary:** Extension falls back to simple string matching (works but less intelligent).

**Next step:** Check if you can access the NeoClaw URL in a normal browser tab and verify CORS configuration on the server.
