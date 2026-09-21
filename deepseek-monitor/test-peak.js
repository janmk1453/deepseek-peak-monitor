// 峰谷与节假日判断回归测试
// 运行：node test-peak.js
// 覆盖：普通工作日、午休、节假日、调休上班的周末、自定义空闲日、倒计时与数据覆盖提示

const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, 'holidays.js'), 'utf8');
const DS_PEAK = new Function(code + '\nreturn DS_PEAK;')();

let passed = 0;
const failures = [];

function at(year, month, day, hour, minute) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log('通过  ' + name);
  } else {
    failures.push(name + '：期望 ' + e + '，实际 ' + a);
    console.log('失败  ' + name + '：期望 ' + e + '，实际 ' + a);
  }
}

function status(now, extra) {
  return DS_PEAK.getTimeStatus(Object.assign({
    now: now,
    peakPeriods: DS_PEAK.DEFAULT_PEAK_PERIODS,
    peakWeekdays: DS_PEAK.DEFAULT_PEAK_WEEKDAYS,
    warningMinutes: 10,
    respectChinaHolidays: true
  }, extra || {}));
}

function nextPeakText(now, extra) {
  const info = status(now, extra);
  if (!info.nextPeakAt) return null;
  const d = new Date(info.nextPeakAt);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function countdown(now, extra) {
  return DS_PEAK.getCountdown(Object.assign({
    now: now,
    peakPeriods: DS_PEAK.DEFAULT_PEAK_PERIODS,
    peakWeekdays: DS_PEAK.DEFAULT_PEAK_WEEKDAYS,
    warningMinutes: 10,
    respectChinaHolidays: true
  }, extra || {}));
}

// 普通工作日：高峰、午休空闲、预警
check('周一上午高峰', status(at(2026, 9, 21, 10, 30)).status, 'peak');
check('周一午休空闲', status(at(2026, 9, 21, 12, 30)).status, 'off-peak');
check('周一 13:55 预警', status(at(2026, 9, 21, 13, 55)).status, 'warning');
check('周五 17:59 仍高峰', status(at(2026, 9, 18, 17, 59)).status, 'peak');
check('周五 18:00 转空闲', status(at(2026, 9, 18, 18, 0)).status, 'off-peak');

// 周末与调休上班的周末：全天空闲
check('普通周六上午空闲', status(at(2026, 9, 19, 10, 0)).dayReason, 'weekend');
check('调休上班周日按空闲', status(at(2026, 9, 20, 10, 30)).status, 'off-peak');
check('调休上班周日有标记', status(at(2026, 9, 20, 10, 30)).isMakeupWorkday, true);
check('元旦调休上班周日按空闲', status(at(2026, 1, 4, 10, 30)).status, 'off-peak');

// 法定节假日：工作日也全天空闲
check('春节假期周二空闲', status(at(2026, 2, 17, 12, 0)).status, 'off-peak');
check('春节假期名称', status(at(2026, 2, 17, 12, 0)).holidayName, '春节');
check('春节假期周一上午空闲', status(at(2026, 2, 16, 10, 0)).status, 'off-peak');
check('中秋假期周五上午空闲', status(at(2026, 9, 25, 10, 0)).status, 'off-peak');
check('国庆假期周四上午空闲', status(at(2026, 10, 1, 10, 0)).status, 'off-peak');
check('2025 春节假期空闲', status(at(2025, 1, 29, 10, 0)).status, 'off-peak');
check('2024 国庆假期空闲', status(at(2024, 10, 2, 10, 0)).status, 'off-peak');

// 下一个高峰需跳过节假日与周末
check('国庆期间下一个高峰顺延到 10-08', nextPeakText(at(2026, 10, 1, 10, 0)), '2026-10-08 09:00');
check('周五夜间下一个高峰为周一', nextPeakText(at(2026, 9, 18, 19, 0)), '2026-09-21 09:00');
check('周日上午下一个高峰为周一', nextPeakText(at(2026, 9, 20, 10, 30)), '2026-09-21 09:00');

// 倒计时
check('开盘前倒计时标签', countdown(at(2026, 9, 21, 8, 55)).label, '距高峰');
check('开盘前倒计时秒数', countdown(at(2026, 9, 21, 8, 55)).seconds, 300);
check('高峰中倒计时标签', countdown(at(2026, 9, 21, 10, 0)).label, '距结束');
check('高峰中倒计时秒数', countdown(at(2026, 9, 21, 10, 0)).seconds, 7200);
check('超过一天倒计时格式', DS_PEAK.formatCountdown(90000), '1天01:00:00');

// 关闭节假日规则后回退到旧的“按星期”行为
check('关闭节假日规则后春节按高峰', status(at(2026, 2, 17, 10, 30), { respectChinaHolidays: false }).status, 'peak');
check('关闭节假日规则后周六仍空闲', status(at(2026, 9, 19, 10, 30), { respectChinaHolidays: false }).status, 'off-peak');

// 自定义额外空闲日期
check('自定义空闲日按空闲', status(at(2026, 9, 21, 10, 30), { customOffDays: ['2026-09-21'] }).status, 'off-peak');
check('自定义空闲日原因', status(at(2026, 9, 21, 10, 30), { customOffDays: ['2026-09-21'] }).dayReason, 'custom-off');

// 额外空闲日期文本解析与格式化
const parsed = DS_PEAK.parseOffDaysText('2026-12-31 ~ 2027-01-02, 2027-01-05');
check('区间解析天数', parsed.days.length, 4);
check('区间解析无效项', parsed.invalid.length, 0);
check('无效日期会被标记', DS_PEAK.parseOffDaysText('2027-02-30').invalid.length, 1);
check('日期列表合并为区间', DS_PEAK.formatOffDaysText(['2027-01-01', '2027-01-02', '2027-01-05']), '2027-01-01 ~ 2027-01-02\n2027-01-05');

// 数据覆盖提示
check('2026 年在覆盖范围内', DS_PEAK.getCoverageInfo(at(2026, 9, 20, 10, 0)).covered, true);
check('2027 年未收录会提示', DS_PEAK.getCoverageInfo(at(2027, 1, 1, 10, 0)).covered, false);

console.log('');
console.log('通过 ' + passed + ' 项，失败 ' + failures.length + ' 项');
if (failures.length) {
  failures.forEach(item => console.log(' - ' + item));
  process.exit(1);
}
