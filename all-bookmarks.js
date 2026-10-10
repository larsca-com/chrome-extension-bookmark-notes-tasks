/**
 * All Bookmarks page logic
 * 
 * Reads Chrome's native bookmarks tree, cross-references with
 * notes/tasks stored in chrome.storage.local under "bnt_data".
 */

const STORAGE_KEY = 'bnt_data';

// DOM refs
const $grid         = document.getElementById('bookmark-grid');
const $emptyState   = document.getElementById('empty-state');
const $emptyHeading = document.getElementById('empty-heading');
const $emptyDesc    = document.getElementById('empty-desc');
const $total        = document.getElementById('bookmark-total');
const $searchInput  = document.getElementById('search-input');
const $filterBtns   = document.querySelectorAll('.filter-btn');
const $exportJson   = document.getElementById('export-json');

// Modal refs
const $overlay        = document.getElementById('modal-overlay');
const $modalClose     = document.getElementById('modal-close');
const $modalTitle     = document.getElementById('modal-page-title');
const $modalUrl       = document.getElementById('modal-page-url');
const $modalFavicon   = document.getElementById('modal-favicon');
const $modalOpen      = document.getElementById('modal-open');
const $modalNotes     = document.getElementById('modal-notes');
const $modalTasks     = document.getElementById('modal-task-list');
const $modalTaskInput = document.getElementById('modal-task-input');
const $modalDelete    = document.getElementById('modal-delete');
const $modalSave      = document.getElementById('modal-save');

let nativeBookmarks = [];  // Flat list of { id, title, url, dateAdded }
let pageData = {};          // Notes/tasks from storage
let activeFilter = 'all';
let searchQuery = '';
let editingUrl = null;
let editingBookmarkId = null;
let editingData = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadPageData();
  await loadNativeBookmarks();
  renderGrid();
  bindEvents();
});

// ---- Storage ----
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

// ---- Native Bookmarks ----
async function loadNativeBookmarks() {
  return new Promise(resolve => {
    chrome.bookmarks.getTree(tree => {
      nativeBookmarks = [];
      flattenBookmarks(tree);
      resolve();
    });
  });
}

function flattenBookmarks(nodes) {
  for (const node of nodes) {
    if (node.url) {
      nativeBookmarks.push({
        id: node.id,
        title: node.title || 'Untitled',
        url: node.url,
        dateAdded: node.dateAdded || 0
      });
    }
    if (node.children) {
      flattenBookmarks(node.children);
    }
  }
}

// ---- Merge data: native bookmarks + notes/tasks ----
function getMergedBookmarks() {
  return nativeBookmarks.map(bm => {
    const data = pageData[bm.url] || { notes: '', tasks: [] };
    return {
      id: bm.id,
      title: bm.title,
      url: bm.url,
      dateAdded: bm.dateAdded,
      notes: data.notes || '',
      tasks: data.tasks || [],
      updatedAt: data.updatedAt || bm.dateAdded
    };
  });
}

// ---- Filtering ----
function getFilteredBookmarks() {
  let entries = getMergedBookmarks();

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    entries = entries.filter(bm => {
      const inTitle = bm.title.toLowerCase().includes(q);
      const inUrl = bm.url.toLowerCase().includes(q);
      const inNotes = bm.notes.toLowerCase().includes(q);
      const inTasks = bm.tasks.some(t => t.text.toLowerCase().includes(q));
      return inTitle || inUrl || inNotes || inTasks;
    });
  }

  // Filter
  if (activeFilter === 'has-notes') {
    entries = entries.filter(bm => bm.notes.trim().length > 0);
  } else if (activeFilter === 'has-tasks') {
    entries = entries.filter(bm => bm.tasks.length > 0);
  } else if (activeFilter === 'has-pending') {
    entries = entries.filter(bm => bm.tasks.some(t => !t.done));
  }

  // Sort by most recently updated/added
  entries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return entries;
}

