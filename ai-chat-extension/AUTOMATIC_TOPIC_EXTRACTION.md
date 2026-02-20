# Automatic Topic Extraction

## Overview
The AI Chat Extension now automatically extracts and assigns relevant topics to chat memories based on the content of the conversation, instead of hardcoding all topics as "chat".

## Problem Identified
Previously, all chat messages were assigned the topic `"chat"` regardless of their actual content:
```javascript
// Old behavior
topic: 'chat'  // ❌ Everything was "chat"
```

This made the "Delete by Topic/Subject" feature ineffective because:
- All memories had the same topic
- Cannot distinguish between programming discussions and cooking recipes
- Semantic search by topic was impossible

## Solution: Intelligent Topic Assignment

### How It Works Now

**1. LLM-Based Topic Extraction (Primary)**
- When a chat message is saved, the content is analyzed by the NeoClaw LLM
- LLM identifies the main subject/domain in 1-3 words
- Example: "How do I install Python?" → topic: `"programming"`

**2. Keyword-Based Extraction (Fallback)**
- If LLM is not configured or fails, falls back to keyword matching
- Analyzes content for category-specific keywords
- Still much better than hardcoded "chat"

### Topic Assignment Logic

```javascript
// User sends message
await addMemory({
  type: 'chat',
  source: 'user',
  content: userMessage,
  site: 'AI Chat',
  topic: await extractTopicFromContent(userMessage)  // ✅ Dynamic topic
});

// AI responds
await addMemory({
  type: 'chat',
  source: 'ai',
  content: aiResponse,
  site: 'AI Chat',
  topic: await extractTopicFromContent(aiResponse)  // ✅ Dynamic topic
});
```

## Supported Topic Categories

### LLM Extraction
The LLM can identify ANY topic based on semantic understanding:
- Programming languages (Python, JavaScript, Java, etc.)
- Specific technologies (React, Docker, AWS, etc.)
- Domains (cooking, travel, history, etc.)
- Concepts (machine learning, finance, health, etc.)

### Keyword-Based Fallback Categories
If LLM is unavailable, the extension uses keyword matching for these categories:

1. **programming** - code, python, javascript, function, api, debug, git
2. **cooking** - recipe, food, restaurant, meal, ingredient, cuisine
3. **travel** - hotel, flight, vacation, trip, visit, tourism
4. **health** - doctor, medical, medicine, fitness, workout, exercise
5. **finance** - money, bank, invest, stock, budget, payment
6. **education** - learn, study, school, university, course, tutorial
7. **entertainment** - movie, music, game, tv, show, play, watch
8. **news** - current events, politics, election, government
9. **shopping** - buy, purchase, product, price, amazon, store
10. **general** - default for unmatched content

## Examples

### Before (All Same Topic):
```json
[
  { "content": "How do I code in Python?", "topic": "chat" },
  { "content": "Best pasta recipe?", "topic": "chat" },
  { "content": "Tell me about history", "topic": "chat" }
]
```
❌ Cannot delete by specific topic

### After (Intelligent Topics):
```json
[
  { "content": "How do I code in Python?", "topic": "programming" },
  { "content": "Best pasta recipe?", "topic": "cooking" },
  { "content": "Tell me about history", "topic": "history" }
]
```
✅ Can delete programming discussions while keeping cooking and history

## User Experience

### Delete by Topic Now Works:
1. User has conversations about programming, cooking, and travel
2. Each gets appropriate topic: "programming", "cooking", "travel"
3. User can now delete all "programming" memories
4. Only programming discussions are removed
5. Cooking and travel memories remain intact

### Dashboard View:
```
Memory Cards:
┌─────────────────────────────┐
│ 🤖 How to install Python?  │
│ Topic: programming          │
│ 2 minutes ago               │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🤖 Best pasta carbonara?    │
│ Topic: cooking              │
│ 5 minutes ago               │
└─────────────────────────────┘
```

## Technical Implementation

### Function: `extractTopicFromContent(content)`

**Parameters:**
- `content` (string) - The message content to analyze

**Returns:**
- `string` - The extracted topic (1-3 words)

**Process:**
1. Check if NeoClaw LLM is configured
2. If yes, send content to LLM for topic extraction
3. Parse and clean LLM response
4. If LLM fails or not configured, use keyword matching
5. Return topic or 'general' as final fallback

