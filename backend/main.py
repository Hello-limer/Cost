from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from typing import List
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
from backend.database import get_db, Base
from backend import models, schemas, crud, calculator

# 初始化数据库（只在表不存在时创建）
def init_database():
    """初始化数据库，只在表不存在时创建"""
    from backend.database import engine
    from sqlalchemy import inspect
    
    try:
        # 先连接到MySQL服务器（不指定数据库）
        engine_without_db = create_engine(
            f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}"
        )
        
        # 创建数据库（如果不存在）
        with engine_without_db.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        engine_without_db.dispose()
        
        # 检查是否有表
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables:
            # 创建新表
            Base.metadata.create_all(bind=engine)
            print("✓ 数据库表已创建")
        else:
            print("✓ 数据库表已存在，跳过创建")
        
    except Exception as e:
        print(f"警告: 数据库初始化提示: {e}")

# 初始化数据库
from backend.database import engine

init_database()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== 原料 API ==========
@app.get("/api/materials/", response_model=List[schemas.Material], tags=["原料管理"])
def read_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取原料列表"""
    try:
        materials = crud.get_materials(db, skip=skip, limit=limit)
        return materials
    except Exception as e:
        return []


@app.get("/api/materials/{material_id}", response_model=schemas.Material, tags=["原料管理"])
def read_material(material_id: int, db: Session = Depends(get_db)):
    """获取单个原料"""
    db_material = crud.get_material(db, material_id=material_id)
    if db_material is None:
        raise HTTPException(status_code=404, detail="原料不存在")
    return db_material


@app.post("/api/materials/", response_model=schemas.Material, status_code=status.HTTP_201_CREATED, tags=["原料管理"])
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    """创建原料"""
    return crud.create_material(db=db, material=material)


@app.put("/api/materials/{material_id}", response_model=schemas.Material, tags=["原料管理"])
def update_material(material_id: int, material: schemas.MaterialUpdate, db: Session = Depends(get_db)):
    """更新原料"""
    db_material = crud.update_material(db, material_id=material_id, material=material)
    if db_material is None:
        raise HTTPException(status_code=404, detail="原料不存在")
    return db_material


@app.delete("/api/materials/{material_id}", response_model=schemas.MessageResponse, tags=["原料管理"])
def delete_material(material_id: int, db: Session = Depends(get_db)):
    """删除原料"""
    success = crud.delete_material(db, material_id=material_id)
    if not success:
        raise HTTPException(status_code=404, detail="原料不存在")
    return {"message": "原料删除成功"}

# ========== 商品 API ==========
@app.get("/api/products/", response_model=List[schemas.Product], tags=["商品管理"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取商品列表"""
    try:
        products = crud.get_products(db, skip=skip, limit=limit)
        return products
    except Exception as e:
        return []


@app.get("/api/products/{product_id}", response_model=schemas.Product, tags=["商品管理"])
def read_product(product_id: int, db: Session = Depends(get_db)):
    """获取单个商品"""
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="商品不存在")
    return db_product


