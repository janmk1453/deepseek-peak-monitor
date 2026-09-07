# DeepSeek Monitor - 完整项目文件列表

## 核心文件

### 插件核心
1. **manifest.json** - 插件配置文件
   - 定义插件名称、版本、权限
   - 配置后台脚本、内容脚本
   - 设置图标和弹出页面

2. **background.js** - 后台服务脚本
   - 定时检查峰谷时间
   - 获取DeepSeek API余额
   - 与内容脚本通信

3. **content.js** - 内容脚本
   - 在页面中注入监控浮窗
   - 更新UI显示
   - 处理用户交互

4. **content.css** - 内容脚本样式
   - 现代化UI设计
   - 支持深色模式
   - 流畅动画效果

### 弹出页面
5. **popup.html** - 弹出设置页面
   - 显示当前状态
   - 配置设置选项

6. **popup.css** - 弹出页面样式
   - 设置页面UI设计
   - 响应式布局

7. **popup.js** - 弹出页面逻辑
   - 加载和保存设置
   - 显示当前状态

### 图标
8. **generate-icons.js** - 图标生成脚本
   - 生成占位符图标
   - 用于开发测试

9. **icons/** - 图标文件夹
   - icon16.png - 16x16图标
   - icon48.png - 48x48图标
   - icon128.png - 128x128图标

## 测试文件

10. **test.html** - 测试页面
    - 展示插件功能
    - 提供安装说明

11. **server.py** - 基础HTTP服务器
    - 提供静态文件服务
    - 简单的测试环境

12. **test-server.py** - 测试服务器
    - 模拟DeepSeek API
    - 提供余额数据
    - 支持CORS

13. **demo.py** - 快速演示脚本
    - 自动启动服务器
    - 打开浏览器测试

## 文档文件

14. **README.md** - 项目说明
    - 项目介绍
    - 功能特性
    - 安装步骤
    - 使用方法

15. **QUICKSTART.md** - 快速开始指南
    - 详细安装步骤
    - 配置说明
    - 常见问题

16. **DEMO.md** - 使用演示
    - 操作步骤演示
    - 场景使用示例
    - 故障排除

17. **PROJECT.md** - 项目总结
    - 项目概述
    - 技术实现
    - 未来改进

18. **CONTRIBUTING.md** - 贡献指南
    - 如何贡献
    - 开发规范
    - 提交流程

19. **CHANGELOG.md** - 发布说明
    - 版本更新记录
    - 新功能说明

20. **LICENSE** - MIT许可证
    - 开源许可

## 配置文件

21. **package.json** - 项目配置
    - npm脚本
    - 项目信息

22. **.gitignore** - Git忽略文件
    - 排除不需要的文件

## 启动脚本

23. **start-test.bat** - Windows启动脚本
    - 一键启动测试服务器

24. **install.bat** - Windows安装脚本
    - 一键安装和配置

## 文件作用说明

### 核心功能文件
- **manifest.json**: 插件的"身份证"，定义所有配置
- **background.js**: 插件的"大脑"，处理后台逻辑
- **content.js**: 插件的"眼睛"，在页面中显示
- **content.css**: 插件的"衣服"，美化界面

### 测试文件
- **test.html**: 测试插件的"舞台"
- **test-server.py**: 模拟API的"演员"
- **demo.py**: 快速演示的"导演"

### 文档文件
- **README.md**: 项目的"说明书"
- **QUICKSTART.md**: 快速入门的"捷径"
- **DEMO.md**: 使用演示的"视频"
- **CONTRIBUTING.md**: 贡献指南的"规则"

## 文件大小统计

```
核心文件:
  manifest.json      ~1KB
  background.js      ~5KB
  content.js         ~8KB
  content.css        ~6KB
  popup.html         ~3KB
  popup.css          ~8KB
  popup.js           ~3KB

测试文件:
  test.html          ~4KB
  server.py          ~1KB
  test-server.py     ~2KB
  demo.py            ~3KB

文档文件:
  README.md          ~8KB
  QUICKSTART.md      ~12KB
  DEMO.md           ~15KB
  PROJECT.md        ~10KB
  CONTRIBUTING.md   ~12KB
  CHANGELOG.md      ~8KB
  LICENSE           ~1KB

配置文件:
  package.json       ~1KB
  .gitignore         ~0.5KB
  generate-icons.js  ~2KB

启动脚本:
  start-test.bat     ~0.5KB
  install.bat        ~1KB

总计: ~100KB
```

## 文件依赖关系

```
manifest.json
  ├── background.js
  │   └── (Chrome API)
  ├── content.js
  │   └── content.css
  ├── popup.html
  │   ├── popup.css
  │   └── popup.js
  └── icons/
      ├── icon16.png
      ├── icon48.png
      └── icon128.png

测试环境:
  test.html
  ├── (需要) test-server.py
  └── (可选) server.py

启动脚本:
  install.bat
  └── (调用) test-server.py
  └── (调用) generate-icons.js

文档:
  README.md
  ├── QUICKSTART.md
  ├── DEMO.md
  ├── PROJECT.md
  └── CONTRIBUTING.md
```

## 文件使用频率

### 高频使用
1. **manifest.json** - 每次加载插件
2. **background.js** - 后台持续运行
3. **content.js** - 页面加载时执行
4. **content.css** - 页面显示时使用

### 中频使用
5. **popup.html/js/css** - 点击插件图标时
6. **test.html** - 测试时使用
7. **test-server.py** - 开发测试时

### 低频使用
8. **generate-icons.js** - 首次安装时
9. **install.bat** - 首次安装时
10. **demo.py** - 演示时使用

### 参考文档
11. **README.md** - 首次了解项目
12. **QUICKSTART.md** - 安装配置时
13. **DEMO.md** - 学习使用时
14. **CONTRIBUTING.md** - 贡献代码时

## 文件更新频率

### 频繁更新
- **content.js** - UI逻辑调整
- **content.css** - 样式优化
- **popup.js** - 设置功能改进

### 偶尔更新
- **background.js** - 后台逻辑优化
- **manifest.json** - 权限更新
- **README.md** - 文档更新

### 很少更新
- **test.html** - 测试页面
- **server.py** - 基础服务器
- **generate-icons.js** - 图标生成

### 几乎不更新
- **LICENSE** - 许可证
- **.gitignore** - 忽略规则
- **package.json** - 项目配置

## 文件重要性

### 必需文件（插件运行）
1. manifest.json ⭐⭐⭐⭐⭐
2. background.js ⭐⭐⭐⭐⭐
3. content.js ⭐⭐⭐⭐⭐
4. content.css ⭐⭐⭐⭐
5. icons/ ⭐⭐⭐

### 推荐文件（用户体验）
6. popup.html ⭐⭐⭐⭐
7. popup.css ⭐⭐⭐
8. popup.js ⭐⭐⭐

### 可选文件（测试开发）
9. test.html ⭐⭐
10. test-server.py ⭐⭐
11. demo.py ⭐

### 文档文件（参考学习）
12. README.md ⭐⭐⭐⭐
13. QUICKSTART.md ⭐⭐⭐
14. DEMO.md ⭐⭐
15. CONTRIBUTING.md ⭐⭐

## 文件组织原则

1. **按功能分类**：核心、测试、文档、配置
2. **按使用频率**：高频在前，低频在后
3. **按重要性**：必需在前，可选在后
4. **按更新频率**：频繁更新在前，很少更新在后

这种组织方式便于：
- 快速找到需要的文件
- 理解项目结构
- 进行开发和维护
- 新手快速上手