// ---- Render ----
function renderGrid() {
  const entries = getFilteredBookmarks();
  const totalAll = nativeBookmarks.length;

  $total.textContent = `${totalAll} bookmark${totalAll !== 1 ? 's' : ''}`;

  if (entries.length === 0) {
    $grid.innerHTML = '';
    $emptyState.classList.remove('hidden');

    if (totalAll === 0) {
      $emptyHeading.textContent = 'No bookmarks yet';
      $emptyDesc.textContent = 'Visit a page and bookmark it via the extension or Chrome to get started.';
    } else {
      $emptyHeading.textContent = 'No results found';
      $emptyDesc.textContent = 'Try adjusting your search or filter.';
    }
    return;
  }

  $emptyState.classList.add('hidden');

  $grid.innerHTML = entries.map((bm, i) => {
    const tasks = bm.tasks;
    const done = tasks.filter(t => t.done).length;
    const pending = tasks.length - done;
    const hasNotes = bm.notes.trim().length > 0;

    // Favicon from Chrome's local cache via the built-in favicon API (no network request)
    let faviconUrl = '';
    try {
      faviconUrl = faviconURL(bm.url);
    } catch {}

    const favicon = faviconUrl
      ? `<img src="${escapeAttr(faviconUrl)}" alt="">`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;

    return `
      <div class="bookmark-card" data-url="${escapeAttr(bm.url)}" data-id="${bm.id}" style="animation-delay: ${i * 0.04}s">
        <div class="card-favicon">${favicon}</div>
        <div class="card-body">
          <div class="card-title" title="Click to expand">${escapeHtml(bm.title)}</div>
          <a class="card-url" href="${escapeAttr(bm.url)}" target="_blank" rel="noopener" title="Open in new tab">${escapeHtml(bm.url)}</a>
          ${hasNotes ? `
          <div class="card-notes-preview">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span class="card-notes-text">${escapeHtml(bm.notes)}</span>
          </div>` : ''}
          <div class="card-tags">
            ${tasks.length > 0 ? `<span class="card-tag tag-tasks">${pending} pending</span>` : ''}
            ${done > 0 ? `<span class="card-tag tag-done">${done} done</span>` : ''}
            <span class="card-tag tag-date">${timeAgo(bm.updatedAt || bm.dateAdded)}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="card-visit" title="Open in new tab" aria-label="Open in new tab">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <path d="M15 3h6v6"/>
              <path d="M10 14L21 3"/>
            </svg>
          </button>
          <button class="card-remove" data-id="${bm.id}" title="Remove bookmark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <div class="card-open">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Events ----
function bindEvents() {
  $searchInput.addEventListener('input', () => {
    searchQuery = $searchInput.value.trim();
    renderGrid();
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      $searchInput.focus();
    }
    if (e.key === 'Escape' && !$overlay.classList.contains('hidden')) {
      closeModal();
    }
  });

  $filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      $filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderGrid();
    });
  });

  $exportJson.addEventListener('click', exportJson);

  // Card click -> open page / remove / expand / open modal
  $grid.addEventListener('click', e => {
    const card = e.target.closest('.bookmark-card');
    if (!card) return;

    if (e.target.closest('.card-visit, .card-url')) {
      e.preventDefault();
      openInNewTab(card.dataset.url, e);
      return;
    }

    const removeBtn = e.target.closest('.card-remove');
    if (removeBtn) {
      if (!removeBtn.classList.contains('confirm')) {
        removeBtn.classList.add('confirm');
        removeBtn.title = 'Click again to confirm';
        setTimeout(() => {
          removeBtn.classList.remove('confirm');
          removeBtn.title = 'Remove bookmark';
        }, 2500);
        return;
      }
      removeBookmark(card.dataset.id, card.dataset.url);
      return;
    }

    // Clicking the title toggles full-text expansion instead of opening the modal
    if (e.target.closest('.card-title')) {
      card.classList.toggle('expanded');
      return;
    }

    openModal(card.dataset.url, card.dataset.id);
  });

  $modalClose.addEventListener('click', closeModal);
  $modalOpen.addEventListener('click', e => openInNewTab(editingUrl, e));
  $modalUrl.addEventListener('click', e => {
    e.preventDefault();
    openInNewTab(editingUrl, e);
  });
  $overlay.addEventListener('click', e => {
    if (e.target === $overlay) closeModal();
  });

  // Save
  $modalSave.addEventListener('click', () => {
    if (!editingUrl) return;
    if (!pageData[editingUrl]) {
      pageData[editingUrl] = { notes: '', tasks: [], updatedAt: Date.now() };
    }
    pageData[editingUrl].notes = $modalNotes.value;
    pageData[editingUrl].tasks = editingData.tasks;
    pageData[editingUrl].updatedAt = Date.now();
    savePageData();
    closeModal();
    renderGrid();
  });

  // Delete (removes native bookmark + data)
  $modalDelete.addEventListener('click', async () => {
    if (!editingUrl || !editingBookmarkId) return;
    const id = editingBookmarkId;
    const url = editingUrl;
    closeModal();
    await removeBookmark(id, url);
  });

  // Add task in modal
  $modalTaskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && $modalTaskInput.value.trim()) {
      editingData.tasks.push({
        id: generateId(),
        text: $modalTaskInput.value.trim(),
        done: false,
        createdAt: Date.now()
      });
      $modalTaskInput.value = '';
      renderModalTasks();
    }
  });

  // Task actions in modal
  $modalTasks.addEventListener('click', e => {
    const cb = e.target.closest('.modal-task-checkbox');
    const del = e.target.closest('.modal-task-delete');
    if (cb) {
      const task = editingData.tasks.find(t => t.id === cb.dataset.id);
      if (task) { task.done = !task.done; renderModalTasks(); }
    } else if (del) {
      editingData.tasks = editingData.tasks.filter(t => t.id !== del.dataset.id);
      renderModalTasks();
    }
  });
}

// ---- Remove bookmark (native bookmark + stored notes/tasks) ----
async function removeBookmark(bookmarkId, url) {
  try {
    await new Promise(resolve => chrome.bookmarks.remove(bookmarkId, resolve));
  } catch {}
  delete pageData[url];
  await savePageData();
  await loadNativeBookmarks();
  renderGrid();
}

// ---- Open bookmark ----
// Ctrl/Cmd-click opens the page in a background tab, like a regular link.
function openInNewTab(url, e) {
  if (!url) return;
  const background = !!e && (e.ctrlKey || e.metaKey);
  chrome.tabs.create({ url, active: !background });
}

// ---- Export ----
// Downloads every bookmark with its notes and tasks as one JSON file.
// Built from a local blob, so it needs no extra permission and no network.
function exportJson() {
  const toIso = ts => (ts ? new Date(ts).toISOString() : null);

  const bookmarks = getMergedBookmarks()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map(bm => ({
      title: bm.title,
      url: bm.url,
      notes: bm.notes,
      tasks: bm.tasks.map(t => ({
        text: t.text,
        done: !!t.done,
        createdAt: toIso(t.createdAt)
      })),
      dateAdded: toIso(bm.dateAdded),
      updatedAt: toIso(pageData[bm.url] && pageData[bm.url].updatedAt)
    }));

  const payload = {
    source: 'Bookmark Notes & Tasks',
    version: chrome.runtime.getManifest().version,
    exportedAt: new Date().toISOString(),
    count: bookmarks.length,
    bookmarks
  };

  const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `bookmark-notes-${localDateStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function localDateStamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---- Modal ----
function openModal(url, bookmarkId) {
  editingUrl = url;
  editingBookmarkId = bookmarkId;

  const bm = nativeBookmarks.find(b => b.url === url);
  const data = pageData[url] || { notes: '', tasks: [] };
  editingData = { tasks: JSON.parse(JSON.stringify(data.tasks || [])) };

  $modalTitle.textContent = bm ? bm.title : 'Untitled';
  $modalUrl.textContent = url;
  $modalUrl.href = url;
  $modalNotes.value = data.notes || '';

  let faviconUrl = '';
  try {
    faviconUrl = faviconURL(url);
  } catch {}

  if (faviconUrl) {
    $modalFavicon.innerHTML = `<img src="${escapeAttr(faviconUrl)}" alt="">`;
  } else {
    $modalFavicon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  }

  renderModalTasks();
  $overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $overlay.classList.add('hidden');
  document.body.style.overflow = '';
  editingUrl = null;
  editingBookmarkId = null;
  editingData = null;
}

function renderModalTasks() {
  if (!editingData) return;

  $modalTasks.innerHTML = editingData.tasks.map(task => `
    <li class="modal-task-item${task.done ? ' completed' : ''}">
      <input type="checkbox" class="modal-task-checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}">
      <span class="modal-task-text">${escapeHtml(task.text)}</span>
      <button class="modal-task-delete" data-id="${task.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </li>
  `).join('');
}

// ---- Helpers ----
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Build a favicon URL served locally by Chrome's favicon API (no third-party request).
function faviconURL(pageUrl, size = 32) {
  const u = new URL(chrome.runtime.getURL('/_favicon/'));
  u.searchParams.set('pageUrl', pageUrl);
  u.searchParams.set('size', String(size));
  return u.toString();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function timeAgo(ts) {
  if (!ts) return '';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
