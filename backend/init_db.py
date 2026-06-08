from sqlalchemy import create_engine, text
from .config import settings
from .models import Base
import pymysql


def create_database_if_not_exists():
    """创建数据库（如果不存在）"""
    # 先连接到MySQL服务器（不指定数据库）
    connection_url = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}"
    engine = create_engine(connection_url)
    
    try:
        with engine.connect() as conn:
            # 创建数据库
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            print(f"数据库 {settings.DB_NAME} 创建成功或已存在")
    except Exception as e:
        print(f"创建数据库时出错: {e}")
        raise
    finally:
        engine.dispose()


def init_db():
    """初始化数据库表"""
    # 先创建数据库
    create_database_if_not_exists()
    
    # 再创建表
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("数据库表创建成功！")


if __name__ == "__main__":
    init_db()
