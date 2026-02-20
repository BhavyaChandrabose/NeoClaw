// AI Memory Dashboard Script

let allMemories = [];
let filteredMemories = [];
let allItems = []; // Combined memories + browser history
let displayedItems = []; // Items shown after filtering
let browserContext = {
  historyCount: 0,
  tabsCount: 0,
  bookmarksCount: 0,
  history: [], // Full history items
  tabs: [],
  bookmarks: []
};

// Infinite scroll
let itemsLoaded = 20; // Start with 20 items
let itemsPerLoad = 20; // Load 20 more at a time
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadMemories();
  await loadBrowserContext();
  setupEventListeners();
  updateStats();
  
  // Auto-refresh stats every 5 seconds
  setInterval(async () => {
    await loadBrowserContext();
    combineAllItems();
    updateStats();
  }, 5000);
  
  // Listen for tab changes
  chrome.tabs.onCreated.addListener(handleTabChange);
  chrome.tabs.onRemoved.addListener(handleTabChange);
  chrome.tabs.onUpdated.addListener(handleTabChange);
});

// Event listeners
function setupEventListeners() {
  document.getElementById('backBtn').addEventListener('click', () => window.close());
  document.getElementById('applyFilters').addEventListener('click', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  document.getElementById('deleteByTopicBtn').addEventListener('click', deleteByTopic);
  document.getElementById('deleteOldBtn').addEventListener('click', deleteOld);
  document.getElementById('deleteAllBtn').addEventListener('click', deleteAll);
  
  // Infinite scroll
  const memoriesList = document.getElementById('memoriesList');
  memoriesList.addEventListener('scroll', handleScroll);
  
  // Load more button
  document.getElementById('loadMoreBtn')?.addEventListener('click', loadMoreItems);
  
  document.getElementById('timeFilter').addEventListener('change', (e) => {
    const customRange = document.getElementById('customTimeRange');
    customRange.style.display = e.target.value === 'custom' ? 'flex' : 'none';
  });
}

// Handle scroll for infinite loading
function handleScroll(e) {
  const container = e.target;
  const scrollPosition = container.scrollTop + container.clientHeight;
  const scrollHeight = container.scrollHeight;
  
  // Load more when within 200px of bottom
  if (scrollPosition >= scrollHeight - 200 && !isLoading && itemsLoaded < allItems.length) {
    loadMoreItems();
  }
}

// Load memories
async function loadMemories() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_MEMORIES' });
  
  if (response.success) {
    allMemories = response.data;
    combineAllItems();
    displayMemories(allItems);
    updateStats();
  } else {
    document.getElementById('memoriesList').innerHTML = 
      '<div class="error">Error loading memories</div>';
  }
}

// Combine memories with browser history
function combineAllItems() {
  // Start with stored memories
  const items = [...allMemories];
  
  // Add browser history items
  if (browserContext.history && browserContext.history.length > 0) {
    browserContext.history.forEach(historyItem => {
      items.push({
        id: `history_${historyItem.lastVisitTime || Date.now()}`,
        type: 'browser-history',
        source: 'history',
        title: historyItem.title,
        url: historyItem.url,
        content: historyItem.title || historyItem.url,
        site: historyItem.url,
        timestamp: historyItem.lastVisitTime || Date.now(),
        visitCount: historyItem.visitCount
      });
    });
  }
  
  // Add open tabs
  if (browserContext.tabs && browserContext.tabs.length > 0) {
    browserContext.tabs.forEach(tab => {
      items.push({
        id: `tab_${Date.now()}_${Math.random()}`,
        type: 'browser-tab',
        source: 'tab',
        title: tab.title,
        url: tab.url,
        content: tab.title || tab.url,
        site: tab.url,
        timestamp: Date.now(),
        active: tab.active
      });
    });
  }
  
  // Sort by timestamp (newest first)
  allItems = items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  console.log('[Dashboard] Combined items:', {
    total: allItems.length,
    memories: allMemories.length,
    history: browserContext.history?.length || 0,
    tabs: browserContext.tabs?.length || 0
  });
}

