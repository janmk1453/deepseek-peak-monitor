# 发布说明

## v1.0.0 (2026-08-29)

### 🎉 首次发布

DeepSeek Monitor v1.0.0 正式发布！

### ✨ 新功能

#### 核心功能
- **峰谷时间监控**：实时检测当前是高峰还是空闲时段
- **状态指示器**：红/黄/绿色圆点直观显示状态
- **余额显示**：显示DeepSeek API账户余额
- **价格对比**：清晰展示峰谷价格差异

#### 状态指示
- 🔴 **红色**：高峰时段（周一至周五 9:00-12:00, 14:00-18:00）
- 🟡 **黄色**：高峰开始前10分钟
- 🟢 **绿色**：空闲时段（其余时间）

#### 价格信息
- **高峰时段**：¥2.00 / 1M tokens
- **空闲时段**：¥1.00 / 1M tokens（高峰的一半）

#### 界面特性
- 现代化UI设计
- 可拖动的浮窗
- 支持深色模式
- 流畅的动画效果
- 响应式布局

#### 配置选项
- 自定义目标网址
- API Key配置
- 可调节刷新间隔
- 启用/禁用监控

### 🛠️ 技术实现

- **Manifest V3**：使用最新的Chrome扩展API
- **Service Worker**：后台定时检查峰谷时间
- **Content Script**：在页面中注入监控界面
- **Chrome Storage**：存储设置和监控数据
- **Chrome Alarms**：实现定时刷新功能

### 📦 包含文件

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
├── DEMO.md              # 使用演示
├── PROJECT.md           # 项目总结
├── CONTRIBUTING.md       # 贡献指南
├── LICENSE              # MIT许可证
└── icons/               # 插件图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 🚀 快速开始

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

### 📝 使用说明

#### 安装插件
- 详细步骤请查看 [QUICKSTART.md](QUICKSTART.md)

#### 配置设置
- 点击插件图标打开设置页面
- 配置目标网址、API Key、刷新间隔等

#### 测试功能
- 运行测试服务器：`npm run test`
- 访问测试页面：`http://127.0.0.1:3000/test.html`

### 🐛 已知问题

- 无

### 🔮 未来计划

- [ ] 支持多个API Key
- [ ] 历史余额图表
- [ ] 价格提醒通知
- [ ] 更多自定义主题
- [ ] 导出使用统计
- [ ] 国际化支持

### 📊 测试情况

- ✅ Edge浏览器最新版本
- ✅ Windows 10/11
- ✅ 高峰时段状态显示
- ✅ 空闲时段状态显示
- ✅ 警告时段状态显示
- ✅ 余额获取功能
- ✅ 设置保存功能
- ✅ 拖动功能
- ✅ 深色模式支持

### 🙏 致谢

感谢所有为项目做出贡献的人！

### 📞 反馈与支持

- **GitHub Issues**: 项目问题和建议
- **Email**: your-email@example.com

---

**感谢使用DeepSeek Monitor！**