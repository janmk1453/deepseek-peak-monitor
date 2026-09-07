@echo off
echo ========================================
echo DeepSeek Monitor 安装脚本
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python
    echo.
    echo 请先安装Python:
    echo 1. 访问 https://www.python.org/downloads/
    echo 2. 下载并安装Python 3.6或更高版本
    echo 3. 安装时勾选"Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo Python已安装
python --version
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo 警告: 未找到Node.js
    echo Node.js是可选的，用于生成图标
    echo.
) else (
    echo Node.js已安装
    node --version
    echo.
)

echo ========================================
echo 安装步骤
echo ========================================
echo.
echo 1. 生成图标（可选）
echo 2. 启动测试服务器
echo 3. 在Edge中加载插件
echo.

set /p choice="是否生成图标？(y/n): "
if /i "%choice%"=="y" (
    echo.
    echo 生成图标...
    node generate-icons.js
    echo.
)

echo ========================================
echo 启动测试服务器
echo ========================================
echo.
echo 正在启动服务器...
echo.

REM 启动测试服务器
start "DeepSeek Monitor 测试服务器" python test-server.py

echo 服务器已启动！
echo.
echo 请按照以下步骤操作：
echo.
echo 1. 打开Edge浏览器
echo 2. 在地址栏输入: edge://extensions/
echo 3. 开启右上角的"开发人员模式"
echo 4. 点击"加载解压缩的扩展"
echo 5. 选择此文件夹: %~dp0deepseek-monitor
echo 6. 访问: http://127.0.0.1:3000/test.html
echo.
echo 插件将自动显示在页面右上角
echo.
echo 按任意键关闭此窗口...
pause >nul