// Display memories with infinite scroll
function displayMemories(items, append = false) {
  const container = document.getElementById('memoriesList');
  
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state">No memories found</div>';
    updateScrollStatus(0, 0);
    return;
  }
  
  // Reset on new data
  if (!append) {
    itemsLoaded = Math.min(itemsPerLoad, items.length);
    container.innerHTML = '';
  }
  
  // Get items to display
  const startIndex = append ? displayedItems.length : 0;
  const endIndex = Math.min(itemsLoaded, items.length);
  const itemsToShow = items.slice(startIndex, endIndex);
  
  // Update displayed items
  if (append) {
    displayedItems.push(...itemsToShow);
  } else {
    displayedItems = itemsToShow;
  }
  
  // Display items
  itemsToShow.forEach(item => {
    const card = createMemoryCard(item);
    container.appendChild(card);
  });
  
  // Update status
  updateScrollStatus(displayedItems.length, items.length);
  
  // Show/hide load more button
  updateLoadMoreButton(displayedItems.length, items.length);
}

// Load more items
function loadMoreItems() {
  if (isLoading || itemsLoaded >= allItems.length) {
    return;
  }
  
  isLoading = true;
  const loadingIndicator = document.getElementById('loadingMore');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
  
  console.log('[Dashboard] Loading more items...');
  
  // Simulate loading delay for smooth UX
  setTimeout(() => {
    itemsLoaded += itemsPerLoad;
    displayMemories(allItems, true);
    
    isLoading = false;
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }, 300);
}

// Update scroll status
function updateScrollStatus(loaded, total) {
  const statusEl = document.getElementById('displayCount');
  if (statusEl) {
    if (total === 0) {
      statusEl.textContent = 'No items';
    } else if (loaded >= total) {
      statusEl.textContent = `All ${total} items loaded`;
    } else {
      statusEl.textContent = `Showing ${loaded} of ${total} items • Scroll for more`;
    }
  }
}

// Update load more button
function updateLoadMoreButton(loaded, total) {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    if (loaded >= total) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'block';
      loadMoreBtn.textContent = `Load More (${total - loaded} remaining)`;
    }
  }
}

// Create memory card
function createMemoryCard(item) {
  const card = document.createElement('div');
  card.className = 'memory-card';
  card.dataset.id = item.id;
  
  // Handle different item types
  const isBrowserItem = item.type === 'browser-history' || item.type === 'browser-tab';
  
  const sourceIcon = {
    history: '📜',
    bookmark: '⭐',
    tab: '📑',
    chat: '💬',
    search: '🔍'
  }[item.source] || '📄';
  
  // Format timestamp
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleString();
  
  // Build card content
  let cardHTML = `
    <div class="memory-header">
      <span class="memory-source">${sourceIcon} ${item.source}${isBrowserItem ? ' (browser)' : ''}</span>
      <span class="memory-date">${formattedDate}</span>
  `;
  
  // Show delete button for stored memories and browser history (not tabs)
  if (!isBrowserItem || item.type === 'browser-history') {
    cardHTML += `<button class="delete-btn" data-id="${item.id}" title="Delete this item">×</button>`;
  }
  
  cardHTML += `
    </div>
    <div class="memory-body">
  `;
  
  // Show title for browser items
  if (item.title) {
    cardHTML += `<div class="memory-title">${escapeHtml(item.title)}</div>`;
  }
  
  // Show content
  if (item.content) {
    const contentText = typeof item.content === 'string' 
      ? item.content 
      : JSON.stringify(item.content);
    cardHTML += `<div class="memory-content">${escapeHtml(contentText)}</div>`;
  }
  
  // Show URL for browser items
  if (isBrowserItem && item.url) {
    cardHTML += `
      <div class="memory-url">
        <a href="${item.url}" target="_blank" class="url-link">
          ${escapeHtml(item.url)}
        </a>
      </div>
    `;
  }
  
  // Show site
  if (item.site && !isBrowserItem) {
    cardHTML += `<div class="memory-site">🌐 ${escapeHtml(item.site)}</div>`;
  }
  
  // Show topic for stored memories
  if (item.topic) {
    cardHTML += `<div class="memory-topic">🏷️ ${escapeHtml(item.topic)}</div>`;
  }
  
  // Show visit count for history items
  if (item.visitCount) {
    cardHTML += `<div class="memory-meta">👁️ ${item.visitCount} visits</div>`;
  }
  
  // Show active indicator for tabs
  if (item.active) {
    cardHTML += `<div class="memory-meta">✨ Active tab</div>`;
  }
  
  cardHTML += `
    </div>
  `;
  
  card.innerHTML = cardHTML;
  
  // Add delete listener for stored memories and browser history
  if (!isBrowserItem || item.type === 'browser-history') {
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemType = item.type === 'browser-history' ? 'browser history item' : 'stored memory';
        if (confirm(`Delete this ${itemType}?${item.type === 'browser-history' ? '\n\nThis will be deleted from your browser history.' : ''}`)) {
          await deleteMemory(item.id);
        }
      });
    }
  }
  
  return card;
}

