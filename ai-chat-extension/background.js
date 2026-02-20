// AI Chat Extension - Background Service Worker
console.log('[AI Chat] Background service worker initializing...');

// Memory storage keys
const STORAGE_KEYS = {
  CHAT_MESSAGES: 'ai_chat_messages',
  MEMORIES: 'ai_memories',
  SETTINGS: 'ai_settings',
  BLOCKED_SITES: 'ai_blocked_sites'
};

// Default settings
const DEFAULT_SETTINGS = {
  enableHistory: true,
  enableBookmarks: true,
  enableTabs: true,
  autoDeleteDays: 30,
  neverRememberBanking: true,
  excludeWorkTabs: false,
  maxMemories: 1000,
  neoClawUrl: 'https://ai-hacker-neoclaw.securebrowser.com',
  neoClawToken: 'kOwC16C2Y6vhu1RrLz2s7wwpJAFfBwPhCcIZ8ym8nSWsgooF',
  enablePaymentProtection: true
};

// Banking site patterns
const BANKING_PATTERNS = [
  'bank', 'banking', 'chase', 'wellsfargo', 'bofa', 'citibank',
  'paypal', 'venmo', 'stripe', 'payment', 'wallet'
];

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[AI Chat] Extension installed');
  
  // Initialize settings
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  if (!ai_settings) {
    await chrome.storage.local.set({ ai_settings: DEFAULT_SETTINGS });
  }
  
  // Initialize empty memories
  const { ai_memories } = await chrome.storage.local.get('ai_memories');
  if (!ai_memories) {
    await chrome.storage.local.set({ ai_memories: [] });
  }
  
  // Start auto-cleanup scheduler
  scheduleAutoCleanup();
  
  // Start monitoring browser history for blocked sites
  startBlockedSitesMonitor();
  
  // Clean up existing blocked sites from history on install
  await cleanupBlockedSitesFromHistory();
});

// Also start monitor when extension starts (not just on install)
chrome.runtime.onStartup.addListener(async () => {
  console.log('[AI Chat] Extension starting up...');
  startBlockedSitesMonitor();
  
  // Clean up any blocked sites that may have accumulated
  await cleanupBlockedSitesFromHistory();
});

// Monitor browser history and remove blocked sites
function startBlockedSitesMonitor() {
  console.log('[AI Chat] Starting blocked sites monitor...');
  
  // Listen for new history visits
  chrome.history.onVisited.addListener(async (historyItem) => {
    const { ai_blocked_sites } = await chrome.storage.local.get('ai_blocked_sites');
    const blockedSites = ai_blocked_sites || [];
    
    if (blockedSites.length === 0) return;
    
    // Check if the visited URL matches any blocked pattern
    const isBlocked = blockedSites.some(pattern => 
      historyItem.url.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isBlocked) {
      // Immediately remove from browser history
      await chrome.history.deleteUrl({ url: historyItem.url });
      console.log('[AI Chat] 🚫 Blocked site removed from history:', historyItem.url);
    }
  });
  
  console.log('[AI Chat] Blocked sites monitor active');
}

