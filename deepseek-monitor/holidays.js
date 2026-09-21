// DeepSeek 峰谷规则共享模块
// 由 background.js（importScripts）与 content.js（manifest 前置注入）共同加载，
// 保证「高峰期 / 空闲期 / 节假日 / 倒计时」只有一份实现，避免多处逻辑漂移。
//
// 官方规则（北京时间）：
//   空闲时段价格为高峰时段价格的一半。
//   周一至周五（不含中国法定节假日）9:00-12:00、14:00-18:00 为高峰时段；
//   其余时段，包括周末及中国法定节假日全天均为空闲时段；
//   调休上班的周末同样按空闲时段计费。

var DS_PEAK = (function () {
  'use strict';

  var DEFAULT_PEAK_PERIODS = [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' }
  ];
  var DEFAULT_PEAK_WEEKDAYS = [1, 2, 3, 4, 5];
  var DEFAULT_WARNING_MINUTES = 10;

  // 国务院办公厅公布的放假日期（含调休放假），格式：[名称, 起始日, 结束日]
  // 区间内全天按空闲时段计费。
  var OFF_RANGES = [
    // 2023 年：http://www.gov.cn/zhengce/zhengceku/2022-12/08/content_5730844.htm
    ['元旦', '2022-12-31', '2023-01-02'],
    ['春节', '2023-01-21', '2023-01-27'],
    ['清明节', '2023-04-05', '2023-04-05'],
    ['劳动节', '2023-04-29', '2023-05-03'],
    ['端午节', '2023-06-22', '2023-06-24'],
    ['中秋、国庆节', '2023-09-29', '2023-10-06'],
    // 2024 年：https://www.gov.cn/zhengce/zhengceku/202310/content_6911528.htm
    ['元旦', '2024-01-01', '2024-01-01'],
    ['春节', '2024-02-10', '2024-02-17'],
    ['清明节', '2024-04-04', '2024-04-06'],
    ['劳动节', '2024-05-01', '2024-05-05'],
    ['端午节', '2024-06-10', '2024-06-10'],
    ['中秋节', '2024-09-15', '2024-09-17'],
    ['国庆节', '2024-10-01', '2024-10-07'],
    // 2025 年：https://www.gov.cn/zhengce/zhengceku/202411/content_6986383.htm
    ['元旦', '2025-01-01', '2025-01-01'],
    ['春节', '2025-01-28', '2025-02-04'],
    ['清明节', '2025-04-04', '2025-04-06'],
    ['劳动节', '2025-05-01', '2025-05-05'],
    ['端午节', '2025-05-31', '2025-06-02'],
    ['国庆节、中秋节', '2025-10-01', '2025-10-08'],
    // 2026 年：https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm
    ['元旦', '2026-01-01', '2026-01-03'],
    ['春节', '2026-02-15', '2026-02-23'],
    ['清明节', '2026-04-04', '2026-04-06'],
    ['劳动节', '2026-05-01', '2026-05-05'],
    ['端午节', '2026-06-19', '2026-06-21'],
    ['中秋节', '2026-09-25', '2026-09-27'],
    ['国庆节', '2026-10-01', '2026-10-07']
  ];

  // 调休上班日（周末补班）。官方规则下这些日期仍按空闲时段计费，
  // 因此不参与高峰判定（周末本就空闲），仅用于界面提示与数据核对。
  var MAKEUP_WORKDAYS = [
    '2023-01-28', '2023-01-29', '2023-04-23', '2023-05-06', '2023-06-25', '2023-10-07', '2023-10-08',
    '2024-02-04', '2024-02-18', '2024-04-07', '2024-04-28', '2024-05-11', '2024-09-14', '2024-09-29', '2024-10-12',
    '2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11',
    '2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'
  ];

  // 已收录的节假日安排年份（国务院通常在上一年 11 月前后公布下一年安排）
  var DATA_YEARS = [2023, 2024, 2025, 2026];

  var MAKEUP_WORKDAY_MAP = (function () {
    var map = {};
    for (var i = 0; i < MAKEUP_WORKDAYS.length; i++) map[MAKEUP_WORKDAYS[i]] = true;
    return map;
  })();

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // 本地时间的 YYYY-MM-DD（不做时区换算，系统时区即判定时区）
  function dateKey(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      var parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  function parseTime(str) {
    if (typeof str !== 'string' || str.indexOf(':') === -1) return null;
    var parts = str.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function normalizePeriods(peakPeriods) {
    var source = (peakPeriods && peakPeriods.length) ? peakPeriods : DEFAULT_PEAK_PERIODS;
    return source.map(function (p) {
      return { start: parseTime(p && p.start), end: parseTime(p && p.end) };
    }).filter(function (p) {
      return p.start !== null && p.end !== null && p.end > p.start;
    }).sort(function (a, b) {
      return a.start - b.start;
    });
  }

  function normalizeWeekdays(peakWeekdays) {
    if (!Array.isArray(peakWeekdays)) return DEFAULT_PEAK_WEEKDAYS.slice();
    return peakWeekdays.map(Number).filter(function (d) {
      return !isNaN(d) && d >= 0 && d <= 6;
    });
  }

  function normalizeWarning(minutes) {
    var n = Number(minutes);
    if (isNaN(n) || n < 0) return DEFAULT_WARNING_MINUTES;
    return n;
  }

  function isValidDateKey(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    var parts = key.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2];
  }

  // 该日期是否落在国务院公布的放假区间内，返回 { name, start, end } 或 null
  function getHolidayInfo(date) {
    var key = dateKey(date);
    for (var i = 0; i < OFF_RANGES.length; i++) {
      if (key >= OFF_RANGES[i][1] && key <= OFF_RANGES[i][2]) {
        return { name: OFF_RANGES[i][0], start: OFF_RANGES[i][1], end: OFF_RANGES[i][2] };
      }
    }
    return null;
  }

  function isMakeupWorkday(date) {
    return MAKEUP_WORKDAY_MAP[dateKey(date)] === true;
  }

  function isCustomOffDay(date, customOffDays) {
    if (!Array.isArray(customOffDays) || !customOffDays.length) return false;
    return customOffDays.indexOf(dateKey(date)) !== -1;
  }

  // 判定某一天是高峰日还是空闲日
  // options: { respectChinaHolidays, peakWeekdays, customOffDays }
  // 返回 { isPeakDay, reason, holidayName, isWeekend, isMakeupWorkday, isCustomOffDay }
  function getDayInfo(date, options) {
    var opts = options || {};
    var respect = opts.respectChinaHolidays !== false; // 默认开启
    var weekdays = normalizeWeekdays(opts.peakWeekdays);
    var holiday = getHolidayInfo(date);
    var weekday = date.getDay();
    var isWeekend = weekday === 0 || weekday === 6;
    var makeup = isMakeupWorkday(date);
    var custom = isCustomOffDay(date, opts.customOffDays);

    var base = {
      holidayName: holiday ? holiday.name : null,
      isWeekend: isWeekend,
      isMakeupWorkday: makeup,
      isCustomOffDay: custom
    };

    if (custom) {
      base.isPeakDay = false;
      base.reason = 'custom-off';
      return base;
    }
    if (respect && holiday) {
      base.isPeakDay = false;
      base.reason = 'holiday';
      return base;
    }
    // 官方规则：周末（含调休上班的周末）全天按空闲计费
    if (respect && isWeekend) {
      base.isPeakDay = false;
      base.reason = 'weekend';
      return base;
    }
    if (weekdays.indexOf(weekday) === -1) {
      base.isPeakDay = false;
      base.reason = 'weekday-off';
      return base;
    }
    base.isPeakDay = true;
    base.reason = 'workday';
    return base;
  }

  // 节假日数据覆盖情况，用于提示用户补充/更新
  function getCoverageInfo(date) {
    var d = toDate(date);
    var year = d.getFullYear();
    var covered = DATA_YEARS.indexOf(year) !== -1;
    var message = null;
    if (!covered) {
      message = year + ' 年节假日安排未收录（当前覆盖 ' + DATA_YEARS[0] + '-' +
        DATA_YEARS[DATA_YEARS.length - 1] + ' 年），可在设置中手动补充空闲日期';
    }
    return {
      covered: covered,
      year: year,
      years: DATA_YEARS.slice(),
      message: message
    };
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // 下一个高峰时段的开始时刻（严格晚于当前时刻），找不到返回 null
  function findNextPeakStart(now, periods, options) {
    if (!periods.length) return null;
    var nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    for (var i = 0; i < 400; i++) {
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (!getDayInfo(day, options).isPeakDay) continue;
      for (var j = 0; j < periods.length; j++) {
        if (i === 0 && periods[j].start <= nowMinutes) continue; // 已开始/已过去的时段不算“下一个”
        return new Date(day.getFullYear(), day.getMonth(), day.getDate(),
          Math.floor(periods[j].start / 60), periods[j].start % 60, 0, 0);
      }
    }
    return null;
  }

  // 当前峰谷状态
  // options: { now, peakPeriods, peakWeekdays, warningMinutes, respectChinaHolidays, customOffDays }
  function getTimeStatus(options) {
    var opts = options || {};
    var now = toDate(opts.now);
    var periods = normalizePeriods(opts.peakPeriods);
    var warningMinutes = normalizeWarning(opts.warningMinutes);
    var dayInfo = getDayInfo(now, opts);
    var minutesNow = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    var status = 'off-peak';
    if (dayInfo.isPeakDay) {
      for (var i = 0; i < periods.length; i++) {
        if (minutesNow >= periods[i].start && minutesNow < periods[i].end) {
          status = 'peak';
          break;
        }
      }
      if (status !== 'peak') {
        for (var j = 0; j < periods.length; j++) {
          if (minutesNow >= periods[j].start - warningMinutes && minutesNow < periods[j].start) {
            status = 'warning';
            break;
          }
        }
      }
    }

    var nextStart = findNextPeakStart(now, periods, opts);
    var coverage = getCoverageInfo(now);

    return {
      status: status,
      isPeakDay: dayInfo.isPeakDay,
      dayReason: dayInfo.reason,
      isHoliday: !!dayInfo.holidayName,
      holidayName: dayInfo.holidayName,
      isWeekend: dayInfo.isWeekend,
      isMakeupWorkday: dayInfo.isMakeupWorkday,
      isCustomOffDay: dayInfo.isCustomOffDay,
      nextPeakStart: nextStart ? Math.round((nextStart.getTime() - startOfDay(now).getTime()) / 60000) : null,
      nextPeakAt: nextStart ? nextStart.toISOString() : null,
      coverage: coverage,
      currentTime: now.toLocaleTimeString('zh-CN', { hour12: false }),
      currentDate: now.toLocaleDateString('zh-CN')
    };
  }

  // 倒计时：高峰中返回距结束，否则返回距下一个高峰开始
  function getCountdown(options) {
    var opts = options || {};
    var now = toDate(opts.now);
    var status = getTimeStatus(opts);
    var periods = normalizePeriods(opts.peakPeriods);
    if (!periods.length) return null;

    var secondsNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var label = '距高峰';
    var seconds = null;

    if (status.status === 'peak') {
      for (var i = 0; i < periods.length; i++) {
        if (secondsNow >= periods[i].start * 60 && secondsNow < periods[i].end * 60) {
          seconds = periods[i].end * 60 - secondsNow;
          label = '距结束';
          break;
        }
      }
    } else if (status.nextPeakAt) {
      seconds = Math.round((new Date(status.nextPeakAt).getTime() - now.getTime()) / 1000);
    }

    if (seconds === null) return null;
    if (seconds < 0) seconds = 0;
    return {
      label: label,
      seconds: seconds,
      status: status.status,
      holidayName: status.holidayName
    };
  }

  // 秒数格式化为 HH:MM:SS，超过一天显示 X天HH:MM:SS
  function formatCountdown(seconds) {
    var total = Math.max(0, Math.floor(seconds));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var head = pad2(h);
    if (h >= 24) head = Math.floor(h / 24) + '天' + pad2(h % 24);
    return head + ':' + pad2(m) + ':' + pad2(s);
  }

  // 解析“额外空闲日期”文本，支持换行/逗号分隔与 2027-01-01 ~ 2027-01-03 区间
  // 返回 { days: [...], invalid: [...] }
  function parseOffDaysText(text) {
    var days = [];
    var invalid = [];
    var seen = {};

    function push(key) {
      if (!seen[key]) {
        seen[key] = true;
        days.push(key);
      }
    }

    // 先按换行/逗号/顿号切成条目，条目内部允许用 ~ 表示区间（区间两侧可以有空格）
    var entries = String(text || '').split(/[\n\r,，;；、]+/);
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i].trim();
      if (!entry) continue;

      var range = entry.match(/^(\d{4}-\d{2}-\d{2})\s*(?:~|～|—|–|至)\s*(\d{4}-\d{2}-\d{2})$/);
      if (range) {
        if (!isValidDateKey(range[1]) || !isValidDateKey(range[2]) || range[1] > range[2]) {
          invalid.push(entry);
          continue;
        }
        var cursor = new Date(Number(range[1].slice(0, 4)), Number(range[1].slice(5, 7)) - 1, Number(range[1].slice(8, 10)));
        var end = new Date(Number(range[2].slice(0, 4)), Number(range[2].slice(5, 7)) - 1, Number(range[2].slice(8, 10)));
        var guard = 0;
        while (cursor.getTime() <= end.getTime() && guard++ < 400) {
          push(dateKey(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
        continue;
      }

      // 没有区间的条目允许用空白分隔多个日期
      var tokens = entry.split(/\s+/);
      for (var j = 0; j < tokens.length; j++) {
        var token = tokens[j];
        if (!token) continue;
        if (isValidDateKey(token)) {
          push(token);
        } else {
          invalid.push(token);
        }
      }
    }

    return { days: days.sort(), invalid: invalid };
  }

  // 把日期列表合并为便于编辑的文本（连续日期合并为区间）
  function formatOffDaysText(days) {
    var sorted = (days || []).slice().sort();
    var lines = [];
    for (var i = 0; i < sorted.length; i++) {
      var start = sorted[i];
      var end = start;
      while (i + 1 < sorted.length) {
        var cursor = new Date(Number(sorted[i].slice(0, 4)), Number(sorted[i].slice(5, 7)) - 1, Number(sorted[i].slice(8, 10)));
        cursor.setDate(cursor.getDate() + 1);
        if (dateKey(cursor) !== sorted[i + 1]) break;
        i++;
        end = sorted[i];
      }
      lines.push(start === end ? start : start + ' ~ ' + end);
    }
    return lines.join('\n');
  }

  return {
    DEFAULT_PEAK_PERIODS: DEFAULT_PEAK_PERIODS,
    DEFAULT_PEAK_WEEKDAYS: DEFAULT_PEAK_WEEKDAYS,
    DEFAULT_WARNING_MINUTES: DEFAULT_WARNING_MINUTES,
    DATA_YEARS: DATA_YEARS,
    dateKey: dateKey,
    parseTime: parseTime,
    normalizePeriods: normalizePeriods,
    normalizeWeekdays: normalizeWeekdays,
    getHolidayInfo: getHolidayInfo,
    isMakeupWorkday: isMakeupWorkday,
    getDayInfo: getDayInfo,
    getCoverageInfo: getCoverageInfo,
    getTimeStatus: getTimeStatus,
    getCountdown: getCountdown,
    formatCountdown: formatCountdown,
    parseOffDaysText: parseOffDaysText,
    formatOffDaysText: formatOffDaysText
  };
})();
