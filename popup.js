/**
 * Bookmark Notes & Tasks - Popup Logic
 * 
 * Native bookmark integration:
 *   - Bookmark state is tied to Chrome's native bookmarks (chrome.bookmarks API)
 *   - Notes & tasks are stored in chrome.storage.local keyed by URL
 * 
 * Storage schema:
 *   "bnt_data" -> { [url]: { notes, tasks: [{id, text, done, createdAt}], updatedAt } }
 */

const STORAGE_KEY = 'bnt_data';

// ---- DOM refs ----
const $pageTitle   = document.getElementById('page-title');
const $pageUrl     = document.getElementById('page-url');
const $pageFavicon = document.getElementById('page-favicon');

const $stateUnbookmarked = document.getElementById('state-unbookmarked');
const $stateBookmarked   = document.getElementById('state-bookmarked');
const $stateSettings     = document.getElementById('state-settings');

const $btnBookmark       = document.getElementById('btn-bookmark');
const $btnRemoveBookmark = document.getElementById('btn-remove-bookmark');
const $btnAllBookmarks   = document.getElementById('btn-all-bookmarks');
const $btnSettings       = document.getElementById('btn-settings');
const $btnBackSettings   = document.getElementById('btn-back-settings');
const $btnGoogleLogin    = document.getElementById('btn-google-login');

const $notesInput = document.getElementById('notes-input');
const $taskList   = document.getElementById('task-list');
const $taskInput  = document.getElementById('task-input');
const $taskCount  = document.getElementById('task-count');
const $toast      = document.getElementById('toast');

// ---- State ----
let currentTab = null;
let nativeBookmarkId = null;
let pageData = {};
let saveTimer = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await getCurrentTab();
  await loadPageData();
  await checkNativeBookmark();
  render();
  bindEvents();
});

// ---- Storage helpers (notes & tasks only) ----
async function loadPageData() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, result => {
      pageData = result[STORAGE_KEY] || {};
      resolve();
    });
  });
}

async function savePageData() {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: pageData }, resolve);
  });
}

function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => savePageData(), 300);
}

// ---- Native bookmark helpers ----
async function checkNativeBookmark() {
  if (!currentTab) return;
  return new Promise(resolve => {
    chrome.bookmarks.search({ url: currentTab.url }, results => {
      if (results && results.length > 0) {
        nativeBookmarkId = results[0].id;
      } else {
        nativeBookmarkId = null;
      }
      resolve();
    });
  });
}

async function createNativeBookmark() {
  if (!currentTab) return;
  return new Promise(resolve => {
    chrome.bookmarks.create({
      title: currentTab.title,
      url: currentTab.url
    }, bookmark => {
      nativeBookmarkId = bookmark.id;
      resolve(bookmark);
    });
  });
}

async function removeNativeBookmark() {
  if (!nativeBookmarkId) return;
  return new Promise(resolve => {
    chrome.bookmarks.remove(nativeBookmarkId, () => {
      nativeBookmarkId = null;
      resolve();
    });
  });
}

// ---- Tab helpers ----
async function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        currentTab = {
          url: tabs[0].url,
          title: tabs[0].title || 'Untitled',
          favicon: tabs[0].favIconUrl || ''
        };
      }
      resolve();
    });
  });
}

