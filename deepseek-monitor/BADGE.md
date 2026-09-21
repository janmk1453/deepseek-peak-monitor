# DeepSeek Monitor

## 项目状态

![版本](https://img.shields.io/badge/版本-v1.0.0-blue)
![状态](https://img.shields.io/badge/状态-已完成-brightgreen)
![许可证](https://img.shields.io/badge/许可证-MIT-yellow)
![平台](https://img.shields.io/badge/平台-Edge浏览器-purple)

## 项目简介

DeepSeek Monitor 是一个Edge浏览器插件，用于监控DeepSeek API的峰谷时间和余额。

## 核心功能

- 🔴 **峰谷时间监控**：实时检测高峰/空闲时段
- 🟡 **状态指示器**：红/黄/绿色圆点显示状态
- 💰 **余额显示**：显示DeepSeek API账户余额
- 💵 **价格对比**：清晰展示峰谷价格差异
- ⚙️ **可自定义**：支持配置目标网址、API Key等

## 快速开始

```bash
# 1. 进入项目目录
cd deepseek-monitor

# 2. 启动测试服务器
python test-server.py

# 3. 打开Edge浏览器
# 访问 edge://extensions/
# 开启"开发人员模式"
# 点击"加载解压缩的扩展"
# 选择 deepseek-monitor 文件夹

# 4. 测试插件
# 访问 http://127.0.0.1:3000/test.html
```

## 价格信息

- **高峰时段**: ¥2.00 / 1M tokens
  - 周一至周五（不含中国法定节假日）9:00-12:00, 14:00-18:00
- **空闲时段**: ¥1.00 / 1M tokens
  - 其余所有时间，含周末与法定节假日全天

## 文件结构

```
deepseek-monitor/
├── manifest.json          # 插件配置
├── background.js          # 后台脚本
├── content.js            # 内容脚本
├── content.css           # 内容样式
├── popup.html/js/css     # 弹出页面
├── test.html             # 测试页面
├── test-server.py        # 测试服务器
├── README.md             # 项目说明
├── QUICKSTART.md         # 快速开始
└── icons/               # 插件图标
```

## 文档

- [README.md](README.md) - 项目说明
- [QUICKSTART.md](QUICKSTART.md) - 快速开始指南
- [DEMO.md](DEMO.md) - 使用演示
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南

## 许可证

MIT License
