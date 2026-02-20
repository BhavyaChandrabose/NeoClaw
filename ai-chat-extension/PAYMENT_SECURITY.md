# Payment Gateway Screenshot Protection

## Overview
The AI Chat Extension includes an **optional** automatic screenshot protection feature for payment gateway pages to enhance user security during financial transactions. This feature can be enabled or disabled in the settings.

## Configuration

### Enabling/Disabling the Feature

1. Open AI Chat Extension settings
2. Navigate to **"Security Features"** section
3. Toggle **"Block Screenshots on Payment Pages"**
4. Click **"Save Settings"**

**Default**: Enabled (turned on by default for maximum security)

## How It Works

### 1. **Automatic Detection**
When the feature is enabled, the extension automatically detects when you're on a payment-related page by checking for common payment patterns in:
- **URL**: payment, checkout, billing, cart, stripe, paypal, razorpay, etc.
- **Page Title**: Any payment-related keywords

### 2. **Screenshot Blocking**
When a payment page is detected, the following protections are activated:

#### Detection & Response:
- **PrintScreen Key**: Detects press, shows warning overlay, blurs sensitive content
- **Window Focus Loss**: Detects potential screenshot tool activation (e.g., Snipping Tool)
- **Clipboard Clearing**: Continuously clears clipboard to prevent screenshot storage

#### Protection Actions:
- **Visual Warning Overlay**: Full-screen "SCREENSHOT DETECTED" warning appears for 2 seconds
- **Content Blurring**: Automatically blurs sensitive form fields (card numbers, CVV, passwords) for 2 seconds
- **Clipboard Manipulation**: Replaces clipboard with security message
- **Audit Logging**: Console logs all screenshot attempts

**IMPORTANT**: Due to browser security limitations, this is a **deterrent system** that makes screenshots harder and less useful, but cannot completely prevent OS-level screenshot tools. See [SCREENSHOT_PROTECTION_LIMITATIONS.md](./SCREENSHOT_PROTECTION_LIMITATIONS.md) for technical details.

### 3. **Visual Indicator**
A purple security banner appears at the bottom of payment pages showing:
```
🔒 Payment Page Protected - Screenshots Disabled for Your Security
```

### 4. **Continuous Monitoring**
- Monitors for URL changes (works with Single Page Applications)
- Re-enables protection if you navigate to a payment page within the same site
- Automatically disables when you leave payment pages

## Payment Patterns Detected

The extension recognizes these patterns as payment-related:
- `payment`, `checkout`, `billing`, `pay`, `cart`
- `stripe`, `paypal`, `razorpay`, `paytm`, `phonepe`
- `googlepay`, `amazonpay`, `worldpay`, `square`
- `/checkout`, `/payment`, `/billing`, `/cart`
- `secure`, `transaction`, `order-confirmation`

## Technical Implementation

### Files Added/Modified:
1. **`content-security.js`** (NEW)
   - Content script that runs on all pages
   - Detects payment pages
   - Blocks screenshot functionality
   - Adds security banner

2. **`manifest.json`** (MODIFIED)
   - Added `clipboardWrite` permission
   - Added content script configuration
   - Runs at `document_start` for early protection

### Key Functions:
```javascript
isPaymentPage()          // Detects if current page is payment-related
blockPrintScreen()       // Activates screenshot blocking
addSecurityBanner()      // Shows visual security indicator
```

## Security Features

### Multi-Layer Protection:
1. **Keyboard Event Detection**: Detects PrintScreen key presses
2. **Window Focus Monitoring**: Detects potential screenshot tool activation
3. **Visual Warning Overlay**: Full-screen warning when screenshot detected
4. **Content Blurring**: Automatically blurs sensitive form fields
5. **Clipboard Clearing**: Prevents screenshot storage in clipboard
6. **Alert Notifications**: Warns users when screenshot is attempted

### Browser Compatibility & Limitations:
- ✅ Chrome/Edge: Full detection support
- ✅ Visual deterrence: Warning overlay and blur effects
- ⚠️ **Important**: Browser extensions cannot block OS-level screenshot tools (Snipping Tool, third-party apps)
- ⚠️ This is a **deterrent system** that makes screenshots less useful, not an impenetrable shield
- 📖 See [SCREENSHOT_PROTECTION_LIMITATIONS.md](./SCREENSHOT_PROTECTION_LIMITATIONS.md) for full technical details

