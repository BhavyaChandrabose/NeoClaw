# Dynamic Payment Site Detection

## Overview
The payment page screenshot protection now uses **region-aware, dynamically generated payment site patterns** instead of hardcoded patterns. The extension queries NeoClaw AI to get relevant payment gateways and financial sites based on the user's geographic region.

## How It Works

### 1. **Region Detection**
The extension automatically detects the user's region using:
- **Browser Language** (e.g., `en-US`, `en-IN`, `en-GB`)
- **Timezone** (e.g., `America/New_York`, `Asia/Kolkata`, `Europe/London`)

Supported Regions:
- United States
- India
- United Kingdom
- Europe (general)
- China/Hong Kong
- Japan
- Singapore
- Australia
- Brazil
- UAE/Middle East
- Global (fallback)

### 2. **Pattern Fetching from NeoClaw**
Once the region is detected, the extension sends a request to NeoClaw AI:

**Prompt Template:**
```
List payment gateway and financial website keywords/patterns commonly used in [REGION]. Include:
1. International payment gateways (PayPal, Stripe, etc.)
2. Regional/local payment gateways specific to [REGION]
3. Common URL patterns for checkout/payment pages
4. Banking and financial service keywords

Return ONLY a comma-separated list of lowercase keywords and URL patterns (no explanations).
```

**Example for India:**
```
payment,checkout,billing,stripe,paypal,razorpay,paytm,phonepe,googlepay,
upi,bhim,mobikwik,freecharge,airtel,jio,banking,netbanking,...
```

### 3. **Pattern Combination**
- NeoClaw AI returns region-specific patterns
- These are combined with default international patterns
- Duplicates are removed
- Final list is comprehensive for that region

### 4. **Caching Strategy**
- Patterns are **cached for 24 hours** in `chrome.storage.local`
- Reduces API calls and improves performance
- Automatic refresh after 24 hours

## Benefits

### Before (Hardcoded):
```javascript
const PAYMENT_PATTERNS = [
  'payment', 'checkout', 'stripe', 'paypal'
]; // ❌ Fixed, global, incomplete
```

- Missed regional payment gateways
- No Paytm, Razorpay for India users
- No Alipay, WeChat Pay for Chinese users
- Couldn't adapt to new payment services

### After (Dynamic):
```javascript
// For India:
['payment', 'checkout', 'stripe', 'paypal', 'razorpay', 
 'paytm', 'phonepe', 'googlepay', 'upi', 'bhim', 'mobikwik', ...]

// For China:
['payment', 'checkout', 'stripe', 'paypal', 'alipay', 
 'wechat', 'unionpay', 'tenpay', ...]
```

✅ Region-aware
✅ Comprehensive coverage
✅ Includes local payment gateways
✅ AI-generated, always current

## Technical Implementation

### Files Modified:
1. **`background.js`**:
   - Added `getPaymentPatterns()` function
   - Added `detectUserRegion()` function
   - Added `GET_PAYMENT_PATTERNS` message handler
   - Comprehensive logging for debugging

2. **`content-security.js`**:
   - Modified to load patterns dynamically
   - Added `loadPaymentPatterns()` function
   - Caching logic in content script
   - Fallback to default patterns

3. **`payment-patterns.js`** (NEW):
   - Standalone documentation/reference file
   - Contains full implementation with detailed logging

### Message Flow:
```
Content Script (page load)
    ↓
loadPaymentPatterns()
    ↓
chrome.runtime.sendMessage({ type: 'GET_PAYMENT_PATTERNS' })
    ↓
Background Script: getPaymentPatterns()
    ↓
detectUserRegion() → "India"
    ↓
NeoClaw API Request
    ↓
Parse response
    ↓
Combine with defaults
    ↓
Cache for 24 hours
    ↓
Return patterns to content script
    ↓
Content script: isPaymentPage() uses new patterns
```

### Storage Keys:
```javascript
{
  payment_patterns: [...],           // Array of pattern strings
  payment_patterns_timestamp: 123... // Unix timestamp
}
```

## Detailed Logging

The implementation includes **comprehensive logging** for debugging:

### Startup Logs:
```
[AI Chat Payment] === Starting payment patterns fetch ===
[AI Chat Payment] Fetching fresh patterns...
[AI Chat Payment] 🌍 Detected region: India
[AI Chat Payment] Language: en-IN Timezone: Asia/Kolkata
[AI Chat Payment] NeoClaw URL: https://...
[AI Chat Payment] Token: SET (length: 64)
```

### API Request Logs:
```
[AI Chat Payment] 📤 Sending request...
[AI Chat Payment] Request: {
  "model": "openclaw",
  "stream": false,
  "input": [...]
}
```

### Response Logs:
```
[AI Chat Payment] 📥 Response status: 200 OK
[AI Chat Payment] 📋 Full Response: {
  "output": [{
    "content": [{
      "text": "payment,checkout,razorpay,paytm,..."
    }]
  }]
}
[AI Chat Payment] Extracted text: payment,checkout,razorpay,paytm,...
[AI Chat Payment] Parsed patterns: 45
[AI Chat Payment] First 10: payment, checkout, razorpay, paytm, phonepe...
[AI Chat Payment] ✓ Final count: 58
[AI Chat Payment] 💾 Cached for 24 hours
```

