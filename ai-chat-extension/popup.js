// AI Chat Popup Script

let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  loadContextStats();
  loadChatHistory();
  
  // Event listeners
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'settings.html' });
  });
  
  document.getElementById('clearChatBtn').addEventListener('click', clearChat);
});

// Load context stats
async function loadContextStats() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_CONTEXT' });
  
  if (response.success) {
    const context = response.data;
    document.getElementById('historyCount').textContent = context.history.length;
    document.getElementById('tabsCount').textContent = context.tabs.length;
    document.getElementById('memoriesCount').textContent = context.memories.length;
  }
}

// Load chat history
function loadChatHistory() {
  const stored = localStorage.getItem('ai_chat_history');
  if (stored) {
    chatHistory = JSON.parse(stored);
    chatHistory.forEach(msg => displayMessage(msg.role, msg.content, false));
  }
}

// Send message
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Display user message
  displayMessage('user', message);
  chatHistory.push({ role: 'user', content: message, timestamp: Date.now() });
  
  input.value = '';
  input.disabled = true;
  document.getElementById('sendBtn').disabled = true;
  
  // Show typing indicator
  const typingId = displayTyping();
  
  try {
    // Send to background
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_CHAT',
      message: message
    });
    
    removeTyping(typingId);
    
    if (response.success) {
      displayMessage('ai', response.data.message);
      chatHistory.push({ 
        role: 'ai', 
        content: response.data.message, 
        timestamp: Date.now() 
      });
      
      // Update context stats
      if (response.data.context) {
        document.getElementById('historyCount').textContent = response.data.context.historyCount;
        document.getElementById('tabsCount').textContent = response.data.context.tabsCount;
        document.getElementById('memoriesCount').textContent = response.data.context.memoriesCount;
      }
    } else {
      displayMessage('error', 'Sorry, there was an error processing your message.');
    }
  } catch (error) {
    removeTyping(typingId);
    displayMessage('error', 'Error: ' + error.message);
  }
  
  // Save chat history
  localStorage.setItem('ai_chat_history', JSON.stringify(chatHistory));
  
  input.disabled = false;
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}

// Display message
function displayMessage(role, content, scroll = true) {
  const messagesContainer = document.getElementById('chatMessages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? '👤' : role === 'ai' ? '🤖' : '⚠️';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString();
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timeDiv);
  
  messagesContainer.appendChild(messageDiv);
  
  if (scroll) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Display typing indicator
function displayTyping() {
  const messagesContainer = document.getElementById('chatMessages');
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message message-ai typing-indicator';
  typingDiv.id = 'typing-' + Date.now();
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = '🤖';
  
  const dotsDiv = document.createElement('div');
  dotsDiv.className = 'typing-dots';
  dotsDiv.innerHTML = '<span></span><span></span><span></span>';
  
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(dotsDiv);
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return typingDiv.id;
}

// Remove typing indicator
function removeTyping(id) {
  const typing = document.getElementById(id);
  if (typing) typing.remove();
}

// Clear chat
function clearChat() {
  if (confirm('Clear all chat messages?')) {
    chatHistory = [];
    localStorage.removeItem('ai_chat_history');
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h2>Chat cleared!</h2>
        <p>Start a new conversation.</p>
        <div class="context-stats" id="contextStats">
          <span class="stat">📜 <span id="historyCount">0</span> history</span>
          <span class="stat">📑 <span id="tabsCount">0</span> tabs</span>
          <span class="stat">💾 <span id="memoriesCount">0</span> memories</span>
        </div>
      </div>
    `;
    
    loadContextStats();
  }
}
