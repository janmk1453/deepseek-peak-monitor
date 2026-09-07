// Background service worker
const ALARM_NAME = 'deepseek-monitor-check';

// Default settings
const DEFAULT_SETTINGS = {
  targetUrls: ['http://127.0.0.1:3000/'],
  refreshInterval: 60,
  apiKey: '',
  enabled: true,
  peakPeriods: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' }
  ],
  peakWeekdays: [1, 2, 3, 4, 5],
  warningMinutes: 10
};

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    } else {
      let s = result.settings;
      let migrated = false;
      if (s.targetUrl && !s.targetUrls) {
        s.targetUrls = [s.targetUrl];
        delete s.targetUrl;
        migrated = true;
      }
      if (!s.peakPeriods) { s.peakPeriods = DEFAULT_SETTINGS.peakPeriods; migrated = true; }
      if (!s.peakWeekdays) { s.peakWeekdays = DEFAULT_SETTINGS.peakWeekdays; migrated = true; }
      if (s.warningMinutes === undefined) { s.warningMinutes = DEFAULT_SETTINGS.warningMinutes; migrated = true; }
      if (migrated) chrome.storage.local.set({ settings: s });
    }
  });
  setupAlarm();
});

// Setup periodic check
function setupAlarm() {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkAndNotify();
  }
});

// Calculate peak/off-peak status based on local system time
function getTimeStatus(settings) {
  const now = new Date();
  
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  const peakPeriods = (settings && settings.peakPeriods) || DEFAULT_SETTINGS.peakPeriods;
  const peakWeekdays = (settings && settings.peakWeekdays) || DEFAULT_SETTINGS.peakWeekdays;
  const warningMinutes = (settings && settings.warningMinutes) ?? DEFAULT_SETTINGS.warningMinutes;
  
  const periods = peakPeriods.map(p => ({
    start: parseTime(p.start),
    end: parseTime(p.end)
  })).filter(p => p.end > p.start).sort((a,b) => a.start - b.start);
  
  const isPeakDay = peakWeekdays.includes(day);
  const totalMinutes = hours * 60 + minutes;
  
  let status = 'off-peak';
  let nextPeakStart = null;
  
  if (isPeakDay && periods.length) {
    // Check peak
    for (const p of periods) {
      if (totalMinutes >= p.start && totalMinutes < p.end) {
        status = 'peak';
        break;
      }
    }
    // Check warning
    if (status !== 'peak') {
      for (const p of periods) {
        if (totalMinutes >= p.start - warningMinutes && totalMinutes < p.start) {
          status = 'warning';
          nextPeakStart = p.start;
          break;
        }
      }
    }
    // Next peak
    if (!nextPeakStart) {
      for (const p of periods) {
        if (totalMinutes < p.start) { nextPeakStart = p.start; break; }
      }
      if (!nextPeakStart) {
        // Check future weekdays
        for (let d = 1; d <= 7; d++) {
          const nd = (day + d) % 7;
          if (peakWeekdays.includes(nd)) {
            nextPeakStart = d * 24 * 60 + periods[0].start;
            break;
          }
        }
      }
    }
  } else {
    // Off day - next peak on next peak weekday
    for (let d = 1; d <= 7; d++) {
      const nd = (day + d) % 7;
      if (peakWeekdays.includes(nd) && periods.length) {
        nextPeakStart = d * 24 * 60 + periods[0].start;
        break;
      }
    }
  }
  
  return {
    status,
    nextPeakStart,
    currentTime: now.toLocaleTimeString('zh-CN', { hour12: false }),
    currentDate: now.toLocaleDateString('zh-CN')
  };
}

