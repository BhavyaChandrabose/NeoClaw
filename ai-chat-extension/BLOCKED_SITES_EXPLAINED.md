# Blocked Sites Feature Explained

## What It Does

The **Blocked Sites** feature allows you to specify websites that the AI should **never remember** or store any information from.

## How It Works

### Core Functionality

When you add a site to the blocked list, the extension will:

1. **Block Memory Creation** - Prevent saving any visits to those sites
2. **Filter from Context** - Exclude from AI's browsing context
3. **Protect Privacy** - Keep sensitive sites out of memory storage

### Code Implementation

```javascript
// When adding a new memory
async function addMemory(memory) {
  // Get blocked sites list
  const { ai_blocked_sites } = await chrome.storage.local.get('ai_blocked_sites');
  const blockedSites = ai_blocked_sites || [];
  
  // Check if site matches any blocked pattern
  if (blockedSites.some(pattern => memory.site?.includes(pattern))) {
    console.log('[AI Chat] Blocked site:', memory.site);
    return; // ← Memory is NOT saved
  }
  
  // ... continue saving if not blocked
}
```

## Where to Find It

**Settings Page → Blocked Sites Section:**
```
┌─────────────────────────────────────────┐
│ 🚫 Blocked Sites                        │
│ Sites that AI should never remember     │
├─────────────────────────────────────────┤
│ [Enter domain or keyword...] [Add]     │
├─────────────────────────────────────────┤
│ Blocked Sites List:                     │
│ 🚫 mycompany.com              [×]       │
│ 🚫 private-site.com           [×]       │
│ 🚫 sensitive-data             [×]       │
└─────────────────────────────────────────┘
```

## How to Use

### Adding a Blocked Site

1. Go to Settings (⚙️)
2. Scroll to "🚫 Blocked Sites"
3. Enter a domain or keyword
4. Click "Add"

**Examples:**
```
mycompany.com       → Blocks all company sites
private-site        → Blocks sites containing "private-site"
intranet            → Blocks all intranet sites
admin               → Blocks admin pages
localhost           → Blocks local development
```

### Removing a Blocked Site

1. Find the site in the list
2. Click the × button next to it
3. Site is unblocked immediately

## What Gets Blocked

### Pattern Matching

The blocking uses **substring matching** - if the site URL contains the blocked pattern, it's blocked.

```javascript
// Blocking logic
blockedSites.some(pattern => memory.site?.includes(pattern))
```

**Examples:**

| Blocked Pattern | Matches These URLs | Doesn't Match |
|----------------|-------------------|---------------|
| `mycompany.com` | `https://mycompany.com` | `https://other.com` |
|                 | `https://app.mycompany.com` | `https://mycompanyname.com` (different) |
|                 | `https://mycompany.com/admin` | |
| `github.com/work` | `https://github.com/work/repo` | `https://github.com/personal` |
| `localhost` | `http://localhost:3000` | `https://production.com` |
|             | `http://localhost:8080/api` | |
| `admin` | `https://site.com/admin` | `https://site.com/user` |
|         | `https://admin.example.com` | |

## Use Cases

### 1. Work/Company Sites
**Block:** Company intranet, work tools, internal systems

```
Blocked patterns:
- mycompany.com
- intranet
- jira.company
- slack-workspace-name
```

**Why:** Keep work activities private from AI

### 2. Personal/Private Sites
**Block:** Email, social media accounts, personal projects

```
Blocked patterns:
- mail.google.com
- facebook.com/messages
- twitter.com/messages
- personal-blog.com
```

**Why:** Prevent personal communications from being stored

### 3. Development/Testing
**Block:** Local servers, staging environments

```
Blocked patterns:
- localhost
- 127.0.0.1
- staging
- dev.mysite.com
```

**Why:** Keep development work separate

### 4. Sensitive Content
**Block:** Medical, legal, financial sites beyond banking

```
Blocked patterns:
- medical
- health
- legal
- lawyer
```

**Why:** Extra privacy for sensitive browsing

### 5. Admin/Configuration Pages
**Block:** Site admin panels, configuration pages

```
Blocked patterns:
- /admin
- /config
- /settings
- wp-admin
```

**Why:** Keep system administration private

## Difference from Banking Protection

### Banking Protection (Built-in)
```
Feature: "Never Remember Banking Sites"
How it works: Automatic blocking of known banking keywords
Patterns: bank, banking, paypal, venmo, stripe, etc.
Can disable: Yes (toggle in settings)
Purpose: Financial privacy
```

### Blocked Sites (Custom)
```
Feature: "Blocked Sites" list
How it works: Manual blocking of ANY sites you specify
Patterns: Whatever you add (company.com, private, etc.)
Can disable: Yes (remove individual sites)
Purpose: General privacy and control
```

**They work together:**
```
Total blocking = Banking protection + Blocked sites list

Example:
- Banking protection blocks: chase.com, paypal.com
- Blocked sites blocks: mycompany.com, intranet
- Result: All of the above are blocked
```

## What Happens When Blocked