// Apply filters
async function applyFilters() {
  const source = document.getElementById('sourceFilter').value;
  const topic = document.getElementById('topicFilter').value;
  const timeRange = document.getElementById('timeFilter').value;
  
  const filters = {};
  
  if (source) filters.source = source;
  if (topic) filters.topic = topic;
  
  // Time range filters
  if (timeRange) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    switch (timeRange) {
      case 'today':
        filters.startTime = now - day;
        filters.endTime = now;
        break;
      case 'week':
        filters.startTime = now - (7 * day);
        filters.endTime = now;
        break;
      case 'month':
        filters.startTime = now - (30 * day);
        filters.endTime = now;
        break;
      case 'custom':
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate) filters.startTime = new Date(startDate).getTime();
        if (endDate) filters.endTime = new Date(endDate).getTime() + day;
        break;
    }
  }
  
  const response = await chrome.runtime.sendMessage({
    type: 'GET_MEMORIES',
    filters: filters
  });
  
  if (response.success) {
    filteredMemories = response.data;
    displayMemories(filteredMemories);
  }
}

// Clear filters
function clearFilters() {
  document.getElementById('sourceFilter').value = '';
  document.getElementById('topicFilter').value = '';
  document.getElementById('timeFilter').value = '';
  document.getElementById('customTimeRange').style.display = 'none';
  
  filteredMemories = allMemories;
  displayMemories(filteredMemories);
}

// Comprehensive refresh - reloads everything
async function refreshAll() {
  console.log('[Dashboard] Refreshing all data...');
  
  // Reload stored memories
  await loadMemories();
  
  // Reload browser context
  await loadBrowserContext();
  
  // Recombine all items
  combineAllItems();
  
  // Reset scroll position
  itemsLoaded = Math.min(itemsPerLoad, allItems.length);
  
  // Redisplay
  displayMemories(allItems, false);
  
  // Update stats
  updateStats();
  
  console.log('[Dashboard] Refresh complete:', {
    totalItems: allItems.length,
    displayed: itemsLoaded,
    stored: allMemories.length,
    history: browserContext.historyCount,
    tabs: browserContext.tabsCount
  });
}

// Delete memory (handles both stored and browser items)
async function deleteMemory(id) {
  try {
    // Find the item to determine its type
    const item = allItems.find(i => i.id === id);
    
    if (!item) {
      console.error('[Dashboard] Item not found:', id);
      return;
    }
    
    // Handle browser history deletion
    if (item.type === 'browser-history' && item.url) {
      await chrome.history.deleteUrl({ url: item.url });
      console.log('[Dashboard] Deleted from browser history:', item.url);
    }
    // Handle stored memory deletion
    else if (!item.type || item.type !== 'browser-tab') {
      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_MEMORY',
        id: id
      });
      
      if (!response.success) {
        throw new Error('Failed to delete stored memory');
      }
      console.log('[Dashboard] Deleted stored memory:', id);
    }
    // Browser tabs - just remove from display (can't delete)
    else {
      console.log('[Dashboard] Browser tab removed from view:', id);
    }
    
    // Refresh the list
    await refreshAll();
    
  } catch (error) {
    console.error('[Dashboard] Error deleting item:', error);
    alert('Error deleting item: ' + error.message);
  }
}