// Clean up existing blocked sites from browser history
async function cleanupBlockedSitesFromHistory() {
  const { ai_blocked_sites } = await chrome.storage.local.get('ai_blocked_sites');
  const blockedSites = ai_blocked_sites || [];
  
  if (blockedSites.length === 0) return;
  
  console.log('[AI Chat] Cleaning up blocked sites from existing history...');
  
  // Search entire history
  const allHistory = await new Promise(resolve => {
    chrome.history.search({ text: '', maxResults: 10000 }, resolve);
  });
  
  let deletedCount = 0;
  
  for (const item of allHistory) {
    const isBlocked = blockedSites.some(pattern => 
      item.url.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isBlocked) {
      await chrome.history.deleteUrl({ url: item.url });
      deletedCount++;
      console.log('[AI Chat] Removed blocked site from history:', item.url);
    }
  }
  
  console.log(`[AI Chat] Cleanup complete: ${deletedCount} blocked sites removed from history`);
  return deletedCount;
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AI Chat] Received message:', message.type);
  
  (async () => {
    try {
      switch (message.type) {
        case 'GET_MEMORIES':
          const memories = await getMemories(message.filters);
          sendResponse({ success: true, data: memories });
          break;
          
        case 'ADD_MEMORY':
          await addMemory(message.memory);
          sendResponse({ success: true });
          break;
          
        case 'DELETE_MEMORY':
          await deleteMemory(message.id);
          sendResponse({ success: true });
          break;
          
        case 'DELETE_BY_TOPIC':
          const deleteResult = await deleteByTopic(message.topic);
          sendResponse({ success: true, data: deleteResult });
          break;
          
        case 'DELETE_BY_TIME_RANGE':
          await deleteByTimeRange(message.startTime, message.endTime);
          sendResponse({ success: true });
          break;
          
        case 'GET_SETTINGS':
          const settings = await getSettings();
          sendResponse({ success: true, data: settings });
          break;
          
        case 'UPDATE_SETTINGS':
          await updateSettings(message.settings);
          sendResponse({ success: true });
          break;
          
        case 'GET_CONTEXT':
          const context = await gatherContext();
          sendResponse({ success: true, data: context });
          break;
          
        case 'SEND_CHAT':
          // Simulate AI response (you can integrate real AI API here)
          const response = await handleChat(message.message);
          sendResponse({ success: true, data: response });
          break;
          
        case 'TEST_CONNECTION':
          const testResult = await testNeoClawConnection();
          sendResponse(testResult);
          break;
          
        case 'CLEANUP_BLOCKED_SITES':
          const cleanupCount = await cleanupBlockedSitesFromHistory();
          sendResponse({ success: true, deleted: cleanupCount });
          break;
          
        case 'GET_PAYMENT_PATTERNS':
          const patterns = await getPaymentPatterns();
          sendResponse({ success: true, patterns: patterns });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[AI Chat] Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep channel open for async response
});

// Get memories with filters
async function getMemories(filters = {}) {
  const { ai_memories } = await chrome.storage.local.get('ai_memories');
  let memories = ai_memories || [];
  
  // Apply filters
  if (filters.source) {
    memories = memories.filter(m => m.source === filters.source);
  }
  
  if (filters.topic) {
    memories = memories.filter(m => 
      m.topic?.toLowerCase().includes(filters.topic.toLowerCase())
    );
  }
  
  if (filters.startTime && filters.endTime) {
    memories = memories.filter(m => 
      m.timestamp >= filters.startTime && m.timestamp <= filters.endTime
    );
  }
  
  return memories.sort((a, b) => b.timestamp - a.timestamp);
}

// Extract topic from content using LLM or simple analysis
async function extractTopicFromContent(content) {
  // Fallback to simple keyword extraction if LLM fails
  const fallbackTopic = extractTopicFromKeywords(content);
  
  try {
    const { ai_settings } = await chrome.storage.local.get('ai_settings');
    const neoClawUrl = ai_settings?.neoClawUrl;
    const neoClawToken = ai_settings?.neoClawToken;
    
    // If no LLM configured, use fallback
    if (!neoClawUrl || !neoClawToken) {
      console.log('[AI Chat] No LLM configured, using keyword-based topic:', fallbackTopic);
      return fallbackTopic;
    }
    
    // Use LLM to extract topic
    const prompt = `Analyze this text and identify its main topic/subject in 1-3 words. Be specific but concise.

Examples:
- "How do I install Python?" → "programming"
- "What's a good recipe for pasta?" → "cooking"
- "Tell me about the Roman Empire" → "history"
- "How to fix my car engine" → "automotive"
- "Best hotels in Paris" → "travel"

Text: "${content.substring(0, 500)}"

Main topic (1-3 words):`;

    const response = await fetch(`${neoClawUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main'
      },
      body: JSON.stringify({
        model: 'openclaw',
        stream: false,
        input: [{
          type: 'message',
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      console.log('[AI Chat] LLM topic extraction failed, using fallback:', fallbackTopic);
      return fallbackTopic;
    }
    
    const data = await response.json();
    const extractedTopic = data?.output?.[0]?.content?.[0]?.text?.trim()?.toLowerCase() || fallbackTopic;
    
    // Clean up the extracted topic (remove quotes, extra words)
    const cleanedTopic = extractedTopic
      .replace(/['"]/g, '')
      .replace(/^(the |a |an )/i, '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    
    console.log('[AI Chat] LLM extracted topic:', cleanedTopic);
    return cleanedTopic || fallbackTopic;
    
  } catch (error) {
    console.log('[AI Chat] Error extracting topic with LLM:', error.message, '- using fallback:', fallbackTopic);
    return fallbackTopic;
  }
}

// Simple keyword-based topic extraction (fallback)
function extractTopicFromKeywords(content) {
  const text = content.toLowerCase();
  
  // Programming keywords
  if (/(python|javascript|java|code|programming|function|api|debug|git|npm)/i.test(text)) {
    return 'programming';
  }
  
  // Food/cooking keywords
  if (/(recipe|cook|food|restaurant|meal|ingredient|cuisine)/i.test(text)) {
    return 'cooking';
  }
  
  // Travel keywords
  if (/(travel|hotel|flight|vacation|trip|visit|tourism|destination)/i.test(text)) {
    return 'travel';
  }
  
  // Health keywords
  if (/(health|doctor|medical|medicine|fitness|workout|exercise)/i.test(text)) {
    return 'health';
  }
  
  // Finance keywords
  if (/(money|bank|invest|stock|finance|budget|payment|credit)/i.test(text)) {
    return 'finance';
  }
  
  // Education keywords
  if (/(learn|study|school|university|course|education|tutorial)/i.test(text)) {
    return 'education';
  }
  
  // Entertainment keywords
  if (/(movie|music|game|tv|show|entertainment|play|watch)/i.test(text)) {
    return 'entertainment';
  }
  
  // News/current events
  if (/(news|current|event|politics|election|government)/i.test(text)) {
    return 'news';
  }
  
  // Shopping keywords
  if (/(buy|shop|purchase|product|price|amazon|store)/i.test(text)) {
    return 'shopping';
  }
  
  // Default to 'general'
  return 'general';
}

// Add memory
async function addMemory(memory) {
  const settings = await getSettings();
  
  // Check if site is blocked
  if (settings.neverRememberBanking && isBankingSite(memory.site)) {
    console.log('[AI Chat] Blocked banking site:', memory.site);
    return;
  }
  
  const { ai_memories, ai_blocked_sites } = await chrome.storage.local.get([
    'ai_memories',
    'ai_blocked_sites'
  ]);
  
  const blockedSites = ai_blocked_sites || [];
  if (blockedSites.some(pattern => memory.site?.includes(pattern))) {
    console.log('[AI Chat] Blocked site:', memory.site);
    return;
  }
  
  const memories = ai_memories || [];
  
  const newMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...memory
  };
  
  memories.unshift(newMemory);
  
  // Limit to max memories
  if (memories.length > settings.maxMemories) {
    memories.splice(settings.maxMemories);
  }
  
  await chrome.storage.local.set({ ai_memories: memories });
  console.log('[AI Chat] Memory added:', newMemory.id);
}

// Delete memory
async function deleteMemory(id) {
  const { ai_memories } = await chrome.storage.local.get('ai_memories');
  const memories = (ai_memories || []).filter(m => m.id !== id);
  await chrome.storage.local.set({ ai_memories: memories });
  console.log('[AI Chat] Memory deleted:', id);
}

// Use LLM to check if memory belongs to topic
async function checkMemoryBelongsToTopic(memory, topic) {
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  const neoClawUrl = ai_settings?.neoClawUrl || '';
  const neoClawToken = ai_settings?.neoClawToken || '';
  
  // Fallback to simple string matching if LLM not configured
  if (!neoClawUrl || !neoClawToken) {
    console.log('[AI Chat] LLM not configured, using simple string matching');
    const topicLower = topic.toLowerCase().trim();
    return memory.topic && memory.topic.toLowerCase().includes(topicLower);
  }
  
  try {
    // Prepare memory content for LLM
    const memoryContent = typeof memory.content === 'string' 
      ? memory.content 
      : JSON.stringify(memory.content);
    
    const memoryDescription = `
Memory ID: ${memory.id}
Topic: ${memory.topic || 'none'}
Source: ${memory.source || 'unknown'}
Content: ${memoryContent.substring(0, 200)}${memoryContent.length > 200 ? '...' : ''}
Site: ${memory.site || 'unknown'}
`;

    // Ask LLM if memory belongs to topic/domain
    const prompt = `You are a memory content analyzer. Your job is to determine if a memory's CONTENT is about the subject/domain "${topic}".

${memoryDescription}

IMPORTANT: Focus on analyzing what the memory CONTENT is actually about, not just the stored "Topic" field. The stored Topic field is just a label (like "chat", "history", "bookmark"), but you need to analyze the semantic meaning of the actual content.

Question: Is the CONTENT of this memory about the subject/domain "${topic}"?

Analysis criteria:
1. PRIMARY: What is the memory content actually discussing?
2. Consider semantic similarity (e.g., "programming" includes "coding", "software development", "algorithms")
3. Consider related domains (e.g., "fitness" includes "exercise", "workout", "health", "gym")
4. Consider synonyms and contextually related terms
5. IGNORE the stored Topic field label - focus on content meaning

Examples:
- Topic field: "chat", Content: "Discussed Python coding" → Subject is "programming" ✓
- Topic field: "history", Content: "Visited GitHub repository" → Subject is "programming" ✓
- Topic field: "bookmark", Content: "Saved pasta recipe" → Subject is "cooking" ✓

Respond with ONLY "YES" or "NO" (nothing else).`;

    const response = await fetch(`${neoClawUrl}${NEOCLAW_CONFIG.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': NEOCLAW_CONFIG.agentId
      },
      body: JSON.stringify({
        model: NEOCLAW_CONFIG.model,
        stream: false,
        input: [{
          type: 'message',
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      console.warn('[AI Chat] LLM request failed, falling back to string matching');
      const topicLower = topic.toLowerCase().trim();
      return memory.topic && memory.topic.toLowerCase().includes(topicLower);
    }
    
    const data = await response.json();
    const aiResponse = data?.output?.[0]?.content?.[0]?.text || '';
    const answer = aiResponse.trim().toUpperCase();
    
    console.log(`[AI Chat] LLM classification for memory ${memory.id}: ${answer}`);
    return answer === 'YES' || answer.includes('YES');
    
  } catch (error) {
    console.error('[AI Chat] Error in LLM topic check:', error);
    // Fallback to simple string matching
    const topicLower = topic.toLowerCase().trim();
    return memory.topic && memory.topic.toLowerCase().includes(topicLower);
  }
}

// Batch check memories using LLM (more efficient)
async function batchCheckMemoriesByTopic(memories, topic) {
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  const neoClawUrl = ai_settings?.neoClawUrl || '';
  const neoClawToken = ai_settings?.neoClawToken || '';
  
  // Fallback to simple string matching if LLM not configured
  if (!neoClawUrl || !neoClawToken) {
    console.warn('[AI Chat] ⚠️ LLM not configured - falling back to simple string matching');
    console.warn('[AI Chat] For better results, configure NeoClaw credentials in Settings');
    const topicLower = topic.toLowerCase().trim();
    return memories.map(m => ({
      memory: m,
      matches: m.topic && m.topic.toLowerCase().includes(topicLower)
    }));
  }
  
  console.log('[AI Chat] ✓ LLM configured - using intelligent content analysis');
  
  try {
    // Prepare batch of memories for LLM
    const memoriesList = memories.map((m, idx) => {
      const memoryContent = typeof m.content === 'string' 
        ? m.content 
        : JSON.stringify(m.content);
      
      return `${idx + 1}. ID: ${m.id}
   Topic: ${m.topic || 'none'}
   Source: ${m.source}
   Content: ${memoryContent.substring(0, 150)}${memoryContent.length > 150 ? '...' : ''}`;
    }).join('\n\n');

    const prompt = `You are a memory content analyzer. Determine which memories have CONTENT about the subject/domain "${topic}".

MEMORIES:
${memoriesList}

IMPORTANT: Analyze what each memory's CONTENT is actually about, not just the stored "Topic" field. The stored Topic field is just a metadata label (like "chat", "history", "bookmark"). You need to understand the semantic meaning of the actual content.

Task: For each memory numbered 1-${memories.length}, determine if its CONTENT is about the subject/domain "${topic}".

Analysis criteria:
1. PRIMARY FOCUS: What is the actual content discussing?
2. Semantic similarity: "${topic}" includes related terms
   - Example: "programming" = coding, software development, algorithms, debugging, GitHub, etc.
   - Example: "cooking" = recipes, food preparation, baking, ingredients, kitchen, etc.
   - Example: "fitness" = exercise, workout, gym, health, training, sports, etc.
3. Domain relationships: Consider the broader domain
   - Example: "technology" includes programming, AI, hardware, software
   - Example: "entertainment" includes movies, music, games, TV shows
4. Synonyms and contextual terms
5. IGNORE stored Topic field - it's just a label, not the actual subject

Examples of correct analysis:
- Topic field: "chat", Content: "Discussed React components" → Domain is "programming" ✓
- Topic field: "history", Content: "Visited cooking blog" → Domain is "cooking" ✓
- Topic field: "bookmark", Content: "Saved gym workout plan" → Domain is "fitness" ✓

Respond with ONLY a comma-separated list of numbers for memories whose CONTENT is about "${topic}" (e.g., "1,3,5" or "2,4,6,7").
If no memories are about "${topic}", respond with "NONE".
Do not include any other text or explanation.`;

    console.log('[AI Chat] Sending batch request to LLM for', memories.length, 'memories');
    console.log('[AI Chat] Search term:', topic);
    console.log('[AI Chat] NeoClaw URL:', neoClawUrl);
    console.log('[AI Chat] Token present:', !!neoClawToken);
    console.log('[AI Chat] Full endpoint:', `${neoClawUrl}${NEOCLAW_CONFIG.chatEndpoint}`);
    console.log('[AI Chat] Batch content preview:', memoriesList.substring(0, 300) + '...');
    
    const requestPayload = {
      model: NEOCLAW_CONFIG.model,
      stream: false,
      input: [{
        type: 'message',
        role: 'user',
        content: prompt
      }]
    };
    
    console.log('[AI Chat] Request payload:', JSON.stringify(requestPayload, null, 2).substring(0, 500));
    
    const response = await fetch(`${neoClawUrl}${NEOCLAW_CONFIG.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': NEOCLAW_CONFIG.agentId
      },
      body: JSON.stringify(requestPayload)
    });
    
    console.log('[AI Chat] Fetch completed, status:', response.status);
    
    if (!response.ok) {
      console.error('[AI Chat] LLM request failed with status:', response.status);
      const errorText = await response.text();
      console.error('[AI Chat] Error response:', errorText);
      throw new Error(`LLM request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data?.output?.[0]?.content?.[0]?.text || '';
    const answer = aiResponse.trim().toUpperCase();
    
    console.log('[AI Chat] LLM batch response:', answer);
    console.log('[AI Chat] Full LLM response object:', data);
    
    // Parse the response
    let matchingIndices = new Set();
    if (answer !== 'NONE') {
      const numbers = answer.match(/\d+/g) || [];
      matchingIndices = new Set(numbers.map(n => parseInt(n) - 1)); // Convert to 0-based index
    }
    
    // Map results back to memories
    const results = memories.map((m, idx) => ({
      memory: m,
      matches: matchingIndices.has(idx)
    }));
    
    const matchCount = results.filter(r => r.matches).length;
    console.log(`[AI Chat] LLM found ${matchCount}/${memories.length} memories matching topic "${topic}"`);
    
    return results;
    
  } catch (error) {
    console.error('[AI Chat] ❌ Error in batch LLM topic check:', error);
    console.error('[AI Chat] Error details:', error.stack);
    console.warn('[AI Chat] Falling back to simple string matching due to error');
    // Fallback to simple string matching
    const topicLower = topic.toLowerCase().trim();
    return memories.map(m => ({
      memory: m,
      matches: m.topic && m.topic.toLowerCase().includes(topicLower)
    }));
  }
}

// Delete by topic (using LLM for intelligent matching)
async function deleteByTopic(topic) {
  if (!topic || typeof topic !== 'string') {
    console.error('[AI Chat] Invalid topic provided:', topic);
    throw new Error('Invalid topic provided');
  }
  
  const { ai_memories } = await chrome.storage.local.get('ai_memories');
  const allMemories = ai_memories || [];
  
  console.log('[AI Chat] Delete by topic/domain request:', topic);
  console.log('[AI Chat] Total memories before:', allMemories.length);
  
  // Show sample memory details for debugging
  if (allMemories.length > 0) {
    console.log('[AI Chat] Sample memory details:');
    allMemories.slice(0, 3).forEach(m => {
      const contentPreview = typeof m.content === 'string' 
        ? m.content.substring(0, 100) 
        : JSON.stringify(m.content).substring(0, 100);
      console.log(`  - ID: ${m.id}`);
      console.log(`    Topic label: "${m.topic}"`);
      console.log(`    Source: ${m.source}`);
      console.log(`    Content preview: "${contentPreview}..."`);
      console.log(`    Site: ${m.site}`);
    });
  }
  
  console.log('[AI Chat] Using LLM-based semantic content analysis (analyzing what memories are ABOUT, not just topic labels)');
  
  if (allMemories.length === 0) {
    console.log('[AI Chat] No memories to delete');
    return { deleted: 0, remaining: 0 };
  }
  
  // Use batch LLM checking for efficiency
  const batchSize = 20; // Process in batches to avoid token limits
  const allResults = [];
  
  for (let i = 0; i < allMemories.length; i += batchSize) {
    const batch = allMemories.slice(i, i + batchSize);
    console.log(`[AI Chat] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allMemories.length / batchSize)}`);
    
    const batchResults = await batchCheckMemoriesByTopic(batch, topic);
    allResults.push(...batchResults);
  }
  
  // Separate matching and non-matching memories
  const matchingMemories = allResults.filter(r => r.matches).map(r => r.memory);
  const remainingMemories = allResults.filter(r => !r.matches).map(r => r.memory);
  
  console.log('[AI Chat] LLM identified', matchingMemories.length, 'memories about', topic);
  console.log('[AI Chat] Deleted memory IDs:', matchingMemories.map(m => m.id));
  console.log('[AI Chat] Sample deleted content:', matchingMemories.slice(0, 3).map(m => ({
    id: m.id,
    topicLabel: m.topic,
    contentPreview: typeof m.content === 'string' ? m.content.substring(0, 100) : JSON.stringify(m.content).substring(0, 100)
  })));
  
  // Save remaining memories
  await chrome.storage.local.set({ ai_memories: remainingMemories });
  
  // Verify the deletion
  const { ai_memories: verifyMemories } = await chrome.storage.local.get('ai_memories');
  console.log('[AI Chat] Verification - memories in storage after delete:', verifyMemories.length);
  console.log('[AI Chat] Successfully deleted', matchingMemories.length, 'memories about:', topic);
  
  return {
    deleted: matchingMemories.length,
    remaining: remainingMemories.length,
    deletedIds: matchingMemories.map(m => m.id)
  };
}

// Delete by time range
async function deleteByTimeRange(startTime, endTime) {
  const { ai_memories } = await chrome.storage.local.get('ai_memories');
  const memories = (ai_memories || []).filter(m => 
    m.timestamp < startTime || m.timestamp > endTime
  );
  await chrome.storage.local.set({ ai_memories: memories });
  console.log('[AI Chat] Deleted memories in range:', new Date(startTime), '-', new Date(endTime));
}

// Get settings
async function getSettings() {
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  return ai_settings || DEFAULT_SETTINGS;
}

// Update settings
async function updateSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  await chrome.storage.local.set({ ai_settings: updated });
  console.log('[AI Chat] Settings updated');
}

// Check if banking site
function isBankingSite(url) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return BANKING_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

// Check if site is in blocked list
async function isBlockedSite(url) {
  if (!url) return false;
  const { ai_blocked_sites } = await chrome.storage.local.get('ai_blocked_sites');
  const blockedSites = ai_blocked_sites || [];
  return blockedSites.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()));
}

// Get payment patterns from NeoClaw based on user's region
async function getPaymentPatterns() {
  console.log('[AI Chat Payment] === Starting payment patterns fetch ===');
  
  const defaultPatterns = [
    'payment', 'checkout', 'billing', 'pay', 'cart',
    'stripe', 'paypal', 'razorpay', 'paytm', 'phonepe',
    'googlepay', 'amazonpay', 'worldpay', 'square',
    '/checkout', '/payment', '/billing', '/cart',
    'secure', 'transaction', 'order-confirmation'
  ];
  
  try {
    const cached = await chrome.storage.local.get(['payment_patterns', 'payment_patterns_timestamp']);
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (cached.payment_patterns && cached.payment_patterns_timestamp && 
        (now - cached.payment_patterns_timestamp) < oneDay) {
      console.log('[AI Chat Payment] ✓ Using cached payment patterns:', cached.payment_patterns.length, 'patterns');
      return cached.payment_patterns;
    }
    
    console.log('[AI Chat Payment] Fetching fresh patterns...');
    
    const region = await detectUserRegion();
    console.log('[AI Chat Payment] 🌍 Detected region:', region);
    
    const { ai_settings } = await chrome.storage.local.get('ai_settings');
    const neoClawUrl = ai_settings?.neoClawUrl;
    const neoClawToken = ai_settings?.neoClawToken;
    
    console.log('[AI Chat Payment] NeoClaw URL:', neoClawUrl || 'NOT SET');
    console.log('[AI Chat Payment] Token:', neoClawToken ? 'SET (length: ' + neoClawToken.length + ')' : 'NOT SET');
    
    if (!neoClawUrl || !neoClawToken) {
      console.log('[AI Chat Payment] ⚠️ Using default patterns');
      return defaultPatterns;
    }
    
    const prompt = `List payment gateway and financial website keywords/patterns commonly used in ${region}. Include:
1. International payment gateways (PayPal, Stripe, etc.)
2. Regional/local payment gateways specific to ${region}
3. Common URL patterns for checkout/payment pages
4. Banking and financial service keywords

Return ONLY a comma-separated list of lowercase keywords and URL patterns (no explanations).
Example: payment,checkout,billing,stripe,paypal,razorpay,paytm

Region: ${region}
List:`;

    console.log('[AI Chat Payment] 📤 Sending request...');
    
    const requestBody = {
      model: 'openclaw',
      stream: false,
      input: [{ type: 'message', role: 'user', content: prompt }]
    };
    
    console.log('[AI Chat Payment] Request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${neoClawUrl}/v1/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('[AI Chat Payment] 📥 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Chat Payment] ❌ API Error:', errorText);
      return defaultPatterns;
    }
    
    const data = await response.json();
    console.log('[AI Chat Payment] 📋 Full Response:', JSON.stringify(data, null, 2));
    
    const responseText = data?.output?.[0]?.content?.[0]?.text?.trim() || '';
    console.log('[AI Chat Payment] Extracted text:', responseText);
    
    if (!responseText) {
      console.log('[AI Chat Payment] ⚠️ Empty response');
      return defaultPatterns;
    }
    
    const patterns = responseText
      .toLowerCase()
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(p => p && p.length > 2)
      .filter(p => !/^(and|or|the|a|an|in|on|at|to|for)$/.test(p));
    
    console.log('[AI Chat Payment] Parsed patterns:', patterns.length);
    console.log('[AI Chat Payment] First 10:', patterns.slice(0, 10).join(', '));
    
    const combinedPatterns = [...new Set([...patterns, ...defaultPatterns])];
    console.log('[AI Chat Payment] ✓ Final count:', combinedPatterns.length);
    
    await chrome.storage.local.set({
      payment_patterns: combinedPatterns,
      payment_patterns_timestamp: now
    });
    
    console.log('[AI Chat Payment] 💾 Cached for 24 hours');
    return combinedPatterns;
    
  } catch (error) {
    console.error('[AI Chat Payment] ❌ Error:', error.name, error.message);
    console.error('[AI Chat Payment] Stack:', error.stack);
    return defaultPatterns;
  }
}

// Detect user's region
async function detectUserRegion() {
  try {
    const language = navigator.language || 'en-US';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log('[AI Chat Payment] Language:', language, 'Timezone:', timezone);
    
    let region = 'Global';
    
    if (language.startsWith('en-US') || timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles')) {
      region = 'United States';
    } else if (language.startsWith('en-IN') || timezone.includes('Asia/Kolkata')) {
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
    
    return region;
  } catch (error) {
    console.error('[AI Chat Payment] Region detection error:', error);
    return 'Global';
  }
}

// Gather context for AI
async function gatherContext() {
  const settings = await getSettings();
  const { ai_blocked_sites } = await chrome.storage.local.get('ai_blocked_sites');
  const blockedSites = ai_blocked_sites || [];
  
  const context = {
    history: [],
    bookmarks: [],
    tabs: [],
    memories: []
  };
  
  // Get recent history
  if (settings.enableHistory) {
    const historyItems = await new Promise(resolve => {
      chrome.history.search({ text: '', maxResults: 20 }, resolve);
    });
    context.history = historyItems
      .filter(item => {
        // Filter banking sites
        if (settings.neverRememberBanking && isBankingSite(item.url)) {
          return false;
        }
        // Filter blocked sites
        if (blockedSites.some(pattern => item.url?.toLowerCase().includes(pattern.toLowerCase()))) {
          console.log('[AI Chat] Filtered blocked site from history:', item.url);
          return false;
        }
        return true;
      })
      .map(item => ({
        title: item.title,
        url: item.url,
        visitCount: item.visitCount,
        lastVisitTime: item.lastVisitTime
      }));
  }
  
  // Get bookmarks
  if (settings.enableBookmarks) {
    const bookmarks = await chrome.bookmarks.getTree();
    context.bookmarks = extractBookmarks(bookmarks[0], blockedSites);
  }
  
  // Get open tabs
  if (settings.enableTabs) {
    const tabs = await chrome.tabs.query({});
    context.tabs = tabs
      .filter(tab => {
        // Filter banking sites
        if (settings.neverRememberBanking && isBankingSite(tab.url)) {
          return false;
        }
        // Filter blocked sites
        if (blockedSites.some(pattern => tab.url?.toLowerCase().includes(pattern.toLowerCase()))) {
          console.log('[AI Chat] Filtered blocked site from tabs:', tab.url);
          return false;
        }
        return true;
      })
      .map(tab => ({
        title: tab.title,
        url: tab.url,
        active: tab.active
      }));
  }
  
  // Get memories
  context.memories = await getMemories();
  
  return context;
}

// Extract bookmarks recursively
function extractBookmarks(node, blockedSites = [], bookmarks = []) {
  if (node.url) {
    // Check if URL should be blocked
    const isBlocked = blockedSites.some(pattern => 
      node.url.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (!isBlocked) {
      bookmarks.push({ title: node.title, url: node.url });
    } else {
      console.log('[AI Chat] Filtered blocked site from bookmarks:', node.url);
    }
  }
  if (node.children) {
    node.children.forEach(child => extractBookmarks(child, blockedSites, bookmarks));
  }
  return bookmarks;
}

// NeoClaw AI Integration
const NEOCLAW_CONFIG = {
  chatEndpoint: '/v1/responses',
  agentId: 'main',
  model: 'openclaw'
};

// Test NeoClaw connection
async function testNeoClawConnection() {
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  const neoClawUrl = ai_settings?.neoClawUrl || '';
  const neoClawToken = ai_settings?.neoClawToken || '';
  
  console.log('[AI Chat] Testing NeoClaw connection...');
  console.log('[AI Chat] URL:', neoClawUrl);
  console.log('[AI Chat] Token present:', !!neoClawToken);
  console.log('[AI Chat] Full endpoint:', `${neoClawUrl}${NEOCLAW_CONFIG.chatEndpoint}`);
  
  if (!neoClawUrl || !neoClawToken) {
    console.error('[AI Chat] ❌ Missing credentials');
    return { success: false, error: 'Missing credentials' };
  }
  
  try {
    const testPayload = {
      model: NEOCLAW_CONFIG.model,
      stream: false,
      input: [{
        type: 'message',
        role: 'user',
        content: 'ping'
      }]
    };
    
    console.log('[AI Chat] Sending test request...');
    
    const response = await fetch(`${neoClawUrl}${NEOCLAW_CONFIG.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': NEOCLAW_CONFIG.agentId
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('[AI Chat] Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[AI Chat] ✅ Connection successful!');
      console.log('[AI Chat] Response:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('[AI Chat] ❌ Connection failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('[AI Chat] ❌ Connection error:', error);
    return { success: false, error: error.message };
  }
}

// Call this on startup to verify connection
chrome.runtime.onStartup.addListener(async () => {
  console.log('[AI Chat] Service worker starting up, testing connection...');
  await testNeoClawConnection();
});

// Handle chat message with NeoClaw AI
async function handleChat(userMessage) {
  const context = await gatherContext();
  const settings = await getSettings();
  
// Store user message as memory
  await addMemory({
    type: 'chat',
    source: 'user',
    content: userMessage,
    site: 'AI Chat',
    topic: await extractTopicFromContent(userMessage)
  });
  
  // Get auth credentials
  const { ai_settings } = await chrome.storage.local.get('ai_settings');
  const neoClawUrl = ai_settings?.neoClawUrl || '';
  const neoClawToken = ai_settings?.neoClawToken || '';
  
  if (!neoClawUrl || !neoClawToken) {
    const fallbackResponse = `I'm not connected to NeoClaw AI yet. Please set your NeoClaw credentials in Settings.\n\nI can still see your context: ${context.history.length} history items, ${context.tabs.length} tabs, ${context.memories.length} memories.`;
    
    await addMemory({
      type: 'chat',
      source: 'ai',
      content: fallbackResponse,
      site: 'AI Chat',
      topic: 'general'
    });
    
    return {
      message: fallbackResponse,
      context: {
        historyCount: context.history.length,
        tabsCount: context.tabs.length,
        memoriesCount: context.memories.length
      }
    };
  }
  
  try {
    // Build context message for AI
    const contextMessage = buildContextMessage(context);
    
    // Prepare messages for NeoClaw
    const messages = [
      {
        type: 'message',
        role: 'system',
        content: contextMessage
      },
      {
        type: 'message',
        role: 'user',
        content: userMessage
      }
    ];
    
    // Call NeoClaw API
    const response = await fetch(`${neoClawUrl}${NEOCLAW_CONFIG.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neoClawToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': NEOCLAW_CONFIG.agentId
      },
      body: JSON.stringify({
        model: NEOCLAW_CONFIG.model,
        stream: false,
        input: messages
      })
    });
    
    if (!response.ok) {
      throw new Error(`NeoClaw API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[AI Chat] NeoClaw full response:', data);
    
    // Extract AI response from NeoClaw format
    let aiResponse = '';
    
    try {
      // Direct extraction: data.output[0].content[0].text
      if (data && data.output && data.output[0] && data.output[0].content && data.output[0].content[0]) {
        aiResponse = data.output[0].content[0].text || '';
        console.log('[AI Chat] Successfully extracted text:', aiResponse.substring(0, 100) + '...');
      } else {
        console.error('[AI Chat] Response structure unexpected:', {
          hasData: !!data,
          hasOutput: !!(data && data.output),
          outputLength: data && data.output ? data.output.length : 0,
          firstOutput: data && data.output && data.output[0]
        });
        aiResponse = '';
      }
      
      if (!aiResponse || aiResponse.trim() === '') {
        console.warn('[AI Chat] No text extracted from response');
        aiResponse = 'Received response from NeoClaw but could not parse it. Check console for details.';
      }
    } catch (parseError) {
      console.error('[AI Chat] Error parsing response:', parseError);
      aiResponse = `Error parsing NeoClaw response: ${parseError.message}`;
    }
    
    // Store AI response as memory
    await addMemory({
      type: 'chat',
      source: 'ai',
      content: aiResponse,
      site: 'AI Chat',
      topic: await extractTopicFromContent(aiResponse)
    });
    
    return {
      message: aiResponse,
      context: {
        historyCount: context.history.length,
        tabsCount: context.tabs.length,
        memoriesCount: context.memories.length
      }
    };
    
  } catch (error) {
    console.error('[AI Chat] NeoClaw error:', error);
    
    const errorResponse = `Error connecting to NeoClaw: ${error.message}\n\nYou can still view your context: ${context.history.length} history items, ${context.tabs.length} tabs.`;
    
    await addMemory({
      type: 'chat',
      source: 'ai',
      content: errorResponse,
      site: 'AI Chat',
      topic: 'error'
    });
    
    return {
      message: errorResponse,
      context: {
        historyCount: context.history.length,
        tabsCount: context.tabs.length,
        memoriesCount: context.memories.length
      }
    };
  }
}

// Build context message for AI
function buildContextMessage(context) {
  let message = "You are an AI assistant with access to the user's browsing context. Use this information to provide helpful responses.\n\n";
  
  try {
    if (context.history && context.history.length > 0) {
      message += `📜 RECENT HISTORY (${context.history.length} items):\n`;
      context.history.slice(0, 10).forEach(item => {
        if (item && item.title) {
          message += `- ${item.title} (${item.url || ''})\n`;
        }
      });
      message += '\n';
    }
    
    if (context.tabs && context.tabs.length > 0) {
      message += `📑 OPEN TABS (${context.tabs.length} tabs):\n`;
      context.tabs.slice(0, 10).forEach(tab => {
        if (tab && tab.title) {
          message += `- ${tab.title}${tab.active ? ' [ACTIVE]' : ''}\n`;
        }
      });
      message += '\n';
    }
    
    if (context.memories && context.memories.length > 0) {
      message += `💾 STORED MEMORIES (${context.memories.length} memories):\n`;
      const recentMemories = context.memories.slice(0, 5);
      recentMemories.forEach(mem => {
        try {
          if (mem && mem.content) {
            // Handle content safely
            let contentStr = '';
            if (typeof mem.content === 'string') {
              contentStr = mem.content;
            } else if (typeof mem.content === 'object') {
              contentStr = JSON.stringify(mem.content);
            } else {
              contentStr = String(mem.content);
            }
            
            const preview = contentStr.length > 100 ? contentStr.substring(0, 100) + '...' : contentStr;
            message += `- [${mem.source || 'unknown'}] ${preview}\n`;
          }
        } catch (err) {
          console.warn('[AI Chat] Error processing memory:', err);
        }
      });
      message += '\n';
    }
  } catch (error) {
    console.warn('[AI Chat] Error building context message:', error);
  }
  
  message += "Use this context to provide personalized and relevant responses.";
  
  return message;
}

// Auto-cleanup old memories
async function scheduleAutoCleanup() {
  // Run cleanup every hour
  setInterval(async () => {
    const settings = await getSettings();
    
    // Clean up old memories
    if (settings.autoDeleteDays > 0) {
      const cutoffTime = Date.now() - (settings.autoDeleteDays * 24 * 60 * 60 * 1000);
      await deleteByTimeRange(0, cutoffTime);
      console.log('[AI Chat] Auto-cleanup completed');
    }
    
    // Also clean up blocked sites from history every hour
    await cleanupBlockedSitesFromHistory();
    
  }, 60 * 60 * 1000); // Every hour
}

console.log('[AI Chat] Background service worker initialized');