### Cache Logs:
```
[AI Chat Payment] ✓ Using cached payment patterns: 58 patterns
[AI Chat Payment] Cache age: 120 minutes
```

### Error Logs:
```
[AI Chat Payment] ❌ Error: TypeError: Failed to fetch
[AI Chat Payment] Stack: [full stack trace]
[AI Chat Payment] Falling back to default patterns
```

## Example Region-Specific Patterns

### India:
- razorpay, paytm, phonepe, googlepay
- upi, bhim, mobikwik, freecharge
- airtel, jio, netbanking
- sbi, hdfc, icici, axis

### United States:
- stripe, square, braintree
- venmo, cashapp, zelle
- chase, bankofamerica, wellsfargo

### Europe:
- klarna, ideal, sofort
- sepa, bancontact, giropay
- revolut, n26, wise

### China:
- alipay, wechat, unionpay
- tenpay, jdpay, suning

## Fallback Mechanism

### Fallback Levels:
1. **Level 1**: NeoClaw AI (best, region-aware)
2. **Level 2**: Cached patterns (fast, recent)
3. **Level 3**: Default patterns (reliable, basic)

### When Fallback Triggers:
- ❌ NeoClaw not configured
- ❌ NeoClaw API error
- ❌ Empty/invalid response
- ❌ Network failure
- ❌ Parsing error

### Default Patterns:
```javascript
[
  'payment', 'checkout', 'billing', 'pay', 'cart',
  'stripe', 'paypal', 'razorpay', 'paytm', 'phonepe',
  'googlepay', 'amazonpay', 'worldpay', 'square',
  '/checkout', '/payment', '/billing', '/cart',
  'secure', 'transaction', 'order-confirmation'
]
```

## Performance Considerations

### API Calls:
- **First Load**: 1 API call to NeoClaw
- **Subsequent Loads**: 0 API calls (cached)
- **After 24 Hours**: 1 API call to refresh

### Response Time:
- **With Cache**: < 10ms (instant)
- **Without Cache**: ~500-2000ms (NeoClaw API call)
- **With Fallback**: < 1ms (defaults)

### Memory Usage:
- Storage: ~1-5KB per cached pattern list
- Minimal impact on extension performance

## Testing

### How to Test:

1. **Clear Cache:**
```javascript
// In browser console
chrome.storage.local.remove(['payment_patterns', 'payment_patterns_timestamp'])
```

2. **Reload Extension**

3. **Open Browser Console** (F12)

4. **Visit Any Page**

5. **Check Logs:**
```
Look for: [AI Chat Payment] logs
Check: Region detection
Check: API request and response
Check: Parsed patterns
```

6. **Visit Payment Page:**
```
Visit: stripe.com or regional payment gateway
Should see: Protection banner if pattern matches
```

### Manual Testing by Region:

**Test India Patterns:**
- Visit: razorpay.com, paytm.com, phonepe.com
- Should be detected as payment pages

**Test US Patterns:**
- Visit: stripe.com, square.com, venmo.com
- Should be detected as payment pages

**Test Europe Patterns:**
- Visit: klarna.com, ideal.nl
- Should be detected as payment pages

## Configuration

### No User Configuration Needed:
- ✅ Automatic region detection
- ✅ Automatic pattern fetching
- ✅ Automatic caching
- ✅ Automatic fallback

### Future Settings Option:
Could add to settings UI:
```
Region Override: [Auto-detect ▼]
  - Auto-detect (recommended)
  - United States
  - India
  - Europe
  - China
  - ...

☐ Force refresh payment patterns
```

## Troubleshooting

### Patterns Not Loading:
1. Check console for `[AI Chat Payment]` logs
2. Verify NeoClaw credentials in settings
3. Check if API call succeeded
4. Look for error messages

### Wrong Region Detected:
- Check browser language settings
- Check system timezone
- Manually override in future settings

### Missing Payment Sites:
- AI might not know very new services
- Default patterns provide baseline coverage
- Can be enhanced by training NeoClaw

## Future Enhancements

1. **User Feedback Loop:**
   - "Report missing payment site" button
   - User-submitted patterns

2. **Machine Learning:**
   - Learn from user's browsing history
   - Identify payment pages by content analysis

3. **Manual Override:**
   - User can add custom patterns
   - User can select region manually

4. **Real-time Updates:**
   - Shorter cache duration option
   - Push updates from server

5. **Pattern Analytics:**
   - Track which patterns most used
   - Optimize pattern list

## Security Considerations

### Privacy:
- ✅ Region detection is local (browser language/timezone)
- ✅ No personal data sent to NeoClaw
- ✅ Only receives pattern list
- ✅ Patterns cached locally

### Reliability:
- ✅ Fallback ensures protection always works
- ✅ Cache provides offline resilience
- ✅ Default patterns cover major gateways

## Conclusion

This dynamic, region-aware payment site detection significantly improves the screenshot protection feature by:
- Covering local/regional payment gateways
- Adapting to user's location
- Staying current with new payment services
- Maintaining reliability through caching and fallbacks

The comprehensive logging ensures easy debugging and monitoring of the feature's operation.
