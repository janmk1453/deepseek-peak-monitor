# DeepSeek 峰谷监控

Edge 扩展，实时显示 DeepSeek 峰谷时间与余额。

- 胶囊悬浮窗，半透明毛玻璃，红/黄/绿区分高峰/预警/空闲
- 显示当前时间（走秒）、余额、距离高峰开始/结束倒计时
- 支持多生效网站、自定义峰谷时段与预警
- 按官方规则判断峰谷：法定节假日与周末（含调休上班的周末）全天按空闲时段计费
- 悬浮胶囊限制在浏览器可视区域内，拖到边缘或缩小窗口都不会被裁掉
- 仅在目标网站打开时请求余额

## 安装

1. `edge://extensions/` 开启开发者模式
2. 加载已解压的扩展 → 选择 `deepseek-monitor` 文件夹
3. 扩展图标 → 配置生效网站、API Key、峰谷时间

## 目录

- `deepseek-monitor/` 扩展本体

## 开发

```bash
python deepseek-monitor/test-server.py
# 访问 http://127.0.0.1:3000/test.html

node deepseek-monitor/test-peak.js
# 峰谷/节假日判断回归测试，34 项用例
```