### LLM Prompt:
```
Analyze this text and identify its main topic/subject in 1-3 words. 
Be specific but concise.

Examples:
- "How do I install Python?" → "programming"
- "What's a good recipe for pasta?" → "cooking"
- "Tell me about the Roman Empire" → "history"

Text: "[user content]"

Main topic (1-3 words):
```

### Function: `extractTopicFromKeywords(content)`

**Parameters:**
- `content` (string) - The message content to analyze

**Returns:**
- `string` - The matched category or 'general'

**Process:**
1. Convert content to lowercase
2. Test against regex patterns for each category
3. Return first matching category
4. Default to 'general' if no match

## Error Handling

### LLM Extraction Failures:
```javascript
try {
  // Try LLM extraction
  const topic = await extractTopicFromContent(content);
} catch (error) {
  // Falls back to keyword matching automatically
  console.log('Using fallback topic extraction');
}
```

### Edge Cases:
- Empty content → 'general'
- Very short content (< 10 chars) → keyword matching
- LLM returns invalid response → fallback to keywords
- Multiple topics in one message → LLM picks most prominent

## Performance Considerations

### LLM Calls:
- One API call per message (user + AI = 2 calls per exchange)
- Async processing - doesn't block UI
- Timeout handling - falls back if slow
- Content limited to first 500 characters for efficiency

### Caching (Future Enhancement):
Could cache topic extraction for similar content:
```javascript
// Future optimization
const topicCache = new Map();
if (topicCache.has(contentHash)) {
  return topicCache.get(contentHash);
}
```

## Configuration

### Enable/Disable LLM Topic Extraction:
Currently automatic based on NeoClaw configuration:
- If NeoClaw URL and token are set → Uses LLM
- If not configured → Uses keywords
- Always has fallback

### Future Settings Option:
Could add to settings UI:
```
☐ Use AI to auto-detect memory topics
  Analyzes chat content to assign relevant topics automatically
```

## Benefits

1. **Semantic Organization**: Memories organized by actual subject matter
2. **Effective Filtering**: "Delete by Topic" now works as intended
3. **Better Search**: Can find memories by subject domain
4. **User Intent**: Matches user's mental model ("delete all programming stuff")
5. **Automatic**: No manual categorization needed

## Limitations

1. **LLM Dependency**: Best experience requires NeoClaw connection
2. **API Calls**: Adds 2 API calls per chat exchange
3. **Topic Granularity**: Limited to 1-3 words (e.g., "Python" becomes "programming")
4. **Mixed Topics**: Single-topic per message (can't handle "cooking AND travel")

## Testing

### How to Test:
1. Start fresh conversation about programming
2. Check memory in dashboard - should show "programming" topic
3. Start conversation about cooking
4. Check memory - should show "cooking" topic
5. Use "Delete by Subject" with "programming"
6. Verify only programming memories deleted

### Console Logging:
```
[AI Chat] LLM extracted topic: programming
[AI Chat] Memory added: mem_xxx with topic: programming
```

## Migration

### Existing Memories:
Old memories with `topic: "chat"` remain unchanged. Only new messages get automatic topics.

To update old memories (future enhancement):
```javascript
// Could add "Re-analyze Topics" button to dashboard
async function reanalyzeAllTopics() {
  const memories = await getMemories();
  for (const memory of memories) {
    if (memory.topic === 'chat') {
      memory.topic = await extractTopicFromContent(memory.content);
      await updateMemory(memory);
    }
  }
}
```

## Future Enhancements

1. **Multi-Topic Support**: Handle messages with multiple subjects
2. **Topic Hierarchy**: programming → python → django
3. **Custom Topics**: User-defined topic categories
4. **Topic Suggestions**: Show common topics in UI
5. **Bulk Re-categorization**: Re-analyze all old memories
6. **Topic Analytics**: Show distribution of memory topics
7. **Smart Grouping**: Group related topics (programming + coding + development)

## Related Files

- `background.js` - Main implementation
  - `extractTopicFromContent()` - LLM-based extraction
  - `extractTopicFromKeywords()` - Keyword-based fallback
  - `sendChatMessage()` - Updated to use dynamic topics
- `dashboard.js` - Displays topics on memory cards
- `TOPIC_AS_SUBJECT_DOMAIN.md` - Explains "topic" concept

## Conclusion

This automatic topic extraction transforms the extension from storing all chats as generic "chat" memories to intelligently categorizing them by subject matter, making the "Delete by Topic" feature actually useful and enabling semantic organization of memories.
