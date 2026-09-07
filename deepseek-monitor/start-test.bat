@echo off
echo ========================================
echo DeepSeek Monitor 测试服务器
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python
    echo 请先安装Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 启动测试服务器...
echo.
python test-server.py %1

pause