from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, text
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
from backend.database import Base, engine
from backend.routers import materials, products, recipes, rules, calculator, history, system


def init_database():
    from sqlalchemy import inspect
    try:
        engine_without_db = create_engine(
            f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}"
        )
        with engine_without_db.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        engine_without_db.dispose()
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        if not existing_tables:
            Base.metadata.create_all(bind=engine)
            print("✓ 数据库表已创建")
        else:
            print("✓ 数据库表已存在，跳过创建")
    except Exception as e:
        print(f"警告: 数据库初始化提示: {e}")


init_database()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materials.router)
app.include_router(products.router)
app.include_router(recipes.router)
app.include_router(rules.router)
app.include_router(calculator.router)
app.include_router(history.router)
app.include_router(system.router)

frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_path):
    app.mount("/css", StaticFiles(directory=os.path.join(frontend_path, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")
    app.mount("/images", StaticFiles(directory=os.path.join(frontend_path, "images")), name="images")
    
    @app.get("/")
    async def read_root():
        return FileResponse(os.path.join(frontend_path, "index.html"))
    
    @app.get("/{path:path}")
    async def read_any(path: str):
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "成本计算工具 API", "version": settings.APP_VERSION}
        
    print(f"✓ 前端文件已挂载: {frontend_path}")
else:
    print(f"警告: 前端目录不存在: {frontend_path}")