// Delete by topic
async function deleteByTopic() {
  const topic = document.getElementById('deleteTopic').value.trim();
  
  if (!topic) {
    alert('Please enter a topic to delete');
    return;
  }
  
  if (!confirm(`Delete all items about "${topic}"?\n\nNote: AI will analyze stored memories and browser history to find matches.\nBrowser history items will be deleted from your browser.`)) {
    return;
  }
  
  try {
    console.log('[Dashboard] Sending delete by topic request:', topic);
    
    // Show loading indicator
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) {
      statusEl.textContent = '🤖 AI is analyzing all items (stored + browser)...';
      statusEl.className = 'save-status info';
      statusEl.style.display = 'block';
    }
    
    // Delete stored memories via backend
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_BY_TOPIC',
      topic: topic
    });
    
    console.log('[Dashboard] Delete by topic response:', response);
    
    let deletedStored = 0;
    let deletedHistory = 0;
    
    if (response.success) {
      deletedStored = response.data?.deleted || 0;
    }
    
    // Also check browser history for matching items
    const historyMatches = allItems.filter(item => 
      item.type === 'browser-history' && 
      item.content && 
      item.content.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (historyMatches.length > 0) {
      for (const item of historyMatches) {
        try {
          await chrome.history.deleteUrl({ url: item.url });
          deletedHistory++;
          console.log('[Dashboard] Deleted from browser history:', item.url);
        } catch (error) {
          console.error('[Dashboard] Error deleting history item:', error);
        }
      }
    }
    
    const totalDeleted = deletedStored + deletedHistory;
    
    if (totalDeleted > 0) {
      let message = `✅ AI content analysis complete!\n\n`;
      message += `Total deleted: ${totalDeleted} item(s)\n`;
      message += `- Stored memories: ${deletedStored}\n`;
      message += `- Browser history: ${deletedHistory}\n\n`;
      message += `All items whose subject/domain matches "${topic}" have been deleted.`;
      
      alert(message);
    } else {
      alert(`🔍 No items found about "${topic}"\n\nThe AI analyzed all items but found no matches.`);
    }
    
    await loadMemories();
    await loadBrowserContext();
    displayMemories(allItems);
    document.getElementById('deleteTopic').value = '';
    updateStats();
    
    if (statusEl) {
      statusEl.style.display = 'none';
    }
    
  } catch (error) {
    console.error('[Dashboard] Error deleting by topic:', error);
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) {
      statusEl.style.display = 'none';
    }
    alert('Error deleting items: ' + error.message);
  }
}

// Delete old memories
async function deleteOld() {
  if (!confirm('Delete all items older than 30 days?\n\nThis includes both stored memories and browser history.')) {
    return;
  }
  
  try {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let deletedStored = 0;
    let deletedHistory = 0;
    
    // Delete old stored memories
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_BY_TIME_RANGE',
      startTime: 0,
      endTime: cutoff
    });
    
    if (response.success) {
      deletedStored = allMemories.filter(m => m.timestamp < cutoff).length;
    }
    
    // Delete old browser history
    const oldHistoryItems = browserContext.history?.filter(h => h.lastVisitTime < cutoff) || [];
    
    for (const item of oldHistoryItems) {
      try {
        await chrome.history.deleteUrl({ url: item.url });
        deletedHistory++;
      } catch (error) {
        console.error('[Dashboard] Error deleting old history:', error);
      }
    }
    
    alert(`Deleted old items (30+ days):\n\n- Stored memories: ${deletedStored}\n- Browser history: ${deletedHistory}\n\nTotal: ${deletedStored + deletedHistory} items`);
    
    await refreshAll();
    
  } catch (error) {
    console.error('[Dashboard] Error deleting old items:', error);
    alert('Error deleting old items: ' + error.message);
  }
}

