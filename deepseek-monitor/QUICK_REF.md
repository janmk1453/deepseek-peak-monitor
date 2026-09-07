# DeepSeek Monitor 快速参考

## 一键命令

### 启动服务器
```bash
# 基础服务器
python server.py

# 测试服务器（带模拟API）
python test-server.py

# 快速演示
python demo.py

# 或使用npm
npm start
npm test
npm run demo
```

### 生成图标
```bash
node generate-icons.js
```

### Windows用户
```bash
# 双击运行
install.bat
start-test.bat
```

## 访问地址

- **测试页面**: http://127.0.0.1:3000/test.html
- **模拟API**: http://127.0.0.1:3000/user/balance
- **扩展管理**: edge://extensions/

## 常用操作

### 安装插件
1. 打开 `edge://extensions/`
2. 开启"开发人员模式"
3. 点击"加载解压缩的扩展"
4. 选择 `deepseek-monitor` 文件夹

### 配置插件
1. 点击浏览器工具栏的插件图标
2. 修改设置
3. 点击"保存设置"

### 测试功能
1. 访问 http://127.0.0.1:3000/test.html
2. 观察右上角的监控浮窗
3. 点击刷新按钮测试

## 状态说明

- 🔴 **红色**: 高峰时段 (周一至周五 9:00-12:00, 14:00-18:00)
- 🟡 **黄色**: 高峰开始前10分钟
- 🟢 **绿色**: 空闲时段 (其余时间)

## 价格信息

- **高峰时段**: ¥2.00 / 1M tokens
- **空闲时段**: ¥1.00 / 1M tokens

## 文件说明

### 核心文件
- `manifest.json` - 插件配置
- `background.js` - 后台脚本
- `content.js` - 内容脚本
- `content.css` - 内容样式
- `popup.html/js/css` - 弹出页面

### 测试文件
- `test.html` - 测试页面
- `test-server.py` - 测试服务器
- `demo.py` - 演示脚本

### 文档文件
- `README.md` - 项目说明
- `QUICKSTART.md` - 快速开始
- `DEMO.md` - 使用演示

## 故障排除

### 插件不显示
- 检查是否开启"开发人员模式"
- 检查插件是否启用
- 刷新浏览器

### 无法获取余额
- 检查API Key是否正确
- 确认网络连接
- 查看控制台错误

### 状态不准确
- 检查系统时间
- 确认时区设置为UTC+8

## 获取帮助

- **README.md** - 完整项目说明
- **QUICKSTART.md** - 详细安装步骤
- **DEMO.md** - 使用演示
- **GitHub Issues** - 问题反馈