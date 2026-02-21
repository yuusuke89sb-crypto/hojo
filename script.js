// ===== State Management =====
const STORAGE_KEY = 'hojosya_checklist_state';
const HEARING_KEY = 'hojosya_hearing_data';

function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadHearingData() {
  try {
    const data = localStorage.getItem(HEARING_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveHearingData(data) {
  localStorage.setItem(HEARING_KEY, JSON.stringify(data));
}

// ===== Tab Navigation =====
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
}

// ===== Checklist Logic =====
function initChecklists() {
  const state = loadState();
  const items = document.querySelectorAll('.checklist-item');

  items.forEach(item => {
    const id = item.dataset.id;
    const checkbox = item.querySelector('.custom-checkbox');

    // Restore state
    if (state[id]) {
      item.classList.add('checked');
      checkbox.textContent = '✓';
    }

    // Click handler
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleItem(item, id);
    });

    item.addEventListener('click', () => {
      toggleItem(item, id);
    });
  });

  updateProgress();
  updateSectionCounts();
}

function toggleItem(item, id) {
  const state = loadState();
  const checkbox = item.querySelector('.custom-checkbox');

  if (item.classList.contains('checked')) {
    item.classList.remove('checked');
    checkbox.textContent = '';
    delete state[id];
  } else {
    item.classList.add('checked');
    checkbox.textContent = '✓';
    state[id] = true;

    // Animate
    item.style.transform = 'scale(0.98)';
    setTimeout(() => { item.style.transform = ''; }, 150);
  }

  saveState(state);
  updateProgress();
  updateSectionCounts();
}

function updateProgress() {
  const total = document.querySelectorAll('.checklist-item').length;
  const checked = document.querySelectorAll('.checklist-item.checked').length;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  const bar = document.querySelector('.progress-bar-fill');
  const text = document.querySelector('.progress-text');

  if (bar) bar.style.width = pct + '%';
  if (text) text.textContent = checked + ' / ' + total;
}

function updateSectionCounts() {
  document.querySelectorAll('.section-card').forEach(card => {
    const total = card.querySelectorAll('.checklist-item').length;
    if (total === 0) return;
    const checked = card.querySelectorAll('.checklist-item.checked').length;
    const countEl = card.querySelector('.section-count');
    if (countEl) {
      countEl.textContent = checked + ' / ' + total;
      if (checked === total) {
        countEl.classList.add('complete');
      } else {
        countEl.classList.remove('complete');
      }
    }
  });
}

// ===== Hearing Sheet Auto-Save =====
function initHearingForm() {
  const form = document.getElementById('hearing-form');
  if (!form) return;

  const data = loadHearingData();

  // Restore saved values
  form.querySelectorAll('input, select, textarea').forEach(el => {
    const name = el.name;
    if (!name) return;

    if (el.type === 'radio') {
      if (data[name] === el.value) el.checked = true;
    } else if (el.type === 'checkbox') {
      if (data[name] && data[name].includes(el.value)) el.checked = true;
    } else {
      if (data[name] !== undefined) el.value = data[name];
    }
  });

  // Auto-save on input
  form.addEventListener('input', () => {
    const formData = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      const name = el.name;
      if (!name) return;

      if (el.type === 'radio') {
        if (el.checked) formData[name] = el.value;
      } else if (el.type === 'checkbox') {
        if (!formData[name]) formData[name] = [];
        if (el.checked) formData[name].push(el.value);
      } else {
        formData[name] = el.value;
      }
    });
    saveHearingData(formData);
  });
}

// ===== Reset =====
function resetAll() {
  if (confirm('すべてのチェック状態とヒアリングシートの入力内容をリセットしますか？\nこの操作は元に戻せません。')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HEARING_KEY);
    location.reload();
  }
}

function resetChecklist() {
  if (confirm('チェックリストのチェック状態をすべてリセットしますか？')) {
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll('.checklist-item').forEach(item => {
      item.classList.remove('checked');
      item.querySelector('.custom-checkbox').textContent = '';
    });
    updateProgress();
    updateSectionCounts();
  }
}

// ===== Print Hearing Sheet =====
function printHearing() {
  window.print();
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initChecklists();
  initHearingForm();
});
