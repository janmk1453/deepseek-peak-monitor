# DeepSeek 峰谷监控

Edge 扩展，实时显示 DeepSeek 峰谷时间与余额。

- 胶囊悬浮窗，半透明毛玻璃，红/黄/绿区分高峰/预警/空闲
- 显示当前时间（走秒）、余额、距离高峰开始/结束倒计时
- 支持多生效网站、自定义峰谷时段与预警
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
```