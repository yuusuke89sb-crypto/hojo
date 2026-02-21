// ===== State Management =====
const STORAGE_KEY = 'hojosya_checklist_state';
const HEARING_KEY = 'hojosya_hearing_data';

// ===== Google Apps Script URL =====
// ↓ デプロイ後のウェブアプリURLを貼り付けてください
const GAS_URL = 'https://script.google.com/macros/s/AKfycby40NNBfzvwCJWohF-OTBpV2Tmc1xVEz9gZkqo1TeGF06bhJR0TnIa4AA71Y25uGFu1/exec';

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

// ===== Submit Hearing to Google Sheets =====
function submitHearing() {
  const data = loadHearingData();

  // 必須項目チェック
  if (!data.name || !data.name.trim()) {
    alert('⚠️ 氏名は必須です。入力してから送信してください。');
    return;
  }
  if (!data.address || !data.address.trim()) {
    alert('⚠️ 住所は必須です。入力してから送信してください。');
    return;
  }
  if (!data.phone || !data.phone.trim()) {
    alert('⚠️ 電話番号は必須です。入力してから送信してください。');
    return;
  }

  if (!GAS_URL) {
    alert('⚠️ 送信先が設定されていません。\nscript.js の GAS_URL にGoogle Apps ScriptのURLを設定してください。\n\n詳細は gas_setup_guide.md を参照してください。');
    return;
  }

  if (!confirm('ヒアリングシートの内容を送信しますか？')) return;

  // 送信中UI
  const overlay = document.createElement('div');
  overlay.id = 'submitOverlay';
  overlay.innerHTML = `
    <div style="
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.5); display:flex;
      align-items:center; justify-content:center; z-index:9999;
    ">
      <div style="
        background:white; border-radius:16px; padding:40px 50px;
        text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.3);
        font-family:'Noto Sans JP',sans-serif;
      ">
        <div style="font-size:36px; margin-bottom:12px;">📤</div>
        <div style="font-size:16px; font-weight:600; color:#1a5276;">送信中...</div>
        <div style="font-size:13px; color:#7f8c8d; margin-top:6px;">しばらくお待ちください</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data)
  })
    .then(() => {
      overlay.remove();
      showSubmitResult(true, data.name);
    })
    .catch(err => {
      overlay.remove();
      showSubmitResult(false);
      console.error('送信エラー:', err);
    });
}

function showSubmitResult(success, name) {
  const overlay = document.createElement('div');
  overlay.id = 'resultOverlay';

  if (success) {
    overlay.innerHTML = `
      <div style="
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.5); display:flex;
        align-items:center; justify-content:center; z-index:9999;
        cursor:pointer;
      " onclick="this.parentElement.remove()">
        <div style="
          background:white; border-radius:16px; padding:40px 50px;
          text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.3);
          font-family:'Noto Sans JP',sans-serif; max-width:400px;
        ">
          <div style="font-size:48px; margin-bottom:12px;">✅</div>
          <div style="font-size:18px; font-weight:700; color:#27ae60; margin-bottom:8px;">送信完了！</div>
          <div style="font-size:14px; color:#2c3e50; line-height:1.8;">
            ${name || ''} さんのヒアリングシートを<br>送信しました。
          </div>
          <div style="font-size:12px; color:#7f8c8d; margin-top:16px;">クリックして閉じる</div>
        </div>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      <div style="
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.5); display:flex;
        align-items:center; justify-content:center; z-index:9999;
        cursor:pointer;
      " onclick="this.parentElement.remove()">
        <div style="
          background:white; border-radius:16px; padding:40px 50px;
          text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.3);
          font-family:'Noto Sans JP',sans-serif; max-width:400px;
        ">
          <div style="font-size:48px; margin-bottom:12px;">⚠️</div>
          <div style="font-size:18px; font-weight:700; color:#e74c3c; margin-bottom:8px;">送信に失敗しました</div>
          <div style="font-size:14px; color:#2c3e50; line-height:1.8;">
            ネットワーク接続を確認してから<br>もう一度お試しください。
          </div>
          <div style="font-size:12px; color:#7f8c8d; margin-top:16px;">クリックして閉じる</div>
        </div>
      </div>
    `;
  }
  document.body.appendChild(overlay);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initChecklists();
  initHearingForm();
});
