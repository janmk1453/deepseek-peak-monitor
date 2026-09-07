// Content script - injects monitor UI into the page

(function() {
  'use strict';
  
  let monitorContainer = null;
  let updateInterval = null;
  let currentData = null;
  let countdownInterval = null;
  
  // Create the floating monitor UI
  function createMonitorUI() {
    if (monitorContainer) return;
    
    monitorContainer = document.createElement('div');
    monitorContainer.id = 'deepseek-monitor';
    monitorContainer.innerHTML = `
      <div class="ds-widget">
        <div class="ds-widget-main">
          <div class="ds-time" id="ds-current-time">--:--</div>
          <div class="ds-divider"></div>
          <div class="ds-balance" id="ds-balance">--</div>
          <div class="ds-divider" id="ds-countdown-divider"></div>
          <div class="ds-countdown" id="ds-countdown"></div>
        </div>
        <div class="ds-widget-actions">
          <button class="ds-btn" id="ds-refresh-btn" title="刷新">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1.2 6 3"/>
              <path d="M21 3v6h-6"/>
            </svg>
          </button>
          <button class="ds-btn ds-btn-close" id="ds-monitor-close" title="关闭">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(monitorContainer);
    
    document.getElementById('ds-monitor-close').addEventListener('click', hideMonitor);
    document.getElementById('ds-refresh-btn').addEventListener('click', forceRefresh);
    
    makeDraggable();
  }
  
  function savePosition() {
    if (!monitorContainer) return;
    const pos = {
      left: monitorContainer.style.left,
      top: monitorContainer.style.top
    };
    localStorage.setItem('ds-monitor-position', JSON.stringify(pos));
  }
  
  function loadPosition() {
    try {
      const pos = JSON.parse(localStorage.getItem('ds-monitor-position'));
      if (pos && pos.left && pos.top) {
        monitorContainer.style.left = pos.left;
        monitorContainer.style.top = pos.top;
      }
    } catch (e) {}
  }
  
  function makeDraggable() {
    let isDragging = false;
    let offsetX, offsetY;
    
    monitorContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ds-btn')) return;
      isDragging = true;
      offsetX = e.clientX - monitorContainer.offsetLeft;
      offsetY = e.clientY - monitorContainer.offsetTop;
      monitorContainer.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      monitorContainer.style.left = (e.clientX - offsetX) + 'px';
      monitorContainer.style.top = (e.clientY - offsetY) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        monitorContainer.style.cursor = 'grab';
        savePosition();
      }
    });
  }
  
  function parseTimeStr(s) {
    const [h, m] = s.split(':').map(Number);
    return h * 3600 + m * 60;
  }

  function calculateCountdown(data) {
    if (!data) return '';
    
    const now = new Date();
    const day = now.getDay();
    const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    const periods = (data.peakPeriods || [{start:'09:00',end:'12:00'},{start:'14:00',end:'18:00'}])
      .map(p => ({ start: parseTimeStr(p.start), end: parseTimeStr(p.end) }))
      .filter(p => p.end > p.start)
      .sort((a,b) => a.start - b.start);
    
    if (!periods.length) return '';
    
    const peakWeekdays = data.peakWeekdays || [1,2,3,4,5];
    const isPeakDay = peakWeekdays.includes(day);
    
    let targetTime = null;
    let label = '';
    
    if (isPeakDay) {
      if (data.status === 'peak') {
        for (const p of periods) {
          if (totalSeconds < p.end && totalSeconds >= p.start) { targetTime = p.end; label = '距结束'; break; }
        }
      } else {
        for (const p of periods) {
          if (totalSeconds < p.start) { targetTime = p.start; label = '距高峰'; break; }
        }
        if (targetTime === null) {
          // after last period today
          const nextDays = (() => {
            for (let d = 1; d <= 7; d++) if (peakWeekdays.includes((day+d)%7)) return d;
            return 7;
          })();
          targetTime = nextDays * 24*3600 + periods[0].start;
          label = '距高峰';
        }
        if (data.status === 'warning' && targetTime !== null) label = '距高峰';
      }
    } else {
      let d = 1;
      while (d <= 7 && !peakWeekdays.includes((day+d)%7)) d++;
      targetTime = d * 24*3600 + periods[0].start;
      label = '距高峰';
    }
    
    if (targetTime === null) return '';
    
    let diff = targetTime - totalSeconds;
    if (diff < 0) diff += 24*3600;
    
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    
    return `${label} ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }
  
  function updateMonitor(data) {
    if (!data) return;
    
    currentData = data;
    
    const widget = monitorContainer.querySelector('.ds-widget');
    widget.className = 'ds-widget';
    
    switch (data.status) {
      case 'peak':
        widget.classList.add('ds-peak');
        break;
      case 'warning':
        widget.classList.add('ds-warning');
        break;
      case 'off-peak':
      default:
        widget.classList.add('ds-offpeak');
        break;
    }
    
    document.getElementById('ds-current-time').textContent = getCurrentTime();
    
    const countdown = calculateCountdown(data);
    const countdownEl = document.getElementById('ds-countdown');
    const divider = document.getElementById('ds-countdown-divider');
    if (countdown) {
      countdownEl.textContent = countdown;
      countdownEl.style.display = 'block';
      divider.style.display = 'block';
    } else {
      countdownEl.style.display = 'none';
      divider.style.display = 'none';
    }
    
    const balanceEl = document.getElementById('ds-balance');
    if (data.balance !== null && data.balance !== undefined) {
      const symbol = data.currency === 'USD' ? '$' : '¥';
      balanceEl.textContent = `${symbol}${data.balance.toFixed(2)}`;
      balanceEl.style.display = 'block';
    } else {
      balanceEl.style.display = 'none';
    }
  }
  
  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      const timeEl = document.getElementById('ds-current-time');
      if (timeEl) timeEl.textContent = getCurrentTime();
      
      if (currentData) {
        const countdown = calculateCountdown(currentData);
        const el = document.getElementById('ds-countdown');
        const divider = document.getElementById('ds-countdown-divider');
        if (el && countdown) {
          el.textContent = countdown;
        }
      }
    }, 1000);
  }
  
  function showMonitor() {
    if (!monitorContainer) {
      createMonitorUI();
      loadPosition();
    }
    monitorContainer.style.display = 'block';
    forceRefresh();
    startCountdown();
  }
  
  function hideMonitor() {
    if (monitorContainer) monitorContainer.style.display = 'none';
    if (countdownInterval) clearInterval(countdownInterval);
  }
  
  function forceRefresh() {
    chrome.runtime.sendMessage({ type: 'FORCE_REFRESH' }, (response) => {
      if (response) updateMonitor(response);
    });
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_MONITOR') updateMonitor(request.data);
  });
  
  function shouldShowMonitor() {
    chrome.storage.local.get('settings', (result) => {
      const settings = result.settings;
      if (!settings || !settings.enabled) return;
      
      const currentUrl = window.location.href;
      const targetUrls = settings.targetUrls || [];
      
      const isTarget = targetUrls.some(targetUrl => {
        if (!targetUrl) return false;
        return currentUrl.startsWith(targetUrl);
      });
      
      if (isTarget) {
        showMonitor();
        if (updateInterval) clearInterval(updateInterval);
        const refreshMs = (settings.refreshInterval || 60) * 1000;
        updateInterval = setInterval(forceRefresh, refreshMs);
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', shouldShowMonitor);
  } else {
    shouldShowMonitor();
  }
  
  window.addEventListener('pagehide', () => {
    if (updateInterval) clearInterval(updateInterval);
    if (countdownInterval) clearInterval(countdownInterval);
  });
})();