"""
数据库初始化脚本
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import engine, Base
from backend.config import settings

def init_database():
    """初始化数据库"""
    print("=" * 50)
    print("成本计算工具 - 数据库初始化")
    print("=" * 50)
    print()
    
    try:
        print(f"连接数据库: {settings.DB_HOST}:{settings.DB_PORT}")
        
        # 创建所有表
        print("正在创建数据库表...")
        Base.metadata.create_all(bind=engine)
        
        print()
        print("✓ 数据库初始化完成！")
        print()
        print("表列表:")
        print("- materials (原料)")
        print("- products (商品)")
        print("- recipes (配方)")
        print("- calculation_rules (计算规则)")
        print("- calculation_history (计算历史)")
        print()
        print("=" * 50)
        
    except Exception as e:
        print()
        print(f"✗ 初始化失败: {e}")
        print()
        print("请确保:")
        print("1. MySQL 服务已启动")
        print("2. 数据库配置正确 (.env 文件)")
        print("3. 用户有创建数据库的权限")
        print()
        sys.exit(1)

if __name__ == "__main__":
    init_database()