## User Experience

### What Users See:

**When Feature is ENABLED:**

1. **On Payment Pages**:
   - Security banner at bottom of page
   - Alert if screenshot is attempted
   - Console messages (for debugging)

2. **On Non-Payment Pages**:
   - No impact or interference
   - Normal browsing experience

**When Feature is DISABLED:**
- No screenshot blocking on any pages
- Normal browsing and screenshot functionality
- Feature is completely inactive

### User Alerts:
When a screenshot is attempted on a payment page:
```
Full-screen overlay: "🔒 SCREENSHOT DETECTED - Payment page content is protected"
+ Sensitive fields automatically blurred for 2 seconds
+ Console log: [AI Chat Security] PrintScreen detected - showing overlay
```

## Privacy & Performance

- **Lightweight**: Minimal performance impact
- **Privacy-Focused**: Runs entirely locally, no data sent anywhere
- **Non-Intrusive**: Only activates on payment pages
- **Transparent**: Console logging for debugging

## Testing

### To Test the Feature:
1. Navigate to any payment-related URL (e.g., containing "payment" or "checkout")
2. Look for the purple security banner at the bottom
3. Try pressing PrintScreen or screenshot shortcuts
4. Verify alert appears and screenshot is blocked

### Test URLs:
- `https://example.com/checkout`
- `https://example.com/payment`
- `https://stripe.com/`
- Any page with "payment" in URL or title

## Limitations

### What It Can Detect & Mitigate:
✅ Browser-based screenshot attempts
✅ PrintScreen key presses
✅ Window focus changes (Snipping Tool activation)
✅ Clipboard-based screenshots
✅ Visual deterrence through overlay and blur

### What It Cannot Block:
❌ OS-level screenshot tools (Win + Shift + S, Snipping Tool)
❌ Third-party screenshot applications
❌ Physical camera photos of screen
❌ Screen recording software
❌ Remote desktop captures
❌ External capture devices

### Why These Limitations Exist:
Browser extensions run in a sandboxed environment and cannot control OS-level functionality. This is by design for security. The extension provides a **deterrent and detection system** that makes screenshots harder and less useful, but cannot guarantee 100% prevention.

**See [SCREENSHOT_PROTECTION_LIMITATIONS.md](./SCREENSHOT_PROTECTION_LIMITATIONS.md) for comprehensive technical explanation.**

## Troubleshooting

### Banner Not Appearing?
- **Check if feature is enabled** in Settings → Security Features
- Verify URL contains payment keywords
- Open browser console and look for `[AI Chat Security]` logs
- Reload the extension and page

### Screenshots Still Working?
- **Verify feature is enabled** in extension settings
- Some OS-level tools may bypass browser protections
- Browser extension cannot block all screenshot methods
- The feature provides reasonable protection for typical scenarios

### Disabling the Feature:
**Recommended Method:**
1. Open AI Chat Extension settings
2. Navigate to "Security Features" section
3. Uncheck "Block Screenshots on Payment Pages"
4. Click "Save Settings"

**Alternative (for developers):**
1. Remove or comment out the content script in `manifest.json`
2. Or modify `PAYMENT_PATTERNS` in `content-security.js` to an empty array

## Console Logging

The feature logs its activity for debugging:
```
[AI Chat Security] Payment page protection script loaded
[AI Chat Security] Payment page detected and protection enabled in settings
[AI Chat Security] Print screen protection enabled
[AI Chat Security] Screenshot blocked
[AI Chat Security] Payment protection disabled in settings (when disabled)
```

## Future Enhancements

Potential improvements:
- ✅ **User toggle in settings to enable/disable** (IMPLEMENTED)
- Custom payment pattern configuration
- Enhanced detection using page content analysis
- Watermark overlay on payment pages
- Screenshot attempt logging

## Security Note

This is a **defense-in-depth** measure that adds an additional layer of security. It cannot guarantee complete screenshot prevention due to browser and OS limitations, but it significantly raises the bar for potential attackers or malware trying to capture sensitive payment information through screenshots.