### 1. Memory Creation Blocked
```
You visit: mycompany.com/page
Extension tries to create memory
    ↓
Checks blocked sites: "mycompany.com" is blocked
    ↓
Log: "[AI Chat] Blocked site: mycompany.com"
    ↓
Memory NOT saved
```

### 2. Context Filtering
When AI gathers context, blocked sites are excluded:

```javascript
// History filtering
const historyItems = await chrome.history.search({ ... });
const filtered = historyItems.filter(item => 
  !blockedSites.some(pattern => item.url?.includes(pattern))
);
```

**Result:** AI never sees blocked sites in browsing context

### 3. No Past Impact
```
Important: Only blocks NEW memories
Existing memories are NOT deleted
```

To clean up existing memories from blocked sites, use:
- Delete by topic
- Delete individual items
- Delete old items

## Console Logs

When a site is blocked, you'll see:

```javascript
[AI Chat] Blocked site: https://mycompany.com/page
```

This confirms the blocking is working.

## Testing the Feature

### Test 1: Add a Blocked Site
```
1. Go to Settings
2. Add "test.com" to blocked sites
3. Visit a page on test.com
4. Check dashboard
5. Verify: No memory created for test.com
```

### Test 2: Remove Block
```
1. Remove "test.com" from blocked sites
2. Visit test.com again
3. Check dashboard
4. Verify: Memory now created
```

### Test 3: Pattern Matching
```
1. Add "admin" to blocked sites
2. Visit example.com/admin/users
3. Visit example.com/home
4. Check dashboard
5. Verify: 
   - /admin/users NOT saved
   - /home IS saved
```

## Management Tips

### Organize by Category
```
Work sites:
- mycompany.com
- slack-workspace
- jira.company

Personal:
- personal-email
- private-blog

Development:
- localhost
- staging
```

### Use Specific Patterns
```
Too broad: "com" (blocks almost everything)
Too specific: "https://mycompany.com/admin/page" (too narrow)
Just right: "mycompany.com" or "/admin"
```

### Regular Review
```
Periodically check your blocked list:
- Remove old/unused blocks
- Add new sites as needed
- Ensure patterns still relevant
```

## Storage

Blocked sites are stored in Chrome local storage:

```javascript
Key: 'ai_blocked_sites'
Value: ['mycompany.com', 'private-site', 'admin']
Type: Array of strings
```

No limit on number of blocked sites (within storage limits).

## Privacy Benefits

### 1. Selective Memory
✅ Remember general browsing  
❌ Don't remember sensitive sites  
✅ You control what's blocked  

### 2. Work-Life Separation
✅ Block work sites  
✅ AI only sees personal browsing  
✅ Keep work private  

### 3. Custom Protection
✅ Beyond banking (already protected)  
✅ Add ANY sites you want private  
✅ Flexible and customizable  

## Limitations

### 1. Not Retroactive
```
❌ Doesn't delete existing memories
✅ Only blocks new memory creation
```

### 2. Pattern-Based
```
❌ Blocks by substring match
❌ Can't use complex rules (regex)
✅ Simple and predictable
```

### 3. Manual Management
```
❌ Must add sites manually
❌ No auto-detection of sensitive sites
✅ You have full control
```

## Comparison with Other Features

| Feature | Purpose | How to Use | When Active |
|---------|---------|-----------|-------------|
| **Blocked Sites** | Block specific sites YOU choose | Add to list in Settings | Always (for listed sites) |
| **Banking Protection** | Auto-block financial sites | Toggle in Settings | When enabled |
| **Disable History** | Block ALL history | Toggle in Settings | When disabled |
| **Delete by Topic** | Remove existing memories | Dashboard action | On-demand |

## Best Practices

### 1. Start Broad
```
Block general patterns first:
- Company domain
- Admin paths
- Development environments
```

### 2. Refine Over Time
```
Add specific sites as you discover them:
- New sensitive sites
- Personal projects
- Private services
```

### 3. Document Patterns
```
Keep notes on why you blocked:
- "mycompany.com" - Work site
- "/admin" - Admin panels
- "localhost" - Dev environment
```

### 4. Combine with Other Features
```
Use together:
- Banking protection (automatic)
- Blocked sites (custom)
- Disable sources (history/tabs)
- Regular cleanup (delete old)
```

## Summary

**Blocked Sites feature:**
- 🚫 **Prevents memory creation** from specified sites
- ✋ **Filters from AI context** (history, tabs)
- 🎯 **Custom control** - You choose what to block
- 🔒 **Privacy protection** - Keep sensitive sites private
- 🏢 **Work-life separation** - Block work or personal sites
- ⚙️ **Easy management** - Add/remove sites anytime

**Use it to:**
- Block company/work websites
- Protect personal/private sites
- Hide development/testing environments
- Exclude admin/configuration pages
- Keep ANY sites private from AI

**Works with:**
- Banking protection (automatic blocking)
- Source toggles (disable history/tabs)
- Delete actions (clean up existing)

Your browsing, your rules! 🎯
