// AI Chat Settings Script

let currentSettings = {};
let blockedSites = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadBlockedSites();
  setupEventListeners();
});

// Event listeners
function setupEventListeners() {
  document.getElementById('backBtn').addEventListener('click', () => window.close());
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('addBlockedSite').addEventListener('click', addBlockedSite);
  document.getElementById('testConnection').addEventListener('click', testNeoClawConnection);
  document.getElementById('cleanupBlockedSites').addEventListener('click', cleanupBlockedSites);
  
  document.getElementById('blockedSiteInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBlockedSite();
  });
}

// Load settings
async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  
  if (response.success) {
    currentSettings = response.data;
    applySettingsToUI();
  }
}

// Apply settings to UI
function applySettingsToUI() {
  document.getElementById('enableHistory').checked = currentSettings.enableHistory;
  document.getElementById('enableBookmarks').checked = currentSettings.enableBookmarks;
  document.getElementById('enableTabs').checked = currentSettings.enableTabs;
  document.getElementById('neverRememberBanking').checked = currentSettings.neverRememberBanking;
  document.getElementById('excludeWorkTabs').checked = currentSettings.excludeWorkTabs;
  document.getElementById('autoDeleteDays').value = currentSettings.autoDeleteDays;
  document.getElementById('maxMemories').value = currentSettings.maxMemories;
  document.getElementById('neoClawUrl').value = currentSettings.neoClawUrl || '';
  document.getElementById('neoClawToken').value = currentSettings.neoClawToken || '';
  document.getElementById('enablePaymentProtection').checked = currentSettings.enablePaymentProtection !== false; // Default to true
}

// Save settings
async function saveSettings() {
  const newSettings = {
    enableHistory: document.getElementById('enableHistory').checked,
    enableBookmarks: document.getElementById('enableBookmarks').checked,
    enableTabs: document.getElementById('enableTabs').checked,
    neverRememberBanking: document.getElementById('neverRememberBanking').checked,
    excludeWorkTabs: document.getElementById('excludeWorkTabs').checked,
    autoDeleteDays: parseInt(document.getElementById('autoDeleteDays').value),
    maxMemories: parseInt(document.getElementById('maxMemories').value),
    neoClawUrl: document.getElementById('neoClawUrl').value.trim(),
    neoClawToken: document.getElementById('neoClawToken').value.trim(),
    enablePaymentProtection: document.getElementById('enablePaymentProtection').checked
  };
  
  const response = await chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    settings: newSettings
  });
  
  if (response.success) {
    showStatus('✅ Settings saved successfully!', 'success');
    currentSettings = newSettings;
  } else {
    showStatus('❌ Error saving settings', 'error');
  }
}

// Reset settings
async function resetSettings() {
  if (!confirm('Reset all settings to defaults?')) {
    return;
  }
  
  const defaultSettings = {
    enableHistory: true,
    enableBookmarks: true,
    enableTabs: true,
    autoDeleteDays: 30,
    neverRememberBanking: true,
    excludeWorkTabs: false,
    maxMemories: 1000,
    neoClawUrl: 'https://ai-hacker-neoclaw.securebrowser.com',
    neoClawToken: '',
    enablePaymentProtection: true
  };
  
  const response = await chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    settings: defaultSettings
  });
  
  if (response.success) {
    currentSettings = defaultSettings;
    applySettingsToUI();
    showStatus('✅ Settings reset to defaults', 'success');
  }
}

// Load blocked sites
async function loadBlockedSites() {
  const result = await chrome.storage.local.get('ai_blocked_sites');
  blockedSites = result.ai_blocked_sites || [];
  displayBlockedSites();
}

// Display blocked sites
function displayBlockedSites() {
  const container = document.getElementById('blockedSitesList');
  
  if (blockedSites.length === 0) {
    container.innerHTML = '<div class="empty-state">No blocked sites</div>';
    return;
  }
  
  container.innerHTML = '';
  
  blockedSites.forEach((site, index) => {
    const item = document.createElement('div');
    item.className = 'blocked-site-item';
    item.innerHTML = `
      <span class="blocked-site-text">🚫 ${site}</span>
      <button class="remove-btn" data-index="${index}">×</button>
    `;
    
    item.querySelector('.remove-btn').addEventListener('click', () => removeBlockedSite(index));
    
    container.appendChild(item);
  });
}

// Add blocked site
async function addBlockedSite() {
  const input = document.getElementById('blockedSiteInput');
  const site = input.value.trim().toLowerCase();
  
  if (!site) {
    return;
  }
  
  if (blockedSites.includes(site)) {
    showStatus('⚠️ Site already blocked', 'warning');
    return;
  }
  
  blockedSites.push(site);
  await chrome.storage.local.set({ ai_blocked_sites: blockedSites });
  
  displayBlockedSites();
  input.value = '';
  showStatus('✅ Site blocked', 'success');
}

// Remove blocked site
async function removeBlockedSite(index) {
  blockedSites.splice(index, 1);
  await chrome.storage.local.set({ ai_blocked_sites: blockedSites });
  displayBlockedSites();
  showStatus('✅ Site unblocked', 'success');
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('saveStatus');
  status.textContent = message;
  status.className = `save-status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

// Test NeoClaw connection
async function testNeoClawConnection() {
  const url = document.getElementById('neoClawUrl').value.trim();
  const token = document.getElementById('neoClawToken').value.trim();
  const statusEl = document.getElementById('connectionStatus');
  
  if (!url || !token) {
    statusEl.textContent = '⚠️ Please enter both URL and token';
    statusEl.style.color = 'var(--warning-color)';
    return;
  }
  
  statusEl.textContent = '🔄 Testing...';
  statusEl.style.color = 'var(--text-light)';
  
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
    
    if (response.ok) {
      statusEl.textContent = '✅ Connected!';
      statusEl.style.color = 'var(--primary-color)';
      showStatus('✅ NeoClaw connection successful!', 'success');
    } else {
      statusEl.textContent = `❌ Error ${response.status}`;
      statusEl.style.color = 'var(--danger-color)';
      showStatus(`❌ Connection failed: ${response.status}`, 'error');
    }
  } catch (error) {
    statusEl.textContent = '❌ Connection failed';
    statusEl.style.color = 'var(--danger-color)';
    showStatus(`❌ Error: ${error.message}`, 'error');
  }
}

// Clean up blocked sites from browser history
async function cleanupBlockedSites() {
  if (!confirm('Remove all blocked sites from your browser history?\n\nThis will scan your entire browser history and delete any URLs matching your blocked sites list.')) {
    return;
  }
  
  const btn = document.getElementById('cleanupBlockedSites');
  btn.disabled = true;
  btn.textContent = '🔄 Cleaning up...';
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CLEANUP_BLOCKED_SITES' });
    
    if (response.success) {
      const count = response.deleted || 0;
      showStatus(`✅ Cleanup complete! Removed ${count} blocked sites from history`, 'success');
      btn.textContent = '🧹 Clean Up Blocked Sites from History';
    } else {
      showStatus('❌ Cleanup failed', 'error');
      btn.textContent = '🧹 Clean Up Blocked Sites from History';
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
    btn.textContent = '🧹 Clean Up Blocked Sites from History';
  } finally {
    btn.disabled = false;
  }
}
