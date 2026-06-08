"""
成本计算工具 - 启动脚本
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn
    from backend.config import settings
    
    print(f"=" * 50)
    print(f"成本计算工具 v{settings.APP_VERSION}")
    print(f"=" * 50)
    print(f"数据库: {settings.DB_HOST}:{settings.DB_PORT}")
    print(f"调试模式: {'开启' if settings.DEBUG else '关闭'}")
    print()
    print("正在启动服务器...")
    print(f"访问地址: http://localhost:8000")
    print(f"API文档: http://localhost:8000/docs")
    print(f"=" * 50)
    print()
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        access_log=False
    )
