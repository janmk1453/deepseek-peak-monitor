#!/usr/bin/env python3
"""
DeepSeek Monitor 测试服务器
模拟DeepSeek API和测试页面
"""

import http.server
import socketserver
import json
import sys
import os
from datetime import datetime

PORT = 3000

class MockDeepSeekHandler(http.server.SimpleHTTPRequestHandler):
    """模拟DeepSeek API的处理器"""
    
    def do_GET(self):
        # 模拟DeepSeek余额API
        if self.path == '/user/balance':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # 返回模拟余额数据（官方格式）
            balance_data = {
                "is_available": True,
                "balance_infos": [
                    {
                        "currency": "CNY",
                        "total_balance": "42.56",
                        "granted_balance": "10.00",
                        "topped_up_balance": "32.56"
                    }
                ]
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

def main():
    global PORT
    
    # 解析命令行参数
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print(f"无效的端口号: {sys.argv[1]}")
            sys.exit(1)
    
    # 切换到脚本目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 启动服务器
    with socketserver.TCPServer(("127.0.0.1", PORT), MockDeepSeekHandler) as httpd:
        print("=" * 60)
        print("DeepSeek Monitor 测试服务器")
        print("=" * 60)
        print(f"服务器地址: http://127.0.0.1:{PORT}/")
        print(f"测试页面:   http://127.0.0.1:{PORT}/test.html")
        print(f"模拟API:    http://127.0.0.1:{PORT}/user/balance")
        print("=" * 60)
        print("按 Ctrl+C 停止服务器")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            httpd.shutdown()

if __name__ == "__main__":
    main()