// ---- Render ----
function render() {
  if (!currentTab) {
    $pageTitle.textContent = 'Unable to access page';
    $pageUrl.textContent = '';
    return;
  }

  $pageTitle.textContent = currentTab.title;
  $pageUrl.textContent = currentTab.url;

  if (currentTab.favicon) {
    $pageFavicon.innerHTML = `<img src="${currentTab.favicon}" alt="">`;
  } else {
    $pageFavicon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  const isBookmarked = !!nativeBookmarkId;

  $stateUnbookmarked.classList.toggle('hidden', isBookmarked);
  $stateBookmarked.classList.toggle('hidden', !isBookmarked);
  $stateSettings.classList.add('hidden');

  if (isBookmarked) {
    renderBookmarkedState();
  }
}

function renderBookmarkedState() {
  const url = currentTab.url;
  const entry = pageData[url] || { notes: '', tasks: [] };

  if (!pageData[url]) {
    pageData[url] = { notes: '', tasks: [], updatedAt: Date.now() };
    savePageData();
  }

  $notesInput.value = entry.notes || '';
  autoResizeTextarea();
  renderTasks(entry.tasks || []);

  if (entry.tasks && entry.tasks.length > 0) {
    $taskInput.placeholder = 'Add another task...';
  } else {
    $taskInput.placeholder = 'Add your first task for this page';
  }
}

function renderTasks(tasks) {
  $taskList.innerHTML = '';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' completed' : ''}`;
    li.style.animationDelay = `${index * 0.04}s`;

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}">
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="task-delete" data-id="${task.id}" title="Delete task">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    $taskList.appendChild(li);
  });

  updateTaskCount(tasks);
}

function updateTaskCount(tasks) {
  if (!tasks || tasks.length === 0) {
    $taskCount.textContent = '';
    return;
  }
  const done = tasks.filter(t => t.done).length;
  $taskCount.textContent = `${done}/${tasks.length} done`;
}

// ---- Event Bindings ----
function bindEvents() {
  // Bookmark page -> creates a real Chrome bookmark
  $btnBookmark.addEventListener('click', async () => {
    if (!currentTab) return;
    await createNativeBookmark();

    if (!pageData[currentTab.url]) {
      pageData[currentTab.url] = { notes: '', tasks: [], updatedAt: Date.now() };
      await savePageData();
    }

    render();
    showToast('Bookmarked in Chrome!');
  });

  // Remove bookmark -> removes from Chrome bookmarks + cleans data
  $btnRemoveBookmark.addEventListener('click', async () => {
    if (!currentTab) return;
    await removeNativeBookmark();
    delete pageData[currentTab.url];
    await savePageData();
    render();
    showToast('Bookmark removed from Chrome');
  });

  // Notes auto-save
  $notesInput.addEventListener('input', () => {
    if (!currentTab || !nativeBookmarkId) return;
    if (!pageData[currentTab.url]) {
      pageData[currentTab.url] = { notes: '', tasks: [], updatedAt: Date.now() };
    }
    pageData[currentTab.url].notes = $notesInput.value;
    pageData[currentTab.url].updatedAt = Date.now();
    autoResizeTextarea();
    debouncedSave();
  });

  // Add task on Enter
  $taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && $taskInput.value.trim()) {
      addTask($taskInput.value.trim());
      $taskInput.value = '';
    }
  });

  // Task checkbox / delete
  $taskList.addEventListener('click', e => {
    const checkbox = e.target.closest('.task-checkbox');
    const deleteBtn = e.target.closest('.task-delete');
    if (checkbox) toggleTask(checkbox.dataset.id);
    else if (deleteBtn) deleteTask(deleteBtn.dataset.id);
  });

  // View all bookmarks
  $btnAllBookmarks.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('all-bookmarks.html') });
  });

  // Settings
  $btnSettings.addEventListener('click', () => {
    $stateUnbookmarked.classList.add('hidden');
    $stateBookmarked.classList.add('hidden');
    $stateSettings.classList.remove('hidden');
    $btnSettings.classList.add('active');
  });

  $btnBackSettings.addEventListener('click', () => {
    $stateSettings.classList.add('hidden');
    $btnSettings.classList.remove('active');
    render();
  });

  $btnGoogleLogin.addEventListener('click', () => {
    showToast('Google Sync coming in Phase 2');
  });
}

// ---- Task actions ----
function addTask(text) {
  if (!currentTab || !nativeBookmarkId) return;

  if (!pageData[currentTab.url]) {
    pageData[currentTab.url] = { notes: '', tasks: [], updatedAt: Date.now() };
  }

  pageData[currentTab.url].tasks.push({
    id: generateId(),
    text,
    done: false,
    createdAt: Date.now()
  });
  pageData[currentTab.url].updatedAt = Date.now();
  savePageData();
  renderBookmarkedState();
  showToast('Task added');
}

function toggleTask(id) {
  if (!currentTab || !pageData[currentTab.url]) return;
  const task = pageData[currentTab.url].tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    pageData[currentTab.url].updatedAt = Date.now();
    savePageData();
    renderBookmarkedState();
  }
}

function deleteTask(id) {
  if (!currentTab || !pageData[currentTab.url]) return;
  pageData[currentTab.url].tasks = pageData[currentTab.url].tasks.filter(t => t.id !== id);
  pageData[currentTab.url].updatedAt = Date.now();
  savePageData();
  renderBookmarkedState();
}

// ---- Helpers ----
function autoResizeTextarea() {
  $notesInput.style.height = 'auto';
  const lineHeight = parseFloat(getComputedStyle($notesInput).lineHeight);
  const maxHeight = lineHeight * 4 + 22;
  const scrollH = $notesInput.scrollHeight;
  $notesInput.style.height = Math.min(scrollH, maxHeight) + 'px';
  $notesInput.style.overflowY = scrollH > maxHeight ? 'auto' : 'hidden';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  $toast.textContent = msg;
  $toast.classList.remove('hidden');
  void $toast.offsetWidth;
  $toast.classList.add('visible');
  setTimeout(() => {
    $toast.classList.remove('visible');
    setTimeout(() => $toast.classList.add('hidden'), 300);
  }, 1800);
}
