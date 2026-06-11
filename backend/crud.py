from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from . import models, schemas


# ========== 原料 CRUD ==========
def get_material(db: Session, material_id: int) -> Optional[models.Material]:
    return db.query(models.Material).filter(models.Material.id == material_id).first()


def get_materials(db: Session, skip: int = 0, limit: int = 100) -> List[models.Material]:
    return db.query(models.Material).offset(skip).limit(limit).all()


def create_material(db: Session, material: schemas.MaterialCreate) -> models.Material:
    db_material = models.Material(**material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


def update_material(db: Session, material_id: int, material: schemas.MaterialUpdate) -> Optional[models.Material]:
    db_material = get_material(db, material_id)
    if not db_material:
        return None
    
    update_data = material.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_material, field, value)
    
    db.commit()
    db.refresh(db_material)
    return db_material


def delete_material(db: Session, material_id: int) -> bool:
    db_material = get_material(db, material_id)
    if not db_material:
        return False
    
    db.delete(db_material)
    db.commit()
    return True


# ========== 商品 CRUD ==========
def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
    return db.query(models.Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    # 创建商品
    product_data = product.model_dump(exclude={'recipes'})
    db_product = models.Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # 创建配方
    if product.recipes:
        for recipe_data in product.recipes:
            db_recipe = models.Recipe(
                product_id=db_product.id,
                material_id=recipe_data.material_id,
                quantity=recipe_data.quantity
            )
            db.add(db_recipe)
        db.commit()
        db.refresh(db_product)
    
    return db_product


def update_product(db: Session, product_id: int, product: schemas.ProductUpdate) -> Optional[models.Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    
    db.delete(db_product)
    db.commit()
    return True


# ========== 配方 CRUD ==========
def add_recipe(db: Session, product_id: int, recipe: schemas.RecipeCreate) -> Optional[models.Recipe]:
    # 检查商品是否存在
    product = get_product(db, product_id)
    if not product:
        return None
    
    db_recipe = models.Recipe(product_id=product_id, **recipe.model_dump())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def update_recipe(db: Session, recipe_id: int, recipe: schemas.RecipeUpdate) -> Optional[models.Recipe]:
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return None
    
    update_data = recipe.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_recipe, field, value)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def delete_recipe(db: Session, recipe_id: int) -> bool:
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return False
    
    db.delete(db_recipe)
    db.commit()
    return True


# ========== 计算规则 CRUD ==========
def get_rule(db: Session, rule_id: int) -> Optional[models.CalculationRule]:
    return db.query(models.CalculationRule).filter(models.CalculationRule.id == rule_id).first()


def get_rules(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[models.CalculationRule]:
    query = db.query(models.CalculationRule)
    if active_only:
        query = query.filter(models.CalculationRule.is_active == 1)
    return query.order_by(desc(models.CalculationRule.priority)).offset(skip).limit(limit).all()


def create_rule(db: Session, rule: schemas.CalculationRuleCreate) -> models.CalculationRule:
    db_rule = models.CalculationRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def update_rule(db: Session, rule_id: int, rule: schemas.CalculationRuleUpdate) -> Optional[models.CalculationRule]:
    db_rule = get_rule(db, rule_id)
    if not db_rule:
        return None
    
    update_data = rule.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule


def delete_rule(db: Session, rule_id: int) -> bool:
    db_rule = get_rule(db, rule_id)
    if not db_rule:
        return False
    
    db.delete(db_rule)
    db.commit()
    return True


# ========== 计算历史 CRUD ==========
def create_calculation_history(db: Session, history_data: Dict[str, Any]) -> models.CalculationHistory:
    db_history = models.CalculationHistory(**history_data)
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


def get_calculation_history(db: Session, skip: int = 0, limit: int = 100) -> List[models.CalculationHistory]:
    return db.query(models.CalculationHistory).order_by(desc(models.CalculationHistory.created_at)).offset(skip).limit(limit).all()


def get_calculation_history_count(db: Session) -> int:
    return db.query(models.CalculationHistory).count()


def get_calculation_history_by_id(db: Session, history_id: int) -> Optional[models.CalculationHistory]:
    return db.query(models.CalculationHistory).filter(models.CalculationHistory.id == history_id).first()


def delete_all_calculation_history(db: Session) -> int:
    count = db.query(models.CalculationHistory).count()
    db.query(models.CalculationHistory).delete()
    db.commit()
    return count
