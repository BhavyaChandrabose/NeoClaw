// Content script to block print screen on payment pages
console.log('[AI Chat Security] Payment page protection script loaded');

// Default payment gateway patterns (fallback)
const DEFAULT_PAYMENT_PATTERNS = [
  'payment', 'checkout', 'billing', 'pay', 'cart',
  'stripe', 'paypal', 'razorpay', 'paytm', 'phonepe',
  'googlepay', 'amazonpay', 'worldpay', 'square',
  '/checkout', '/payment', '/billing', '/cart',
  'secure', 'transaction', 'order-confirmation'
];

// Will be populated with region-specific patterns
let PAYMENT_PATTERNS = DEFAULT_PAYMENT_PATTERNS;

let isProtectionEnabled = false;
let permanentWatermark = null;
let lastScreenshotAttempt = 0;
let screenshotAttempts = 0;

// Load payment patterns from storage or fetch new ones
async function loadPaymentPatterns() {
  try {
    // Try to get cached patterns from storage
    const result = await chrome.storage.local.get(['payment_patterns', 'payment_patterns_timestamp']);
    
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    const timestamp = result.payment_patterns_timestamp || 0;
    
    // Use cached patterns if fresh (less than 24 hours old)
    if (result.payment_patterns && (now - timestamp) < oneDay) {
      PAYMENT_PATTERNS = result.payment_patterns;
      console.log('[AI Chat Security] Loaded cached payment patterns:', PAYMENT_PATTERNS.length, 'patterns');
      return;
    }
    
    // Request fresh patterns from background script
    console.log('[AI Chat Security] Requesting fresh payment patterns...');
    const response = await chrome.runtime.sendMessage({ type: 'GET_PAYMENT_PATTERNS' });
    
    if (response && response.success && response.patterns) {
      PAYMENT_PATTERNS = response.patterns;
      console.log('[AI Chat Security] Loaded fresh payment patterns:', PAYMENT_PATTERNS.length, 'patterns');
    } else {
      console.log('[AI Chat Security] Using default payment patterns');
      PAYMENT_PATTERNS = DEFAULT_PAYMENT_PATTERNS;
    }
  } catch (error) {
    console.error('[AI Chat Security] Error loading payment patterns:', error);
    PAYMENT_PATTERNS = DEFAULT_PAYMENT_PATTERNS;
  }
}

// Check if current page is a payment page
function isPaymentPage() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  
  return PAYMENT_PATTERNS.some(pattern => 
    url.includes(pattern) || title.includes(pattern)
  );
}

// Add permanent semi-transparent watermark
function addPermanentWatermark() {
  if (permanentWatermark) return;
  
  permanentWatermark = document.createElement('div');
  permanentWatermark.id = 'ai-chat-permanent-watermark';
  permanentWatermark.innerHTML = `
    <style>
      #ai-chat-permanent-watermark {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 2147483646;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 50px;
        padding: 50px;
      }
      .watermark-item {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: rgba(255, 0, 0, 0.15);
        font-weight: bold;
        transform: rotate(-45deg);
        font-family: Arial, sans-serif;
        text-align: center;
        line-height: 1.2;
      }
    </style>
  `;
  
  // Create 9 watermark items
  for (let i = 0; i < 9; i++) {
    const item = document.createElement('div');
    item.className = 'watermark-item';
    item.textContent = '🔒 PROTECTED\nSCREENSHOTS MONITORED';
    permanentWatermark.appendChild(item);
  }
  
  document.body.appendChild(permanentWatermark);
  console.log('[AI Chat Security] Permanent watermark applied');
}

// Show immediate full-screen block
function showScreenshotBlock() {
  const now = Date.now();
  screenshotAttempts++;
  
  console.log(`[AI Chat Security] Screenshot attempt #${screenshotAttempts} detected`);
  
  // Create a temporary full-screen block that lasts 5 seconds
  const blockOverlay = document.createElement('div');
  blockOverlay.className = 'ai-chat-screenshot-block';
  blockOverlay.innerHTML = `
    <style>
      .ai-chat-screenshot-block {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #000;
        color: #ff4444;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: blockFade 5s ease-out;
      }
      @keyframes blockFade {
        0% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
      .ai-chat-screenshot-block .icon {
        font-size: 100px;
        margin-bottom: 30px;
        animation: shake 0.5s ease-in-out infinite;
      }
      @keyframes shake {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
      .ai-chat-screenshot-block .title {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 20px;
        text-transform: uppercase;
      }
      .ai-chat-screenshot-block .message {
        font-size: 24px;
        color: #ff9999;
        margin-bottom: 10px;
      }
      .ai-chat-screenshot-block .counter {
        font-size: 18px;
        color: #ffcccc;
        margin-top: 20px;
      }
    </style>
    <div class="icon">⛔</div>
    <div class="title">SCREENSHOT BLOCKED</div>
    <div class="message">This payment page is protected</div>
    <div class="message">All attempts are being logged</div>
    <div class="counter">Attempt #${screenshotAttempts}</div>
  `;
  
  document.body.appendChild(blockOverlay);
  
  // Remove after 5 seconds
  setTimeout(() => {
    blockOverlay.remove();
  }, 5000);
  
  // Apply persistent blur to sensitive content
  applyPersistentBlur();
  
  lastScreenshotAttempt = now;
}