// Delete all memories
async function deleteAll() {
  if (!confirm('Delete ALL items (stored memories + browser history)?\n\nThis cannot be undone!\n\nWarning: This will also clear your browser history!')) {
    return;
  }
  
  // Extra confirmation for browser history
  if (!confirm('⚠️ FINAL WARNING ⚠️\n\nThis will delete:\n- All stored AI chat memories\n- ALL your browser history\n\nAre you absolutely sure?')) {
    return;
  }
  
  try {
    console.log('[Dashboard] Sending delete all request');
    
    let deletedStored = 0;
    let deletedHistory = 0;
    
    // Delete stored memories
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_BY_TIME_RANGE',
      startTime: 0,
      endTime: Date.now() + 1000
    });
    
    console.log('[Dashboard] Delete all response:', response);
    
    if (response.success) {
      deletedStored = allMemories.length;
    }
    
    // Delete all browser history
    const historyCount = browserContext.history?.length || 0;
    if (historyCount > 0) {
      await chrome.history.deleteAll();
      deletedHistory = historyCount;
      console.log('[Dashboard] Deleted all browser history');
    }
    
    alert(`All items deleted successfully!\n\n- Stored memories: ${deletedStored}\n- Browser history: ${deletedHistory}\n\nTotal: ${deletedStored + deletedHistory} items`);
    
    await refreshAll();
    
  } catch (error) {
    console.error('[Dashboard] Error deleting all:', error);
    alert('Error deleting items: ' + error.message);
  }
}

// Load browser context (history, tabs, bookmarks)
async function loadBrowserContext() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONTEXT' });
    
    if (response.success) {
      browserContext = {
        historyCount: response.data.history?.length || 0,
        tabsCount: response.data.tabs?.length || 0,
        bookmarksCount: response.data.bookmarks?.length || 0,
        history: response.data.history || [],
        tabs: response.data.tabs || [],
        bookmarks: response.data.bookmarks || []
      };
      
      console.log('[Dashboard] Browser context loaded:', {
        historyCount: browserContext.historyCount,
        tabsCount: browserContext.tabsCount,
        bookmarksCount: browserContext.bookmarksCount
      });
      
      // Recombine all items
      combineAllItems();
    }
  } catch (error) {
    console.error('[Dashboard] Error loading browser context:', error);
  }
}

// Handle tab changes
async function handleTabChange() {
  console.log('[Dashboard] Tab changed, refreshing context...');
  await loadBrowserContext();
  displayMemories(allItems);
  updateStats();
}

// Update statistics
function updateStats() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  // Total memories = stored memories + browser history + tabs + bookmarks
  const totalCount = allMemories.length + browserContext.historyCount + browserContext.tabsCount + browserContext.bookmarksCount;
  document.getElementById('totalMemories').textContent = totalCount;
  
  // Show breakdown
  const breakdownEl = document.getElementById('totalBreakdown');
  if (breakdownEl) {
    breakdownEl.textContent = `Stored: ${allMemories.length} | History: ${browserContext.historyCount} | Tabs: ${browserContext.tabsCount} | Bookmarks: ${browserContext.bookmarksCount}`;
  }
  
  // Today's memories (stored only)
  const todayCount = allMemories.filter(m => m.timestamp > now - day).length;
  document.getElementById('todayMemories').textContent = todayCount;
  
  // This week's memories (stored only)
  const weekCount = allMemories.filter(m => m.timestamp > now - (7 * day)).length;
  document.getElementById('weekMemories').textContent = weekCount;
  
  // Topics count
  const topics = new Set(allMemories.map(m => m.topic).filter(Boolean));
  document.getElementById('topicsCount').textContent = topics.size;
  
  console.log('[Dashboard] Stats updated:', {
    total: totalCount,
    stored: allMemories.length,
    history: browserContext.historyCount,
    tabs: browserContext.tabsCount,
    bookmarks: browserContext.bookmarksCount,
    today: todayCount,
    week: weekCount,
    topics: topics.size
  });
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
