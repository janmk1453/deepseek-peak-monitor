// Popup script

let targetUrls = [];
let peakPeriods = [];
let peakWeekdays = [];

let timeTimer = null;

function startTimeTick() {
  if (timeTimer) clearInterval(timeTimer);
  const el = document.getElementById('current-time');
  const tick = () => { if (el) el.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false }); };
  tick();
  timeTimer = setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStatus();
  startTimeTick();
  
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('refresh-btn').addEventListener('click', forceRefresh);
  document.getElementById('add-url-btn').addEventListener('click', addUrl);
  document.getElementById('new-url').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUrl();
  });
  document.getElementById('toggle-eye').addEventListener('click', () => {
    const input = document.getElementById('api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('add-period-btn').addEventListener('click', addPeriod);
  document.querySelectorAll('.wd').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = parseInt(btn.dataset.day);
      if (peakWeekdays.includes(d)) {
        peakWeekdays = peakWeekdays.filter(x => x !== d);
      } else {
        peakWeekdays.push(d);
        peakWeekdays.sort((a,b) => (a===0?7:a)-(b===0?7:b));
      }
      renderWeekdays();
    });
  });
});

function loadSettings() {
  chrome.storage.local.get('settings', (result) => {
    const defaults = {
      targetUrls: ['http://127.0.0.1:3000/'],
      refreshInterval: 60,
      apiKey: '',
      enabled: true,
      peakPeriods: [{start:'09:00',end:'12:00'},{start:'14:00',end:'18:00'}],
      peakWeekdays: [1,2,3,4,5],
      warningMinutes: 10
    };
    const settings = result.settings || defaults;
    
    if (settings.targetUrl && !settings.targetUrls) {
      settings.targetUrls = [settings.targetUrl];
    }
    
    targetUrls = settings.targetUrls || defaults.targetUrls;
    peakPeriods = settings.peakPeriods || defaults.peakPeriods;
    peakWeekdays = settings.peakWeekdays || defaults.peakWeekdays;
    
    renderUrlList();
    renderWeekdays();
    renderPeriods();
    
    document.getElementById('api-key').value = settings.apiKey || '';
    document.getElementById('refresh-interval').value = settings.refreshInterval ?? 60;
    document.getElementById('enabled').checked = settings.enabled ?? true;
    document.getElementById('warning-minutes').value = settings.warningMinutes ?? 10;
  });
}

function loadStatus() {
  chrome.runtime.sendMessage({ type: 'GET_MONITOR_DATA' }, (response) => {
    if (response) {
      updateStatusDisplay(response);
    }
  });
}

function updateStatusDisplay(data) {
  const statusCard = document.getElementById('status-card');
  const statusBadge = document.getElementById('status-badge');
  const balanceValue = document.getElementById('balance-value');
  
  statusCard.className = 'preview';
  statusBadge.className = 'preview-badge';
  
  switch (data.status) {
    case 'peak':
      statusCard.classList.add('peak');
      statusBadge.classList.add('peak');
      statusBadge.textContent = '高峰时段';
      break;
    case 'warning':
      statusCard.classList.add('warning');
      statusBadge.classList.add('warning');
      statusBadge.textContent = '即将高峰';
      break;
    case 'off-peak':
    default:
      statusCard.classList.add('offpeak');
      statusBadge.classList.add('offpeak');
      statusBadge.textContent = '空闲时段';
      break;
  }
  
  if (data.balance !== null && data.balance !== undefined) {
    const symbol = data.currency === 'USD' ? '$' : '¥';
    balanceValue.textContent = `${symbol}${data.balance.toFixed(2)}`;
  } else if (data.hasTargetTab === false) {
    balanceValue.textContent = '未打开目标网站';
  } else {
    balanceValue.textContent = '--';
  }
}

function renderUrlList() {
  const urlList = document.getElementById('url-list');
  urlList.innerHTML = '';
  
  targetUrls.forEach((url, index) => {
    const urlItem = document.createElement('div');
    urlItem.className = 'url-item';
    urlItem.innerHTML = `
      <span class="url-text" title="${url}">${url}</span>
      <button class="url-remove" data-index="${index}">×</button>
    `;
    urlList.appendChild(urlItem);
  });
  
  document.querySelectorAll('.url-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeUrl(index);
    });
  });
}

function addUrl() {
  const input = document.getElementById('new-url');
  let url = input.value.trim();
  
  if (!url) return;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  
  if (!url.endsWith('/')) {
    url = url + '/';
  }
  
  if (targetUrls.some(u => u.toLowerCase() === url.toLowerCase())) {
    input.value = '';
    return;
  }
  
  targetUrls.push(url);
  renderUrlList();
  input.value = '';
}

function removeUrl(index) {
  targetUrls.splice(index, 1);
  renderUrlList();
}

function renderWeekdays() {
  document.querySelectorAll('.wd').forEach(btn => {
    const d = parseInt(btn.dataset.day);
    btn.classList.toggle('active', peakWeekdays.includes(d));
  });
}

function renderPeriods() {
  const list = document.getElementById('period-list');
  list.innerHTML = '';
  peakPeriods.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'period-row';
    row.innerHTML = `
      <input type="time" value="${p.start}" data-i="${i}" data-k="start">
      <span class="period-sep">—</span>
      <input type="time" value="${p.end}" data-i="${i}" data-k="end">
      <button class="period-del" data-i="${i}">×</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('input[type="time"]').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = parseInt(e.target.dataset.i);
      const k = e.target.dataset.k;
      peakPeriods[i][k] = e.target.value;
    });
  });
  list.querySelectorAll('.period-del').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = parseInt(e.target.dataset.i);
      peakPeriods.splice(i, 1);
      renderPeriods();
    });
  });
}

function addPeriod() {
  peakPeriods.push({ start: '09:00', end: '12:00' });
  renderPeriods();
}

function saveSettings() {
  // collect periods from DOM (in case edits not flushed)
  document.querySelectorAll('#period-list input[type="time"]').forEach(inp => {
    const i = parseInt(inp.dataset.i);
    const k = inp.dataset.k;
    if (peakPeriods[i]) peakPeriods[i][k] = inp.value;
  });

  const settings = {
    targetUrls: targetUrls,
    apiKey: document.getElementById('api-key').value,
    refreshInterval: parseInt(document.getElementById('refresh-interval').value) || 60,
    enabled: document.getElementById('enabled').checked,
    peakPeriods: peakPeriods.filter(p => p.start && p.end && p.start !== p.end),
    peakWeekdays: peakWeekdays,
    warningMinutes: parseInt(document.getElementById('warning-minutes').value) || 0
  };
  
  for (const url of settings.targetUrls) {
    try { new URL(url); } catch (e) {
      alert('请检查网址格式是否正确: ' + url);
      return;
    }
  }
  
  if (!settings.peakPeriods.length) {
    alert('请至少保留一个有效时段');
    return;
  }
  
  if (settings.refreshInterval < 10 || settings.refreshInterval > 3600) {
    alert('刷新间隔应在10-3600秒之间');
    return;
  }
  
  chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: settings }, (response) => {
    if (response && response.success) {
      const saveBtn = document.getElementById('save-btn');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '已保存';
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 1000);
    }
  });
}

function forceRefresh() {
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.disabled = true;
  refreshBtn.textContent = '...';
  
  chrome.runtime.sendMessage({ type: 'FORCE_REFRESH' }, (response) => {
    if (response) {
      updateStatusDisplay(response);
    }
    refreshBtn.disabled = false;
    refreshBtn.textContent = '刷新';
  });
}