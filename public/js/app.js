// API Base URL
const API_URL = '/api';

// State
let currentUser = null;
let currentJournal = null;
let isEditing = false;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const publicScreen = document.getElementById('public-screen');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Auth Functions
function checkAuth() {
  const token = localStorage.getItem('journal_token');
  const username = localStorage.getItem('journal_username');

  if (token && username) {
    currentUser = { username };
    showMainScreen();
    loadJournals();
  } else {
    showLoginScreen();
  }
}

function showLogin() {
  loginScreen.style.display = 'flex';
  publicScreen.style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
  loginScreen.style.display = 'flex';
  publicScreen.style.display = 'none';
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showToast('Please enter username and password', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('journal_token', data.token);
    localStorage.setItem('journal_username', data.username);
    currentUser = { username: data.username };
    
    showMainScreen();
    loadJournals();
    showToast('Welcome back!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function register() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const passwordConfirm = document.getElementById('reg-password-confirm').value;

  if (!username || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (password !== passwordConfirm) {
    showToast('Passwords do not match', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    localStorage.setItem('journal_token', data.token);
    localStorage.setItem('journal_username', data.username);
    currentUser = { username: data.username };
    
    showMainScreen();
    loadJournals();
    showToast('Account created successfully!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function logout() {
  localStorage.removeItem('journal_token');
  localStorage.removeItem('journal_username');
  currentUser = null;
  showPublicScreen();
  loadPublicJournals();
  showToast('Logged out successfully', 'success');
}

// Screen Management
function showMainScreen() {
  loginScreen.style.display = 'none';
  publicScreen.style.display = 'none';
  mainScreen.style.display = 'block';
  document.getElementById('welcome-user').textContent = `Hi, ${currentUser.username}`;
  
  // Show journal list on desktop, hide on mobile initially
  const isMobile = window.innerWidth <= 768;
  const panel = document.getElementById('journal-panel');
  if (panel) {
    panel.classList.toggle('show', !isMobile);
  }
}

function showPublicScreen() {
  loginScreen.style.display = 'none';
  mainScreen.style.display = 'none';
  publicScreen.style.display = 'block';
}

function showLoginScreen() {
  loginScreen.style.display = 'flex';
  mainScreen.style.display = 'none';
  publicScreen.style.display = 'none';
}

function toggleJournalList() {
  const panel = document.getElementById('journal-panel');
  if (panel) {
    panel.classList.toggle('show');
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth <= 768;
  const panel = document.getElementById('journal-panel');
  if (panel) {
    if (!isMobile) {
      panel.style.display = 'block';
    }
  }
});

// Journal Functions
async function loadJournals() {
  try {
    const response = await fetch(`${API_URL}/journals`, {
      headers: getAuthHeaders()
    });
    const journals = await response.json();
    
    const list = document.getElementById('journal-list');
    list.innerHTML = journals.map(j => `
      <div class="journal-item ${currentJournal?.id === j.id ? 'active' : ''}" 
           onclick="viewJournal(${j.id})">
        <div class="journal-item-title">${escapeHtml(j.title) || 'Untitled'}</div>
        <div class="journal-item-meta">
          <span>${formatDate(j.created_at)}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load journals:', error);
  }
}

async function loadPublicJournals() {
  try {
    const response = await fetch(`${API_URL}/journals`);
    const journals = await response.json();
    
    const list = document.getElementById('public-journal-list');
    list.innerHTML = journals.map(j => `
      <div class="journal-item ${currentJournal?.id === j.id ? 'active' : ''}" 
           onclick="viewPublicJournal(${j.id})">
        <div class="journal-item-title">${escapeHtml(j.title) || 'Untitled'}</div>
        <div class="journal-item-meta">
          <span>${formatDate(j.created_at)}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load public journals:', error);
  }
}

async function viewJournal(id) {
  try {
    const response = await fetch(`${API_URL}/journals/${id}`, {
      headers: getAuthHeaders()
    });
    const journal = await response.json();
    
    currentJournal = journal;
    showJournalView(journal, true);
    loadJournals(); // Refresh active state
  } catch (error) {
    showToast('Failed to load journal', 'error');
  }
}

async function viewPublicJournal(id) {
  try {
    const response = await fetch(`${API_URL}/journals/${id}`);
    const journal = await response.json();
    
    currentJournal = journal;
    showJournalView(journal, false);
    loadPublicJournals(); // Refresh active state
  } catch (error) {
    showToast('Failed to load journal', 'error');
  }
}

function showJournalView(journal, isOwner) {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('journal-view').style.display = 'block';
  document.getElementById('journal-editor').style.display = 'none';
  
  document.getElementById('view-title').textContent = journal.title || 'Untitled';
  document.getElementById('view-date').textContent = formatDate(journal.created_at);
  document.getElementById('view-content').textContent = journal.content;
  
  document.getElementById('owner-actions').style.display = isOwner ? 'flex' : 'none';
}

function showEditor(journal = null) {
  currentJournal = journal;
  isEditing = true;
  
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('journal-view').style.display = 'none';
  document.getElementById('journal-editor').style.display = 'block';
  
  document.getElementById('edit-title').value = journal?.title || '';
  document.getElementById('edit-content').value = journal?.content || '';
  
  document.getElementById('grammar-suggestions').style.display = 'none';
  
  // Auto-check grammar when typing
  const contentField = document.getElementById('edit-content');
  contentField.oninput = debounce(() => checkGrammar(), 300);
  
  // Check immediately when opening
  setTimeout(() => checkGrammar(), 100);
}

function editJournal() {
  if (!currentJournal) return;
  showEditor(currentJournal);
}

function cancelEdit() {
  isEditing = false;
  currentJournal = null;
  
  loadJournals();
  
  document.getElementById('empty-state').style.display = 'flex';
  document.getElementById('journal-view').style.display = 'none';
  document.getElementById('journal-editor').style.display = 'none';
}

async function saveJournal() {
  let title = document.getElementById('edit-title').value;
  const content = document.getElementById('edit-content').value;

  if (!content.trim()) {
    showToast('Please write something before saving', 'error');
    return;
  }

  // Auto-generate title from first line if empty
  if (!title.trim()) {
    const firstLine = content.split('\n')[0].trim();
    title = firstLine.substring(0, 50); // Use first 50 chars
    if (firstLine.length > 50) title += '...';
  }

  try {
    const url = currentJournal 
      ? `${API_URL}/journals/${currentJournal.id}`
      : `${API_URL}/journals`;
    const method = currentJournal ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });

    if (!response.ok) {
      throw new Error('Failed to save journal');
    }

    showToast(currentJournal ? 'Journal updated!' : 'Journal created!', 'success');
    loadJournals();
    
    // View the saved journal
    const data = await response.json();
    if (!currentJournal) {
      viewJournal(data.id);
    } else {
      viewJournal(currentJournal.id);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteJournal() {
  if (!currentJournal) return;
  
  if (!confirm('Are you sure you want to delete this journal? This cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/journals/${currentJournal.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete journal');
    }

    showToast('Journal deleted', 'success');
    currentJournal = null;
    loadJournals();
    
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('journal-view').style.display = 'none';
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Grammar Checking (checks ALL English text, ignores Chinese setting)
function checkGrammar() {
  const content = document.getElementById('edit-content').value;
  
  if (!content.trim()) {
    document.getElementById('grammar-suggestions').style.display = 'none';
    return;
  }

  // Always check for English errors if English text exists
  const hasEnglish = /[a-zA-Z]/.test(content);
  
  if (!hasEnglish) {
    document.getElementById('grammar-suggestions').style.display = 'none';
    return;
  }

  const suggestions = analyzeGrammar(content);
  
  if (suggestions.length > 0) {
    document.getElementById('grammar-suggestions').style.display = 'block';
    document.getElementById('grammar-list').innerHTML = suggestions.map((s, index) => `
      <div class="grammar-item" onclick="applyGrammarFix(${index})" style="cursor: pointer;">
        <span class="original">${escapeHtml(s.original)}</span>
        → 
        <span class="suggestion">${escapeHtml(s.suggestion)}</span>
        <br><small style="color: #666;">${s.reason}</small>
      </div>
    `).join('');
    
    window.pendingGrammarSuggestions = suggestions;
  } else {
    document.getElementById('grammar-suggestions').style.display = 'none';
  }
}

function analyzeGrammar(text) {
  const suggestions = [];
  const sentences = text.split(/[.!?]+/);
  
  // Common patterns to check (more comprehensive)
  const patterns = [
    { regex: /\bi\b/g, suggestion: 'I', reason: 'Capitalize pronoun "I"' },
    { regex: /\bi'm\b/gi, suggestion: "I'm", reason: 'Capital contraction' },
    { regex: /\bi've\b/gi, suggestion: "I've", reason: 'Capital contraction' },
    { regex: /\bi'll\b/gi, suggestion: "I'll", reason: 'Capital contraction' },
    { regex: /\bi'd\b/gi, suggestion: "I'd", reason: 'Capital contraction' },
    { regex: /\bwaht\b/gi, suggestion: 'What', reason: 'Typo' },
    { regex: /\bwehre\b/gi, suggestion: 'where', reason: 'Typo' },
    { regex: /\bhte\b/gi, suggestion: 'the', reason: 'Typo' },
    { regex: /\bteh\b/gi, suggestion: 'the', reason: 'Typo' },
    { regex: /\brecieved\b/gi, suggestion: 'received', reason: 'Spelling' },
    { regex: /\bdefinately\b/gi, suggestion: 'definitely', reason: 'Spelling' },
    { regex: /\baccomodate\b/gi, suggestion: 'accommodate', reason: 'Spelling' },
    { regex: /\bseperate\b/gi, suggestion: 'separate', reason: 'Spelling' },
    { regex: /\boccured\b/gi, suggestion: 'occurred', reason: 'Spelling' },
    { regex: /\brefering\b/gi, suggestion: 'referring', reason: 'Spelling' },
    { regex: /\bwritting\b/gi, suggestion: 'writing', reason: 'Spelling' },
    { regex: /\buntill\b/gi, suggestion: 'until', reason: 'Spelling' },
    { regex: /\bbegining\b/gi, suggestion: 'beginning', reason: 'Spelling' },
    { regex: /\bcalender\b/gi, suggestion: 'calendar', reason: 'Spelling' },
    { regex: /\bcollegue\b/gi, suggestion: 'colleague', reason: 'Spelling' },
    { regex: /\bcommitee\b/gi, suggestion: 'committee', reason: 'Spelling' },
    { regex: /\bconcious\b/gi, suggestion: 'conscious', reason: 'Spelling' },
    { regex: /\bembarass\b/gi, suggestion: 'embarrass', reason: 'Spelling' },
    { regex: /\benviroment\b/gi, suggestion: 'environment', reason: 'Spelling' },
    { regex: /\bforegin\b/gi, suggestion: 'foreign', reason: 'Spelling' },
    { regex: /\bgoverment\b/gi, suggestion: 'government', reason: 'Spelling' },
    { regex: /\bgrammer\b/gi, suggestion: 'grammar', reason: 'Spelling' },
    { regex: /\bhappend\b/gi, suggestion: 'happened', reason: 'Spelling' },
    { regex: /\bimmediatly\b/gi, suggestion: 'immediately', reason: 'Spelling' },
    { regex: /\bknowlege\b/gi, suggestion: 'knowledge', reason: 'Spelling' },
    { regex: /\bliek\b/gi, suggestion: 'like', reason: 'Spelling' },
    { regex: /\bmanagment\b/gi, suggestion: 'management', reason: 'Spelling' },
    { regex: /\bmisile\b/gi, suggestion: 'missile', reason: 'Spelling' },
    { regex: /\bneccessary\b/gi, suggestion: 'necessary', reason: 'Spelling' },
    { regex: /\bnoticable\b/gi, suggestion: 'noticeable', reason: 'Spelling' },
    { regex: /\boccassion\b/gi, suggestion: 'occasion', reason: 'Spelling' },
    { regex: /\bparalell\b/gi, suggestion: 'parallel', reason: 'Spelling' },
    { regex: /\bpersistant\b/gi, suggestion: 'persistent', reason: 'Spelling' },
    { regex: /\bposession\b/gi, suggestion: 'possession', reason: 'Spelling' },
    { regex: /\bprivelege\b/gi, suggestion: 'privilege', reason: 'Spelling' },
    { regex: /\bpublically\b/gi, suggestion: 'publicly', reason: 'Spelling' },
    { regex: /\brealy\b/gi, suggestion: 'really', reason: 'Spelling' },
    { regex: /\brecieve\b/gi, suggestion: 'receive', reason: 'Spelling' },
    { regex: /\brecomend\b/gi, suggestion: 'recommend', reason: 'Spelling' },
    { regex: /\brelevent\b/gi, suggestion: 'relevant', reason: 'Spelling' },
    { regex: /\brythm\b/gi, suggestion: 'rhythm', reason: 'Spelling' },
    { regex: /\bshoun't\b/gi, suggestion: "shouldn't", reason: 'Typo' },
    { regex: /\bsimilier\b/gi, suggestion: 'similar', reason: 'Spelling' },
    { regex: /\bsuccesful\b/gi, suggestion: 'successful', reason: 'Spelling' },
    { regex: /\bsuprise\b/gi, suggestion: 'surprise', reason: 'Spelling' },
    { regex: /\btemperary\b/gi, suggestion: 'temporary', reason: 'Spelling' },
    { regex: /\btruely\b/gi, suggestion: 'truly', reason: 'Spelling' },
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      suggestions.push({
        original: match[0],
        suggestion: pattern.suggestion || pattern.replacement,
        reason: pattern.reason
      });
    }
  });

  // Check sentence capitalization
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0 && trimmed[0] === trimmed[0].toLowerCase() && /^[a-z]/.test(trimmed)) {
      // Skip if it starts with a number or quote
      if (!/^[\d"\']/.test(trimmed)) {
        suggestions.push({
          original: trimmed[0],
          suggestion: trimmed[0].toUpperCase(),
          reason: 'Start sentence with capital letter'
        });
      }
    }
  });

  return suggestions.slice(0, 8); // Limit to 8 suggestions
}

// Apply grammar fix when clicked
function applyGrammarFix(index) {
  const suggestion = window.pendingGrammarSuggestions?.[index];
  if (!suggestion) return;
  
  const contentField = document.getElementById('edit-content');
  const newContent = contentField.value.replace(suggestion.original, suggestion.suggestion);
  contentField.value = newContent;
  
  // Re-check grammar after fix
  checkGrammar();
  
  showToast(`Applied: "${suggestion.original}" → "${suggestion.suggestion}"`, 'success');
}

// Stats
async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: getAuthHeaders()
    });
    const stats = await response.json();
    
    document.getElementById('stat-created').textContent = stats.weekly?.weekly_created || 0;
    document.getElementById('stat-updated').textContent = stats.weekly?.weekly_updated || 0;
    document.getElementById('stat-deleted').textContent = stats.weekly?.weekly_deleted || 0;
    
    toggleStats(true);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

function toggleStats(show = null) {
  const panel = document.getElementById('stats-panel');
  panel.style.display = show ?? panel.style.display === 'none' ? 'block' : 'none';
}

// Utility Functions
function getAuthHeaders() {
  const token = localStorage.getItem('journal_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getLangLabel(lang) {
  const labels = { 'mixed': 'Mixed', 'zh': '中文', 'en': 'English' };
  return labels[lang] || lang;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Make functions globally available
window.login = login;
window.register = register;
window.logout = logout;
window.viewJournal = viewJournal;
window.viewPublicJournal = viewPublicJournal;
window.showEditor = showEditor;
window.editJournal = editJournal;
window.cancelEdit = cancelEdit;
window.saveJournal = saveJournal;
window.deleteJournal = deleteJournal;
window.loadStats = loadStats;
window.toggleStats = toggleStats;
window.showLogin = showLogin;
window.showRegister = showRegister;
