# DeepSeek Monitor - 项目总结

## 项目概述

DeepSeek Monitor 是一个Edge浏览器插件，用于监控DeepSeek API的峰谷时间和余额。插件会在指定网站上显示一个美观的浮窗，实时显示当前的峰谷状态、余额信息和下次高峰时间。

## 核心功能

### 1. 峰谷时间监控
- **高峰时段**：周一至周五 9:00-12:00, 14:00-18:00
- **空闲时段**：其余所有时间
- **价格差异**：空闲时段价格是高峰时段的一半

### 2. 状态指示器
- **红色圆点**：高峰时段
- **黄色圆点**：高峰开始前10分钟
- **绿色圆点**：空闲时段

### 3. 余额显示
- 实时显示DeepSeek API账户余额
- 需要配置有效的API Key

### 4. 可自定义设置
- 目标网址（默认：http://127.0.0.1:3000/）
- API Key
- 刷新间隔（10-3600秒）
- 启用/禁用监控

## 项目结构

```
deepseek-monitor/
├── manifest.json          # 插件配置文件
├── background.js          # 后台服务脚本
├── content.js            # 内容脚本（注入页面）
├── content.css           # 内容脚本样式
├── popup.html            # 弹出设置页面
├── popup.css             # 弹出页面样式
├── popup.js              # 弹出页面逻辑
├── test.html             # 测试页面
├── server.py             # 基础HTTP服务器
├── test-server.py        # 测试服务器（带模拟API）
├── generate-icons.js     # 图标生成脚本
├── start-test.bat        # Windows启动脚本
├── package.json          # 项目配置
├── README.md             # 项目说明
├── QUICKSTART.md         # 快速开始指南
├── .gitignore           # Git忽略文件
└── icons/               # 插件图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 技术实现

### 前端技术
- **HTML/CSS/JavaScript**：基础前端技术
- **Chrome Extension API**：Manifest V3
- **Service Worker**：后台定时任务
- **Content Script**：页面注入
- **Chrome Storage**：数据存储
- **Chrome Alarms**：定时刷新

### UI设计
- 现代化设计风格
- 响应式布局
- 支持深色模式
- 流畅的动画效果
- 可拖动的浮窗

## 安装和使用

### 快速安装

1. **下载项目**
   ```bash
   git clone https://github.com/your-username/deepseek-monitor.git
   ```

2. **打开Edge扩展管理页面**
   - 地址栏输入：`edge://extensions/`

3. **开启开发者模式**
   - 页面左下角开启"开发人员模式"

4. **加载插件**
   - 点击"加载解压缩的扩展"
   - 选择 `deepseek-monitor` 文件夹

5. **测试插件**
   - 运行测试服务器：`python test-server.py`
   - 访问：`http://127.0.0.1:3000/`

### 配置说明

点击插件图标打开设置页面：

- **目标网址**：要监控的网站地址
- **API Key**：DeepSeek API密钥（可选）
- **刷新间隔**：自动刷新时间（秒）
- **启用监控**：开关监控功能

## 测试环境

### 测试服务器功能
- 模拟DeepSeek API余额接口
- 提供测试页面
- 支持CORS跨域请求

### 启动测试

```bash
# 方法1：使用npm
npm run test

# 方法2：直接运行Python
python test-server.py

# 方法3：Windows双击
start-test.bat
```

## 开发说明

### 添加新功能

1. 修改 `background.js` 添加后台逻辑
2. 修改 `content.js` 和 `content.css` 更新UI
3. 修改 `popup.html/js/css` 更新设置页面
4. 更新 `manifest.json` 添加必要的权限

### 调试技巧

1. **查看后台日志**
   - 在 `edge://extensions/` 页面点击"背景页"链接

2. **查看内容脚本日志**
   - 在测试页面按F12打开开发者工具
   - 查看Console标签

3. **查看存储数据**
   - 在开发者工具中输入：
     ```javascript
     chrome.storage.local.get(null, console.log)
     ```

## 未来改进

### 计划功能
- [ ] 支持多个API Key
- [ ] 历史余额图表
- [ ] 价格提醒通知
- [ ] 更多自定义主题
- [ ] 导出使用统计

### 优化方向
- 性能优化
- 更准确的时间计算
- 更好的错误处理
- 国际化支持

## 许可证

MIT License

## 联系方式

- 项目地址：https://github.com/your-username/deepseek-monitor
- 问题反馈：GitHub Issues