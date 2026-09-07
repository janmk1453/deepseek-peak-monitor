#!/usr/bin/env python3
"""
DeepSeek Monitor 快速演示脚本
自动启动服务器并打开浏览器
"""

import http.server
import socketserver
import json
import sys
import os
import webbrowser
import threading
import time
from datetime import datetime

PORT = 3000

class DemoHandler(http.server.SimpleHTTPRequestHandler):
    """演示用的HTTP处理器"""
    
    def do_GET(self):
        # 模拟DeepSeek余额API
        if self.path == '/user/balance':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # 返回模拟余额数据
            balance_data = {
                "balance": 42.56,
                "is_granted": True,
                "total_balance": 100.00
            }
            self.wfile.write(json.dumps(balance_data).encode())
            return
        
        # 默认处理静态文件
        super().do_GET()
    
    def do_OPTIONS(self):
        """处理CORS预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {args[0]}")

def open_browser():
    """延迟打开浏览器"""
    time.sleep(1)
    url = f"http://127.0.0.1:{PORT}/test.html"
    print(f"正在打开浏览器: {url}")
    webbrowser.open(url)

def main():
    global PORT
    
    # 切换到脚本目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("=" * 60)
    print("DeepSeek Monitor 快速演示")
    print("=" * 60)
    print("这个脚本将：")
    print("1. 启动测试服务器")
    print("2. 自动打开浏览器")
    print("3. 显示插件效果")
    print("=" * 60)
    print()
    
    # 启动服务器
    with socketserver.TCPServer(("127.0.0.1", PORT), DemoHandler) as httpd:
        print(f"服务器已启动: http://127.0.0.1:{PORT}/")
        print()
        print("请按照以下步骤操作：")
        print("1. 打开Edge浏览器")
        print("2. 进入 edge://extensions/")
        print("3. 开启'开发人员模式'")
        print("4. 点击'加载解压缩的扩展'")
        print("5. 选择 'deepseek-monitor' 文件夹")
        print("6. 刷新浏览器页面")
        print()
        print("插件将自动显示在页面右上角")
        print()
        print("按 Ctrl+C 停止服务器")
        print("=" * 60)
        
        # 在新线程中打开浏览器
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n演示结束")
            httpd.shutdown()

if __name__ == "__main__":
    main()