// Apply persistent blur to sensitive content
function applyPersistentBlur() {
  const sensitiveSelectors = [
    'input[type="text"]',
    'input[type="number"]',
    'input[type="password"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[autocomplete*="cc"]',
    '[class*="card"]',
    '[class*="cvv"]',
    '[class*="cvc"]',
    '[class*="payment"]',
    '[class*="credit"]',
    '[id*="card"]',
    '[id*="cvv"]',
    '[id*="cvc"]',
    '[id*="payment"]',
    '[id*="credit"]'
  ];
  
  sensitiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.filter = 'blur(10px)';
      el.setAttribute('data-protected-blur', 'true');
      
      // Remove blur after 10 seconds
      setTimeout(() => {
        el.style.filter = '';
        el.removeAttribute('data-protected-blur');
      }, 10000);
    });
  });
}

// Block print screen functionality
function blockPrintScreen() {
  if (isProtectionEnabled) {
    console.log('[AI Chat Security] Protection already enabled');
    return;
  }
  
  isProtectionEnabled = true;
  
  // Add permanent watermark
  addPermanentWatermark();
  
  // Prevent Print Screen key with visual feedback
  document.addEventListener('keyup', function(e) {
    if (e.key === 'PrintScreen') {
      console.log('[AI Chat Security] PrintScreen detected - showing block overlay');
      navigator.clipboard.writeText('🔒 SCREENSHOT BLOCKED - Payment page content is protected - All attempts are logged');
      showScreenshotBlock();
    }
  });

  // Prevent common screenshot combinations
  document.addEventListener('keydown', function(e) {
    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      e.stopPropagation();
      console.log('[AI Chat Security] PrintScreen keydown blocked');
      showScreenshotBlock();
      return false;
    }
    
    // Block Windows Snipping Tool (Win + Shift + S)
    if ((e.key === 's' || e.key === 'S') && e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      showScreenshotBlock();
      return false;
    }
  }, true); // Use capture phase

  // Detect when window loses focus (might indicate screenshot tool activation)
  let blurTimeout;
  window.addEventListener('blur', function() {
    console.log('[AI Chat Security] Window blur detected - potential screenshot tool');
    
    // Only trigger if not recently triggered
    const now = Date.now();
    if (now - lastScreenshotAttempt > 1000) {
      showScreenshotBlock();
    }
  });

  // Re-apply watermark if removed
  setInterval(() => {
    if (!document.getElementById('ai-chat-permanent-watermark')) {
      console.log('[AI Chat Security] Watermark removed - re-applying');
      permanentWatermark = null;
      addPermanentWatermark();
    }
  }, 2000);

  // Add visual indicator
  addSecurityBanner();
  
  // Continuous clipboard clearing
  setInterval(() => {
    if (isPaymentPage()) {
      navigator.clipboard.writeText('').catch(() => {});
    }
  }, 500);

  console.log('[AI Chat Security] Enhanced persistent print screen protection enabled');
}

// Add security banner to page
function addSecurityBanner() {
  if (document.getElementById('ai-chat-security-banner')) {
    return; // Banner already exists
  }
  
  const banner = document.createElement('div');
  banner.id = 'ai-chat-security-banner';
  banner.innerHTML = `
    <style>
      #ai-chat-security-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        text-align: center;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 999999;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      #ai-chat-security-banner .icon {
        font-size: 16px;
      }
      #ai-chat-security-banner .text {
        font-weight: 500;
      }
    </style>
    <span class="icon">🔒</span>
    <span class="text">Payment Page Protected - Screenshots Disabled for Your Security</span>
  `;
  
  document.body.appendChild(banner);
}

// Check settings and enable protection if needed
async function checkAndEnableProtection() {
  try {
    // First, load payment patterns
    await loadPaymentPatterns();
    
    // Get settings from background
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    
    if (response && response.success) {
      const settings = response.data;
      const protectionEnabled = settings.enablePaymentProtection !== false; // Default to true
      
      if (protectionEnabled && isPaymentPage()) {
        console.log('[AI Chat Security] Payment page detected and protection enabled in settings');
        blockPrintScreen();
      } else if (!protectionEnabled) {
        console.log('[AI Chat Security] Payment protection disabled in settings');
      } else {
        console.log('[AI Chat Security] Not a payment page, protection not needed');
      }
    }
  } catch (error) {
    console.error('[AI Chat Security] Error checking settings:', error);
  }
}

// Initialize
checkAndEnableProtection();

// Monitor for URL changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isPaymentPage() && !document.getElementById('ai-chat-security-banner')) {
      console.log('[AI Chat Security] Payment page detected after navigation');
      checkAndEnableProtection();
    }
  }
}).observe(document, { subtree: true, childList: true });