@app.post("/api/products/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED, tags=["商品管理"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """创建商品"""
    return crud.create_product(db=db, product=product)


@app.put("/api/products/{product_id}", response_model=schemas.Product, tags=["商品管理"])
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    """更新商品"""
    db_product = crud.update_product(db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="商品不存在")
    return db_product


@app.delete("/api/products/{product_id}", response_model=schemas.MessageResponse, tags=["商品管理"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """删除商品"""
    success = crud.delete_product(db, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="商品不存在")
    return {"message": "商品删除成功"}

# ========== 配方 API ==========
@app.post("/api/products/{product_id}/recipes/", response_model=schemas.Recipe, tags=["配方管理"])
def add_recipe_to_product(product_id: int, recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    """为商品添加配方"""
    db_recipe = crud.add_recipe(db, product_id=product_id, recipe=recipe)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="商品不存在")
    return db_recipe


@app.put("/api/recipes/{recipe_id}", response_model=schemas.Recipe, tags=["配方管理"])
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    """更新配方"""
    db_recipe = crud.update_recipe(db, recipe_id=recipe_id, recipe=recipe)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="配方不存在")
    return db_recipe


@app.delete("/api/recipes/{recipe_id}", response_model=schemas.MessageResponse, tags=["配方管理"])
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """删除配方"""
    success = crud.delete_recipe(db, recipe_id=recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="配方不存在")
    return {"message": "配方删除成功"}

# ========== 计算规则 API ==========
@app.get("/api/rules/", response_model=List[schemas.CalculationRule], tags=["计算规则"])
def read_rules(skip: int = 0, limit: int = 100, active_only: bool = True, db: Session = Depends(get_db)):
    """获取计算规则列表"""
    try:
        rules = crud.get_rules(db, skip=skip, limit=limit, active_only=active_only)
        return rules
    except Exception as e:
        return []


@app.get("/api/rules/{rule_id}", response_model=schemas.CalculationRule, tags=["计算规则"])
def read_rule(rule_id: int, db: Session = Depends(get_db)):
    """获取单个计算规则"""
    db_rule = crud.get_rule(db, rule_id=rule_id)
    if db_rule is None:
        raise HTTPException(status_code=404, detail="计算规则不存在")
    return db_rule


@app.post("/api/rules/", response_model=schemas.CalculationRule, status_code=status.HTTP_201_CREATED, tags=["计算规则"])
def create_rule(rule: schemas.CalculationRuleCreate, db: Session = Depends(get_db)):
    """创建计算规则"""
    return crud.create_rule(db=db, rule=rule)


@app.put("/api/rules/{rule_id}", response_model=schemas.CalculationRule, tags=["计算规则"])
def update_rule(rule_id: int, rule: schemas.CalculationRuleUpdate, db: Session = Depends(get_db)):
    """更新计算规则"""
    db_rule = crud.update_rule(db, rule_id=rule_id, rule=rule)
    if db_rule is None:
        raise HTTPException(status_code=404, detail="计算规则不存在")
    return db_rule


@app.delete("/api/rules/{rule_id}", response_model=schemas.MessageResponse, tags=["计算规则"])
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """删除计算规则"""
    success = crud.delete_rule(db, rule_id=rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="计算规则不存在")
    return {"message": "计算规则删除成功"}

# ========== 成本计算 API ==========
@app.post("/api/calculate/", response_model=schemas.CostCalculationResult, tags=["成本计算"])
def calculate_cost(request: schemas.CostCalculationRequest, db: Session = Depends(get_db)):
    """计算单个商品成本"""
    calc = calculator.CostCalculator(db)
    try:
        return calc.calculate_product_cost(request.product_id, request.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/calculate/batch/", response_model=schemas.BatchCostCalculationResult, tags=["成本计算"])
def calculate_batch_cost(request: schemas.BatchCostCalculationRequest, db: Session = Depends(get_db)):
    """批量计算商品成本，每个商品有独立数量"""
    calc = calculator.CostCalculator(db)
    return calc.calculate_batch_cost(request.items)

# ========== 计算历史 API ==========
@app.get("/api/history/", response_model=List[schemas.CalculationHistoryResponse], tags=["计算历史"])
def read_calculation_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取计算历史"""
    histories = crud.get_calculation_history(db, skip=skip, limit=limit)
    
    # 转换为响应格式，添加商品名称
    response_list = []
    for history in histories:
        product_name = history.product.name if history.product else None
        response_list.append(schemas.CalculationHistoryResponse(
            id=history.id,
            product_id=history.product_id,
            product_name=product_name,
            quantity=history.quantity,
            material_cost=history.material_cost,
            labor_cost=history.labor_cost,
            tax_cost=history.tax_cost,
            discount=history.discount,
            total_cost=history.total_cost,
            unit_cost=history.unit_cost,
            details=history.details,
            applied_rules=history.applied_rules,
            created_at=history.created_at
        ))
    return response_list


@app.get("/api/history/{history_id}", response_model=schemas.CalculationHistoryResponse, tags=["计算历史"])
def read_calculation_history_item(history_id: int, db: Session = Depends(get_db)):
    """获取单个计算历史"""
    history = crud.get_calculation_history_by_id(db, history_id=history_id)
    if history is None:
        raise HTTPException(status_code=404, detail="计算历史不存在")
    
    product_name = history.product.name if history.product else None
    return schemas.CalculationHistoryResponse(
        id=history.id,
        product_id=history.product_id,
        product_name=product_name,
        quantity=history.quantity,
        material_cost=history.material_cost,
        labor_cost=history.labor_cost,
        tax_cost=history.tax_cost,
        discount=history.discount,
        total_cost=history.total_cost,
        unit_cost=history.unit_cost,
        details=history.details,
        applied_rules=history.applied_rules,
        created_at=history.created_at
    )

# ========== 初始化默认规则 API ==========
@app.post("/api/init-default-rules/", response_model=schemas.MessageResponse, tags=["系统"])
def init_default_rules(db: Session = Depends(get_db)):
    """初始化默认计算规则"""
    # 检查是否已有规则
    existing_rules = crud.get_rules(db, active_only=False)
    if existing_rules:
        return {"message": "规则已存在，跳过初始化"}
    
    # 创建默认规则：满45单减1元
    default_rule = schemas.CalculationRuleCreate(
        name="批量优惠 - 满45单减1元",
        rule_type="quantity_discount",
        conditions={"min_quantity": 45},
        actions={"discount_per_unit": 1.0},
        is_active=1,
        priority=1,
        description="当计算数量达到或超过45时，每单位商品优惠1元"
    )
    crud.create_rule(db, default_rule)
    
    return {"message": "默认规则初始化成功"}

# ========== 挂载静态文件（放在所有 API 之后） ==========
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_path):
    # 挂载静态文件目录
    app.mount("/css", StaticFiles(directory=os.path.join(frontend_path, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")
    app.mount("/images", StaticFiles(directory=os.path.join(frontend_path, "images")), name="images")
    
    # 根路径返回 index.html
    @app.get("/")
    async def read_root():
        """首页"""
        return FileResponse(os.path.join(frontend_path, "index.html"))
    
    # 其他路径也返回 index.html（SPA 路由支持）
    @app.get("/{path:path}")
    async def read_any(path: str):
        """所有其他路径返回首页"""
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "成本计算工具 API", "version": settings.APP_VERSION}
        
    print(f"✓ 前端文件已挂载: {frontend_path}")
else:
    print(f"警告: 前端目录不存在: {frontend_path}")