// Fetch balance from DeepSeek API
async function fetchBalance(apiKey) {
  if (!apiKey) {
    return { balance: null, error: 'No API key configured' };
  }
  
  try {
    const response = await fetch('https://api.deepseek.com/user/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle new API format: balance_infos array
    if (data.balance_infos && Array.isArray(data.balance_infos)) {
      // Find CNY balance first, then USD
      const cnyInfo = data.balance_infos.find(info => info.currency === 'CNY');
      const usdInfo = data.balance_infos.find(info => info.currency === 'USD');
      const info = cnyInfo || usdInfo;
      
      if (info) {
        return {
          balance: parseFloat(info.total_balance) || 0,
          granted_balance: parseFloat(info.granted_balance) || 0,
          topped_up_balance: parseFloat(info.topped_up_balance) || 0,
          currency: info.currency,
          is_available: data.is_available,
          error: null
        };
      }
    }
    
    // Fallback for old format
    return { 
      balance: data.balance || data.total_balance, 
      error: null,
      is_available: data.is_available
    };
  } catch (error) {
    return { balance: null, error: error.message };
  }
}

// Check if URL matches any target URL
function isTargetUrl(url, targetUrls) {
  if (!url || !targetUrls || !Array.isArray(targetUrls)) return false;
  
  return targetUrls.some(targetUrl => {
    if (!targetUrl) return false;
    // Remove trailing slash for comparison
    const normalizedUrl = url.replace(/\/$/, '');
    const normalizedTarget = targetUrl.replace(/\/$/, '');
    return normalizedUrl.startsWith(normalizedTarget);
  });
}

// Main check function
async function checkAndNotify() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || DEFAULT_SETTINGS;
  
  if (!settings.enabled) return;
  
  const timeStatus = getTimeStatus(settings);
  
  // Check which tabs have target URLs open
  const targetUrls = settings.targetUrls || [];
  let balanceData = null;
  let hasTargetTab = false;
  
  try {
    const tabs = await chrome.tabs.query({});
    
    // Find if any tab matches target URLs
    for (const tab of tabs) {
      if (tab.url && isTargetUrl(tab.url, targetUrls)) {
        hasTargetTab = true;
        break;
      }
    }
    
    // Only fetch balance if a target tab is open
    if (hasTargetTab) {
      balanceData = await fetchBalance(settings.apiKey);
    }
  } catch (error) {
    console.error('Error checking tabs:', error);
  }
  
  const monitorData = {
    ...timeStatus,
    peakPeriods: settings.peakPeriods || DEFAULT_SETTINGS.peakPeriods,
    peakWeekdays: settings.peakWeekdays || DEFAULT_SETTINGS.peakWeekdays,
    warningMinutes: settings.warningMinutes ?? DEFAULT_SETTINGS.warningMinutes,
    balance: balanceData ? balanceData.balance : null,
    balanceError: balanceData ? balanceData.error : null,
    currency: balanceData ? balanceData.currency : null,
    granted_balance: balanceData ? balanceData.granted_balance : null,
    topped_up_balance: balanceData ? balanceData.topped_up_balance : null,
    is_available: balanceData ? balanceData.is_available : null,
    hasTargetTab: hasTargetTab,
    lastUpdate: new Date().toISOString()
  };
  
  // Store for content script to access
  await chrome.storage.local.set({ monitorData });
  
  // Notify content scripts on matching tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.url && isTargetUrl(tab.url, targetUrls)) {
        chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_MONITOR', data: monitorData }).catch(() => {
          // Ignore errors for tabs without content script
        });
      }
    });
  });
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_MONITOR_DATA') {
    chrome.storage.local.get('monitorData', (result) => {
      sendResponse(result.monitorData || null);
    });
    return true;
  }
  
  if (request.type === 'FORCE_REFRESH') {
    checkAndNotify().then(() => {
      chrome.storage.local.get('monitorData', (result) => {
        sendResponse(result.monitorData);
      });
    });
    return true;
  }
  
  if (request.type === 'UPDATE_SETTINGS') {
    chrome.storage.local.set({ settings: request.settings }, () => {
      setupAlarm();
      // Inject content script into already-open matching tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && isTargetUrl(tab.url, request.settings.targetUrls)) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }).catch(() => {});
            chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['content.css']
            }).catch(() => {});
          }
        });
      });
      checkAndNotify();
      sendResponse({ success: true });
    });
    return true;
  }
});

// Start initial check
checkAndNotify();