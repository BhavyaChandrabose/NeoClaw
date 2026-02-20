// Payment patterns fetching logic
// This file contains functions to dynamically fetch payment site patterns based on user region

// Get payment patterns from NeoClaw based on user's region
async function getPaymentPatterns() {
  console.log('[AI Chat Payment] === Starting payment patterns fetch ===');
  
  // Default fallback patterns
  const defaultPatterns = [
    'payment', 'checkout', 'billing', 'pay', 'cart',
    'stripe', 'paypal', 'paytm', 'phonepe',
    'googlepay', 'amazonpay', 'worldpay', 'square',
    '/checkout', '/payment', '/billing', '/cart',
    'secure', 'transaction', 'order-confirmation'
  ];
  
  try {
    // Check cache first
    const cached = await chrome.storage.local.get(['payment_patterns', 'payment_patterns_timestamp']);
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    if (cached.payment_patterns && cached.payment_patterns_timestamp && 
        (now - cached.payment_patterns_timestamp) < oneDay) {
      console.log('[AI Chat Payment] ✓ Using cached payment patterns:', cached.payment_patterns.length, 'patterns');
      console.log('[AI Chat Payment] Cache age:', Math.round((now - cached.payment_patterns_timestamp) / 1000 / 60), 'minutes');
      return cached.payment_patterns;
    }
    
    console.log('[AI Chat Payment] Cache expired or not found, fetching fresh patterns...');
    
    // Get user's region
    const region = await detectUserRegion();
    console.log('[AI Chat Payment] 🌍 Detected region:', region);
    
    // Get NeoClaw credentials
    const { ai_settings } = await chrome.storage.local.get('ai_settings');
    const neoClawUrl = ai_settings?.neoClawUrl;
    const neoClawToken = ai_settings?.neoClawToken;
    
    console.log('[AI Chat Payment] NeoClaw URL:', neoClawUrl || 'NOT SET');
    console.log('[AI Chat Payment] NeoClaw Token:', neoClawToken ? 'SET (length: ' + neoClawToken.length + ')' : 'NOT SET');
    
    if (!neoClawUrl || !neoClawToken) {
      console.log('[AI Chat Payment] ⚠️ NeoClaw not configured, using default patterns');
      return defaultPatterns;
    }
    
    // Build prompt for NeoClaw
    const prompt = `List payment gateway and financial website keywords/patterns commonly used in ${region}. Include:
1. International payment gateways (PayPal, Stripe, etc.)
2. Regional/local payment gateways specific to ${region}
3. Common URL patterns for checkout/payment pages
4. Banking and financial service keywords

Return ONLY a comma-separated list of lowercase keywords and URL patterns (no explanations).

Example format: payment,checkout,billing,stripe,paypal,razorpay,paytm

Region: ${region}
List:`;

    console.log('[AI Chat Payment] 📤 Sending request to NeoClaw...');
    console.log('[AI Chat Payment] Endpoint:', `${neoClawUrl}/v1/responses`);
    console.log('[AI Chat Payment] Prompt length:', prompt.length, 'characters');
    
    const requestBody = {
      model: 'openclaw',
      stream: false,
      input: [{
        type: 'message',
        role: 'user',
        content: prompt
      }]
    };
    
    console.log('[AI Chat Payment] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${neoClawUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('[AI Chat Payment] 📥 Response received');
    console.log('[AI Chat Payment] Status:', response.status, response.statusText);
    console.log('[AI Chat Payment] Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Chat Payment] ❌ API Error Response:', errorText);
      console.log('[AI Chat Payment] Using default patterns due to API error');
      return defaultPatterns;
    }
    
    const data = await response.json();
    console.log('[AI Chat Payment] 📋 Full API Response:', JSON.stringify(data, null, 2));
    
    const responseText = data?.output?.[0]?.content?.[0]?.text?.trim() || '';
    console.log('[AI Chat Payment] Extracted text:', responseText);
    console.log('[AI Chat Payment] Text length:', responseText.length, 'characters');
    
    if (!responseText) {
      console.log('[AI Chat Payment] ⚠️ Empty response from NeoClaw, using default patterns');
      return defaultPatterns;
    }
    
    // Parse comma-separated list
    console.log('[AI Chat Payment] 🔍 Parsing response...');
    const patterns = responseText
      .toLowerCase()
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(p => p && p.length > 2)
      .filter(p => !/^(and|or|the|a|an|in|on|at|to|for)$/.test(p)); // Remove common words
    
    console.log('[AI Chat Payment] Parsed patterns count:', patterns.length);
    console.log('[AI Chat Payment] First 10 patterns:', patterns.slice(0, 10).join(', '));
    
    // Combine with default patterns and remove duplicates
    const combinedPatterns = [...new Set([...patterns, ...defaultPatterns])];
    
    console.log('[AI Chat Payment] ✓ Final combined patterns:', combinedPatterns.length, 'patterns');
    console.log('[AI Chat Payment] Region-specific additions:', patterns.filter(p => !defaultPatterns.includes(p)).slice(0, 15).join(', '));
    
    // Cache the patterns
    await chrome.storage.local.set({
      payment_patterns: combinedPatterns,
      payment_patterns_timestamp: now
    });
    
    console.log('[AI Chat Payment] 💾 Patterns cached for 24 hours');
    console.log('[AI Chat Payment] === Payment patterns fetch complete ===');
    
    return combinedPatterns;
    
  } catch (error) {
    console.error('[AI Chat Payment] ❌ Error fetching payment patterns:', error);
    console.error('[AI Chat Payment] Error name:', error.name);
    console.error('[AI Chat Payment] Error message:', error.message);
    console.error('[AI Chat Payment] Error stack:', error.stack);
    console.log('[AI Chat Payment] Falling back to default patterns');
    return defaultPatterns;
  }
}

// Detect user's region from browser
async function detectUserRegion() {
  try {
    // Try to get region from browser language settings
    const language = navigator.language || navigator.userLanguage || 'en-US';
    
    // Try to get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log('[AI Chat Payment] Browser language:', language);
    console.log('[AI Chat Payment] Browser timezone:', timezone);
    
    // Map common timezones/languages to regions
    let region = 'Global';
    
    if (language.startsWith('en-US') || timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles')) {
      region = 'United States';
    } else if (language.startsWith('en-IN') || timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta')) {
      region = 'India';
    } else if (language.startsWith('en-GB') || timezone.includes('Europe/London')) {
      region = 'United Kingdom';
    } else if (timezone.includes('Europe/')) {
      region = 'Europe';
    } else if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Hong_Kong')) {
      region = 'China/Hong Kong';
    } else if (timezone.includes('Asia/Tokyo')) {
      region = 'Japan';
    } else if (timezone.includes('Asia/Singapore')) {
      region = 'Singapore';
    } else if (timezone.includes('Australia/')) {
      region = 'Australia';
    } else if (timezone.includes('America/Sao_Paulo')) {
      region = 'Brazil';
    } else if (timezone.includes('Asia/Dubai')) {
      region = 'UAE/Middle East';
    }
    
    console.log('[AI Chat Payment] Detected region:', region);
    return region;
  } catch (error) {
    console.error('[AI Chat Payment] Error detecting region:', error);
    return 'Global';
  }
}
