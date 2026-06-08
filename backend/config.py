from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """应用配置管理"""
    # 数据库配置
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "122588"
    DB_NAME: str = "cost_calculator"
    
    # 应用配置
    APP_NAME: str = "成本计算工具"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS配置
    CORS_ORIGINS: List[str] = ["http://localhost:8000", "http://127.0.0.1:8000"]
    
    @property
    def DATABASE_URL(self) -> str:
        """生成数据库连接URL"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
