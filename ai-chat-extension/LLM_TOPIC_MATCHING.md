# LLM-Based Topic Matching

## Overview

The ai-chat-extension now uses **AI-powered semantic topic matching** via NeoClaw LLM for the "Delete by Topic" functionality. This is a major upgrade from simple string matching to intelligent content understanding.

## What Changed

### Before (Simple String Matching)
```javascript
// Old logic: Simple string includes check
const matching = memories.filter(m => 
  m.topic && m.topic.toLowerCase().includes(topicLower)
);
```

**Limitations:**
- ❌ Only matches exact strings
- ❌ Misses synonyms (e.g., "coding" won't match "programming")
- ❌ Ignores content - only checks topic field
- ❌ No semantic understanding

### After (LLM-Based Semantic Matching)
```javascript
// New logic: AI analyzes each memory semantically
const results = await batchCheckMemoriesByTopic(memories, topic);
```

**Advantages:**
- ✅ Understands synonyms and related concepts
- ✅ Analyzes memory content, not just topic field
- ✅ Semantic matching (e.g., "coding" matches "programming", "development", "software")
- ✅ Context-aware decisions
- ✅ More accurate and intelligent

## How It Works

### 1. Single Memory Check
```javascript
async function checkMemoryBelongsToTopic(memory, topic)
```

**Process:**
1. Extracts memory details (ID, topic, source, content, site)
2. Sends to NeoClaw LLM with a classification prompt
3. LLM analyzes semantic relationship
4. Returns YES or NO
5. Fallback to string matching if LLM unavailable

**Example Prompt:**
```
You are a memory classifier. Analyze if the following memory is related to the topic "programming".

Memory ID: mem_123
Topic: coding
Source: history
Content: Visited GitHub repository for Python project...
Site: github.com

Question: Does this memory belong to or relate to the topic "programming"?

Consider:
- Direct topic matches
- Semantic similarity (e.g., "programming" matches "coding", "development")
- Content relevance (if content is about the topic, even if topic field differs)
- Synonyms and related concepts

Respond with ONLY "YES" or "NO" (nothing else).
```

### 2. Batch Memory Check (Optimized)
```javascript
async function batchCheckMemoriesByTopic(memories, topic)
```

**Process:**
1. Groups memories into batches (20 at a time)
2. Sends all memories in one LLM request
3. LLM returns comma-separated list of matching indices
4. More efficient - fewer API calls
5. Processes large memory sets faster

**Example Batch Prompt:**
```
You are a memory classifier. Analyze which of the following memories are related to the topic "programming".

MEMORIES:
1. ID: mem_123
   Topic: coding
   Source: history
   Content: GitHub Python repository visit...

2. ID: mem_124
   Topic: cooking
   Source: bookmark
   Content: Recipe for chocolate cake...

3. ID: mem_125
   Topic: development
   Source: chat
   Content: Discussion about React components...

Task: For each memory numbered 1-3, determine if it belongs to or relates to the topic "programming".

Respond with ONLY a comma-separated list of numbers for memories that match (e.g., "1,3").
If no memories match, respond with "NONE".
```

**LLM Response Example:** `1,3`

### 3. Delete by Topic Flow

```javascript
async function deleteByTopic(topic)
```

**Complete Flow:**
1. User enters topic (e.g., "programming")
2. Function retrieves all memories from storage
3. Processes memories in batches of 20
4. For each batch:
   - Sends to LLM for semantic analysis
   - LLM returns which memories match
5. Collects all matching memories
6. Deletes matching memories from storage
7. Returns statistics (deleted count, remaining count, deleted IDs)

## Semantic Understanding Examples

### Example 1: Synonym Matching
**User searches for:** "programming"

**Memories found:**
- ✅ Topic: "coding" - Content: "Python tutorial"
- ✅ Topic: "development" - Content: "React components"
- ✅ Topic: "software" - Content: "VS Code extensions"
- ❌ Topic: "cooking" - Content: "Pasta recipe"

### Example 2: Content-Based Matching
**User searches for:** "cooking"

**Memories found:**
- ✅ Topic: "recipes" - Content: "How to make pasta"
- ✅ Topic: "food" - Content: "Baking chocolate cake"
- ✅ Topic: "chat" - Content: "Discussed cooking techniques"
- ❌ Topic: "programming" - Content: "Python code"

### Example 3: Related Concepts
**User searches for:** "fitness"

**Memories found:**
- ✅ Topic: "exercise" - Content: "Gym workout routine"
- ✅ Topic: "health" - Content: "Running schedule"
- ✅ Topic: "sports" - Content: "Basketball training"
- ❌ Topic: "shopping" - Content: "Buy groceries"

## Configuration

### LLM Settings Required
The feature requires NeoClaw credentials to be configured:

```javascript
// In settings or defaults
{
  neoClawUrl: 'https://ai-hacker-neoclaw.securebrowser.com',
  neoClawToken: 'your-token-here'
}
```

### Fallback Behavior
If LLM is not configured or unavailable:
- ⚠️ Automatically falls back to simple string matching
- 📝 Logs warning: "LLM not configured, using simple string matching"
- ✅ Still functional, just less intelligent

## Performance Optimization

### Batch Processing
- **Batch size:** 20 memories per request
- **Why:** Avoids token limits and reduces API calls
- **Efficiency:** 100 memories = 5 API calls vs 100 API calls

### Example Performance
```
Small dataset (20 memories):
- LLM calls: 1
- Time: ~2-3 seconds

Medium dataset (100 memories):
- LLM calls: 5
- Time: ~10-15 seconds

Large dataset (1000 memories):
- LLM calls: 50
- Time: ~100-150 seconds (with progress logging)
```

## User Experience

### Dashboard Changes

1. **Confirmation Dialog:**
```
Delete all memories related to "programming"?

Note: Using AI-powered semantic matching to find related memories.
```

2. **Loading Indicator:**
```
🤖 AI is analyzing memories...
```

3. **Success Message:**
```
✅ AI-powered deletion complete!

Deleted: 5 memory(ies)
Remaining: 95 memory(ies)

The AI analyzed memories semantically to find matches related to "programming".
```

4. **No Matches Found:**
```
🔍 No memories found matching topic "programming"

The AI analyzed all memories but found no semantic matches.
```

## Console Logging

The feature provides detailed console logs for debugging:

```javascript
[AI Chat] Delete by topic request: programming
[AI Chat] Total memories before: 100
[AI Chat] Using LLM-based semantic topic matching
[AI Chat] Processing batch 1/5
[AI Chat] Sending batch request to LLM for 20 memories
[AI Chat] LLM batch response: 1,3,5,7
[AI Chat] LLM found 4/20 memories matching topic "programming"
...
[AI Chat] LLM identified 18 memories to delete
[AI Chat] Successfully deleted 18 memories for topic: programming
```

## Error Handling

### Graceful Degradation
1. **LLM Unavailable:** Falls back to string matching
2. **API Error:** Falls back to string matching
3. **Invalid Response:** Falls back to string matching
4. **Network Error:** Falls back to string matching

### Error Logs
```javascript
[AI Chat] LLM request failed, falling back to string matching
[AI Chat] Error in batch LLM topic check: <error details>
```

## Testing

### Test Semantic Matching
1. Create memories with different topics:
   - "programming" content about coding
   - "development" content about software
   - "coding" content about algorithms
   - "cooking" content about recipes

2. Delete by topic "programming"

3. Verify all related memories deleted:
   - Should delete: programming, development, coding memories
   - Should keep: cooking memories

### Test Fallback
1. Clear NeoClaw credentials in settings
2. Try delete by topic
3. Should see: "LLM not configured, using simple string matching"
4. Should still work with basic matching

### Test Batch Processing
1. Create 50+ memories
2. Delete by topic
3. Watch console logs for batch processing
4. Verify all batches processed correctly

## Code Structure

### New Functions

```javascript
// Single memory check
checkMemoryBelongsToTopic(memory, topic)

// Batch memory check (efficient)
batchCheckMemoriesByTopic(memories, topic)

// Enhanced delete by topic
deleteByTopic(topic)
```

### Modified Functions

```javascript
// Dashboard - enhanced UI feedback
deleteByTopic() in dashboard.js
```

### Files Changed
- ✅ `background.js` - Added LLM functions and enhanced deleteByTopic
- ✅ `dashboard.js` - Enhanced UI with loading and better feedback
- ✅ `styles.css` - Added `.save-status.info` style
- 📄 `LLM_TOPIC_MATCHING.md` - This documentation

## API Details

### NeoClaw API Call
```javascript
POST {neoClawUrl}/v1/responses
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
  x-openclaw-agent-id: main

Body:
{
  model: 'openclaw',
  stream: false,
  input: [{
    type: 'message',
    role: 'user',
    content: '<classification prompt>'
  }]
}
```

### Response Format
```javascript
{
  output: [{
    content: [{
      text: 'YES' // or 'NO' or '1,3,5'
    }]
  }]
}
```

## Benefits

### For Users
- 🎯 More accurate topic deletion
- 🧠 Understands what you mean, not just what you type
- 🔍 Finds related memories you might miss
- ✨ Smarter, more intuitive experience

### For Developers
- 🏗️ Modular design with fallback
- 📊 Detailed logging for debugging
- ⚡ Optimized batch processing
- 🛡️ Robust error handling

## Future Enhancements

Possible improvements:
1. **Confidence scores** - Show how confident the LLM is
2. **Preview before delete** - Let user review what will be deleted
3. **Undo functionality** - Restore recently deleted memories
4. **Topic suggestions** - LLM suggests common topics in memories
5. **Multi-topic delete** - Delete multiple topics at once
6. **Exclusion patterns** - "Delete X but not Y"

## Troubleshooting

### Issue: LLM taking too long
**Solution:** Working as designed. Large memory sets require time for AI analysis.

### Issue: Wrong memories deleted
**Solution:** 
1. Check console logs to see LLM decisions
2. Verify NeoClaw credentials are correct
3. Test with simple topic first (e.g., exact topic name)

### Issue: No memories deleted but should be
**Solution:**
1. Check memory topics and content in dashboard
2. Try more specific topic terms
3. Check LLM response in console logs
4. Verify LLM is working (test connection in settings)

### Issue: Fallback to string matching
**Solution:** Verify NeoClaw credentials in Settings → NeoClaw Connection

## Summary

This implementation transforms the "Delete by Topic" feature from a basic string matcher into an intelligent AI-powered tool that truly understands the semantic relationship between topics and memories. It maintains backward compatibility with fallback behavior while providing a significantly enhanced user experience when LLM is available.

**Key Takeaway:** The extension now uses NeoClaw's AI to make smart decisions about which memories belong to a topic, considering synonyms, related concepts, and content relevance - not just simple string matching.
