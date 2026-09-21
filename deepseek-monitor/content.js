// Content script - injects monitor UI into the page

(function() {
  'use strict';

  let monitorContainer = null;
  let updateInterval = null;
  let currentData = null;
  let countdownInterval = null;

  const POSITION_STORAGE_KEY = 'ds-monitor-position';

  // Create the floating monitor UI
  function createMonitorUI() {
    if (monitorContainer) return;

    // 重复注入（如更新设置后动态注入）时先移除旧悬浮窗，避免叠加
    const existing = document.getElementById('deepseek-monitor');
    if (existing) existing.remove();
    
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
  
  function parsePixelValue(value) {
    if (typeof value === 'number') return isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const num = parseFloat(value);
    return isFinite(num) ? num : null;
  }

  function getViewportSize() {
    const doc = document.documentElement;
    return {
      width: doc.clientWidth || window.innerWidth || 0,
      height: doc.clientHeight || window.innerHeight || 0
    };
  }

  // 以胶囊本体（而非外层容器）的尺寸为准，避免容器被拉宽后算错边界
  function getWidgetSize() {
    const widget = monitorContainer.querySelector('.ds-widget') || monitorContainer;
    const rect = widget.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  // 把位置夹在视口内：左/上不小于 0，右/下不超出可视区域
  function clampToViewport(left, top) {
    const viewport = getViewportSize();
    const size = getWidgetSize();
    const maxLeft = Math.max(0, viewport.width - size.width);
    const maxTop = Math.max(0, viewport.height - size.height);
    return {
      left: Math.min(Math.max(0, left), maxLeft),
      top: Math.min(Math.max(0, top), maxTop)
    };
  }

  function applyPosition(left, top) {
    const pos = clampToViewport(left, top);
    // 只固定 left，同时清掉 right，否则两者并存时容器会被拉伸
    monitorContainer.style.right = 'auto';
    monitorContainer.style.left = pos.left + 'px';
    monitorContainer.style.top = pos.top + 'px';
    return pos;
  }

  // 窗口缩小或胶囊变宽后，把已经超出边缘的位置收回来
  function keepInViewport() {
    if (!monitorContainer || !monitorContainer.style.left) return;
    const left = parsePixelValue(monitorContainer.style.left);
    const top = parsePixelValue(monitorContainer.style.top);
    if (left === null || top === null) return;
    const pos = clampToViewport(left, top);
    if (pos.left === left && pos.top === top) return;
    applyPosition(pos.left, pos.top);
    savePosition();
  }

  function savePosition() {
    if (!monitorContainer) return;
    const pos = {
      left: monitorContainer.style.left,
      top: monitorContainer.style.top
    };
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
  }
  
  function loadPosition() {
    try {
      const pos = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY));
      if (!pos) return;
      const left = parsePixelValue(pos.left);
      const top = parsePixelValue(pos.top);
      if (left === null || top === null) return;
      const applied = applyPosition(left, top);
      // 窗口比上次保存时更小的话，顺手把修正后的位置写回去
      if (applied.left !== left || applied.top !== top) savePosition();
    } catch (e) {}
  }
  
  function makeDraggable() {
    let isDragging = false;
    let offsetX, offsetY;
    const widget = monitorContainer.querySelector('.ds-widget');
    
    widget.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ds-btn')) return;
      isDragging = true;
      // 用视口坐标计算抓取点，fixed 定位下比 offsetLeft/offsetTop 更可靠
      const rect = monitorContainer.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      widget.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      applyPosition(e.clientX - offsetX, e.clientY - offsetY);
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        widget.style.cursor = 'grab';
        // 拖动时的按压缩放会略微改变视觉尺寸，松手后再校正一次
        keepInViewport();
        savePosition();
      }
    });
  }
  
  // 交给 holidays.js 统一计算，保证与 background 的判断完全一致
  function buildPeakOptions(data, now) {
    return {
      now: now || new Date(),
      peakPeriods: data && data.peakPeriods,
      peakWeekdays: data && data.peakWeekdays,
      warningMinutes: data && data.warningMinutes,
      respectChinaHolidays: data ? data.respectChinaHolidays : undefined,
      customOffDays: data && data.customOffDays
    };
  }

  function buildTooltip(status) {
    const tips = [];
    if (status.isHoliday) {
      tips.push(`${status.holidayName}假期，全天按空闲时段计费`);
    } else if (status.isMakeupWorkday) {
      tips.push('调休上班日，按官方规则全天算空闲时段');
    } else if (status.isCustomOffDay) {
      tips.push('自定义空闲日，全天按空闲时段计费');
    } else if (status.isWeekend) {
      tips.push('周末，全天按空闲时段计费');
    }
    if (status.coverage && status.coverage.message) tips.push(status.coverage.message);
    return tips.join('；');
  }

  function getCurrentTime(now) {
    now = now || new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }

  // 渲染实时状态：每秒钟走一次，峰谷切换不再依赖一分钟一次的 background 快照
  function render() {
    if (!monitorContainer || !currentData) return;

    const now = new Date();
    const status = DS_PEAK.getTimeStatus(buildPeakOptions(currentData, now));
    const widget = monitorContainer.querySelector('.ds-widget');
    if (widget) {
      widget.className = 'ds-widget';
      if (status.status === 'peak') widget.classList.add('ds-peak');
      else if (status.status === 'warning') widget.classList.add('ds-warning');
      else widget.classList.add('ds-offpeak');
    }

    const tooltip = buildTooltip(status);
    if (tooltip) monitorContainer.title = tooltip;
    else monitorContainer.removeAttribute('title');

    const timeEl = document.getElementById('ds-current-time');
    if (timeEl) timeEl.textContent = getCurrentTime(now);

    const countdown = DS_PEAK.getCountdown(buildPeakOptions(currentData, now));
    const countdownEl = document.getElementById('ds-countdown');
    const divider = document.getElementById('ds-countdown-divider');
    if (countdownEl && divider) {
      if (countdown) {
        countdownEl.textContent = `${countdown.label} ${DS_PEAK.formatCountdown(countdown.seconds)}`;
        countdownEl.style.display = 'block';
        divider.style.display = 'block';
      } else {
        countdownEl.style.display = 'none';
        divider.style.display = 'none';
      }
    }

    // 倒计时跨天时会变成“X天HH:MM:SS”，宽度变化后同样不能越界
    keepInViewport();
  }

  function updateMonitor(data) {
    if (!data) return;
    
    currentData = data;

    const balanceEl = document.getElementById('ds-balance');
    if (balanceEl) {
      if (data.balance !== null && data.balance !== undefined) {
        const symbol = data.currency === 'USD' ? '$' : '¥';
        balanceEl.textContent = `${symbol}${data.balance.toFixed(2)}`;
        balanceEl.style.display = 'block';
      } else {
        balanceEl.style.display = 'none';
      }
    }

    render();
  }
  
  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(render, 1000);
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

  window.addEventListener('resize', keepInViewport);
})();
