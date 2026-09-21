# AGENTS.md

## 仓库结构

- 扩展本体在 `deepseek-monitor/`，仓库根目录 `README.md` 仅是说明。加载未打包扩展必须选 `deepseek-monitor` 文件夹，不是仓库根。
- `holidays.js` 是峰谷/节假日唯一算法来源，`background.js` 用 `importScripts` 引入，`content.js` 由 manifest 前置注入。
- 无构建步骤，纯 Manifest V3 静态文件直接加载。`package.json` 仅用于 `test`/`demo` 脚本，无 `build`。
- 图标已从 `D:/Desktop/th.png` 生成到 `deepseek-monitor/icons/` (16/48/128)，不要随意重新生成覆盖。

## 调试与验证

- 安装：`edge://extensions/` 开启开发者模式 → 加载已解压的扩展 → 选择 `deepseek-monitor`。
- 修改 `manifest.json` 的 `host_permissions`/`permissions` 后必须点扩展卡片的**重新加载**，已打开的目标页需刷新才生效。
- 本地测试（无打包）：
  ```bash
  python deepseek-monitor/test-server.py  # 带 /user/balance 模拟，访问 http://127.0.0.1:3000/test.html
  python deepseek-monitor/server.py        # 仅静态文件
  python deepseek-monitor/demo.py          # 启动并自动打开浏览器
  ```
- 语法自检：`node -c deepseek-monitor/holidays.js && node -c deepseek-monitor/background.js && node -c deepseek-monitor/content.js && node -c deepseek-monitor/popup.js`
- 峰谷逻辑回归测试：`node deepseek-monitor/test-peak.js`（覆盖春节/国庆/调休上班周末/倒计时等 34 项用例）

## 架构与关键文件

- `manifest.json`: `host_permissions: <all_urls>` + `content_scripts.matches: http://*/*, https://*/*`。实际显示由 `targetUrls` 运行时过滤，不要在 manifest 层收紧匹配否则多网站配置失效。
- `holidays.js`: 全局对象 `DS_PEAK`。内置国务院公布的放假安排（2023-2026 年），统一提供 `getDayInfo/getTimeStatus/getCountdown/findNextPeakStart`。判断口径：周一至周五（不含法定节假日）9:00-12:00、14:00-18:00 为高峰；周末（含调休上班的周末）与法定节假日全天空闲。
- `background.js`: Service Worker，余额请求入口，峰谷状态改为调用 `DS_PEAK.getTimeStatus()`。`checkAndNotify()` 每分钟 `alarms` 触发，`FORCE_REFRESH`/`GET_MONITOR_DATA` 消息由 popup/content 调用。余额仅当 `tabs.query` 发现有 `isTargetUrl` 的标签页时才 `fetch`。
- `content.js`: 注入到所有 http/https 页，自检 `shouldShowMonitor()` 匹配 `targetUrls` 才显示胶囊悬浮窗。状态与倒计时走 `DS_PEAK`，每秒重算一次，不再依赖一分钟一次的 background 快照。位置持久化用 `localStorage: ds-monitor-position`，不是 `chrome.storage`。
- `popup.html/css/js`: 设置页；实时时钟本地 `setInterval` 走秒，不依赖 `background` 快照。

## 设置与迁移

- `chrome.storage.local.settings` 结构（`DEFAULT_SETTINGS`）：
  ```js
  { targetUrls:[], refreshInterval, apiKey, enabled, peakPeriods:[{start,end}], peakWeekdays:[0-6], warningMinutes, respectChinaHolidays, customOffDays:['YYYY-MM-DD'] }
  ```
- 兼容旧版：`targetUrl→targetUrls`、`peakPeriods/peakWeekdays/warningMinutes/respectChinaHolidays/customOffDays` 缺失时自动迁移（`background.js` 的 `onInstalled` 和 `popup.js` 的 `loadSettings`）。改默认值需两处同步，峰谷默认值优先引用 `DS_PEAK.DEFAULT_*`。
- `background.js:UPDATE_SETTINGS` 保存后会用 `chrome.scripting.executeScript/insertCSS` 向已打开的匹配标签页动态注入，否则新加的网站需刷新才出现。
- 动态注入的 `files` 必须是 `['holidays.js', 'content.js']`，漏掉 `holidays.js` 会让 `DS_PEAK` 未定义。

## 峰谷与时间

- 全部使用本地系统时间 `new Date()`，不要再加 `UTC+8` 转换。
- `peakPeriods` 为 `HH:MM` 字符串对，`peakWeekdays` 为 0(日)～6(六)。`warningMinutes` 为高峰前预警。排序、过滤 `end>start`、跨节假日顺延下一个高峰，全部在 `holidays.js` 内实现。
- `respectChinaHolidays`（默认 true）开启时，法定节假日与周末强制空闲，此时 `peakWeekdays` 里的周六/周日不再生效；关闭后回退到旧的“只按星期几”判断。`customOffDays` 无论开关都生效。
- 节假日数据过期（当前覆盖 2023-2026 年）时，`getCoverageInfo()` 会返回提示，设置页可用“额外空闲日期”手动补充 `YYYY-MM-DD` 或 `YYYY-MM-DD ~ YYYY-MM-DD`。

## 余额 API

- `GET https://api.deepseek.com/user/balance` 响应为 `{ is_available, balance_infos:[{currency, total_balance, granted_balance, topped_up_balance}] }`，`total_balance` 是字符串。优先取 `CNY`，无则取 `USD`。`background.js:fetchBalance` 已处理新旧格式兼容，不要改回 `data.balance`。

## 常见坑

- 多网站不生效：优先检查 `manifest.json` 是否仍为 `<all_urls>`。
- 已打开页不显示：`UPDATE_SETTINGS` 的动态注入依赖 `scripting` 权限，失败会被 `catch` 静默忽略，需提示用户刷新页。
- 时间/倒计时不一致：算法已集中到 `holidays.js`，不要再在 `background.js`/`content.js` 里另写一份。
- 峰谷规则改动：只需改 `holidays.js`，并同步更新 `test-peak.js` 用例与文档中的规则描述。
