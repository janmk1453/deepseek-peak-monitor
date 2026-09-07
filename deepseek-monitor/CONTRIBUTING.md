# 贡献指南

感谢你对DeepSeek Monitor项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告Bug

如果你发现了Bug，请通过以下方式报告：

1. **检查是否已存在**
   - 在GitHub Issues中搜索相关问题

2. **创建新Issue**
   - 使用清晰的标题描述问题
   - 提供详细的复现步骤
   - 包含错误信息和截图
   - 说明你的环境（Edge版本、操作系统等）

### 提交功能建议

1. **描述你的想法**
   - 清晰描述功能用途
   - 说明为什么这个功能有价值
   - 提供使用场景示例

2. **创建Issue**
   - 使用"feature request"标签
   - 详细描述功能需求

### 提交代码

#### 准备工作

1. **Fork项目**
   - 在GitHub上Fork项目到你的账号

2. **克隆到本地**
   ```bash
   git clone https://github.com/your-username/deepseek-monitor.git
   cd deepseek-monitor
   ```

3. **创建分支**
   ```bash
   # 功能分支
   git checkout -b feature/your-feature-name
   
   # Bug修复分支
   git checkout -b fix/your-fix-name
   ```

#### 开发规范

1. **代码风格**
   - 使用2空格缩进
   - 使用有意义的变量名
   - 添加必要的注释
   - 遵循ES6+语法

2. **文件组织**
   - 保持文件结构清晰
   - 相关功能放在同一文件
   - 避免过大的文件

3. **测试**
   - 测试你的修改
   - 确保在Edge浏览器中正常工作
   - 检查不同时间状态下的显示

#### 提交规范

1. **提交信息格式**
   ```
   类型(范围): 简短描述
   
   详细描述（可选）
   
   相关Issue（可选）
   ```

2. **提交类型**
   - `feat`: 新功能
   - `fix`: Bug修复
   - `docs`: 文档更新
   - `style`: 代码格式（不影响功能）
   - `refactor`: 重构
   - `test`: 添加测试
   - `chore`: 其他修改

3. **示例**
   ```
   feat(ui): 添加深色模式支持
   
   - 添加深色模式切换按钮
   - 优化深色模式下的颜色对比度
   - 保存用户主题偏好
   
   Closes #123
   ```

#### 发起Pull Request

1. **推送代码**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **创建PR**
   - 在GitHub上创建Pull Request
   - 填写PR描述
   - 关联相关Issue

3. **PR描述模板**
   ```markdown
   ## 修改说明
   
   简要描述你的修改内容...
   
   ## 修改类型
   
   - [ ] Bug修复
   - [ ] 新功能
   - [ ] 重构
   - [ ] 文档更新
   - [ ] 其他
   
   ## 测试情况
   
   - [ ] 已在Edge浏览器中测试
   - [ ] 已测试不同时间状态
   - [ ] 已测试设置页面
   - [ ] 已测试API调用
   
   ## 相关Issue
   
   Closes #123
   ```

## 开发环境

### 必需工具

- **Node.js** (v14+)
- **Python** (v3.6+)
- **Edge浏览器**
- **代码编辑器** (推荐VS Code)

### 设置开发环境

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/deepseek-monitor.git
   cd deepseek-monitor
   ```

2. **安装依赖**
   ```bash
   # 安装Node.js依赖（如果有）
   npm install
   ```

3. **生成图标**
   ```bash
   node generate-icons.js
   ```

4. **启动开发服务器**
   ```bash
   npm run test
   ```

5. **加载插件到Edge**
   - 打开 `edge://extensions/`
   - 开启开发者模式
   - 点击"加载解压缩的扩展"
   - 选择项目文件夹

### 项目结构

```
deepseek-monitor/
├── manifest.json          # 插件配置
├── background.js          # 后台脚本
├── content.js            # 内容脚本
├── content.css           # 内容脚本样式
├── popup.html/js/css     # 弹出页面
├── test.html             # 测试页面
├── server.py             # 基础服务器
├── test-server.py        # 测试服务器
├── generate-icons.js     # 图标生成
└── icons/               # 插件图标
```

## 代码审查

### 审查清单

- [ ] 代码符合项目风格
- [ ] 功能正常工作
- [ ] 没有引入新的Bug
- [ ] 文档已更新（如果需要）
- [ ] 测试覆盖充分

### 审查流程

1. **提交PR**
   - 填写完整的PR描述
   - 关联相关Issue

2. **等待审查**
   - 维护者会审查你的代码
   - 可能会有修改建议

3. **根据反馈修改**
   - 及时回复审查意见
   - 进行必要的修改

4. **合并**
   - 审查通过后合并到主分支

## 问题分类

### 标签说明

- `bug`: Bug报告
- `feature`: 功能请求
- `enhancement`: 改进建议
- `documentation`: 文档相关
- `good first issue`: 适合新手
- `help wanted`: 需要帮助

### 优先级

- `critical`: 严重问题，立即修复
- `high`: 高优先级
- `medium`: 中等优先级
- `low`: 低优先级

## 社区行为准则

### 我们承诺

- 欢迎所有人参与
- 尊重每位贡献者
- 建设性的反馈
- 专注技术讨论

### 不可接受的行为

- 侮辱、贬低性语言
- 骚扰、攻击行为
- 与技术无关的政治讨论
- 发布私人信息

## 获取帮助

### 文档

- [README.md](README.md) - 项目说明
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [DEMO.md](DEMO.md) - 使用演示

### 联系方式

- **GitHub Issues**: 项目问题和建议
- **Email**: your-email@example.com

### 相关资源

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Edge Extension Documentation](https://docs.microsoft.com/en-us/microsoft-edge/extensions/)
- [DeepSeek API Documentation](https://platform.deepseek.com/api-docs)

## 致谢

感谢所有为项目做出贡献的人！

### 贡献者列表

<!-- 这里会自动显示贡献者头像 -->

感谢你的贡献！