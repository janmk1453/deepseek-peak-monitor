#!/usr/bin/env python3
"""
Simple HTTP server for testing DeepSeek Monitor plugin
Usage: python server.py [port]
Default port: 3000
"""

import http.server
import socketserver
import sys
import os

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = http.server.SimpleHTTPRequestHandler
    Handler.extensions_map.update({
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html',
    })
    
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"DeepSeek Monitor 测试服务器已启动")
        print(f"访问地址: http://127.0.0.1:{port}/")
        print(f"按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            httpd.shutdown()

if __name__ == "__main__":
    main()