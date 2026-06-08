from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ========== 原料相关 Schema ==========
class MaterialBase(BaseModel):
    name: str = Field(..., description="原料名称")
    unit: str = Field(..., description="单位")
    price: float = Field(..., description="单价")
    description: Optional[str] = Field(None, description="描述")


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(MaterialBase):
    name: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None


class Material(MaterialBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ========== 配方相关 Schema ==========
class RecipeBase(BaseModel):
    material_id: int = Field(..., description="原料ID")
    quantity: float = Field(..., description="用量")


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(RecipeBase):
    material_id: Optional[int] = None
    quantity: Optional[float] = None


class Recipe(RecipeBase):
    id: int
    product_id: int
    material: Optional[Material] = None
    
    class Config:
        from_attributes = True


# ========== 商品相关 Schema ==========
class ProductBase(BaseModel):
    name: str = Field(..., description="商品名称")
    labor_cost: float = Field(0.0, description="人工成本")
    tax_rate: float = Field(0.0, description="税率")
    description: Optional[str] = Field(None, description="描述")


class ProductCreate(ProductBase):
    recipes: Optional[List[RecipeCreate]] = Field(None, description="配方列表")


class ProductUpdate(ProductBase):
    name: Optional[str] = None
    labor_cost: Optional[float] = None
    tax_rate: Optional[float] = None


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    recipes: List[Recipe] = []
    
    class Config:
        from_attributes = True


# ========== 计算规则相关 Schema ==========
class CalculationRuleBase(BaseModel):
    name: str = Field(..., description="规则名称")
    rule_type: str = Field(..., description="规则类型")
    conditions: Dict[str, Any] = Field(..., description="规则条件")
    actions: Dict[str, Any] = Field(..., description="规则动作")
    is_active: int = Field(1, description="是否启用")
    priority: int = Field(0, description="优先级")
    description: Optional[str] = Field(None, description="描述")


class CalculationRuleCreate(CalculationRuleBase):
    pass


class CalculationRuleUpdate(CalculationRuleBase):
    name: Optional[str] = None
    rule_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[Dict[str, Any]] = None
    is_active: Optional[int] = None
    priority: Optional[int] = None


class CalculationRule(CalculationRuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ========== 成本计算相关 Schema ==========
class CostCalculationRequest(BaseModel):
    product_id: int = Field(..., description="商品ID")
    quantity: int = Field(1, description="计算数量")


class CostCalculationResult(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    material_cost: float
    labor_cost: float
    tax_cost: float
    discount: float
    total_cost: float
    unit_cost: float
    details: Dict[str, Any]
    applied_rules: List[Dict[str, Any]]


class BatchProductItem(BaseModel):
    product_id: int = Field(..., description="商品ID")
    quantity: int = Field(1, description="该商品的数量")


class BatchCostCalculationRequest(BaseModel):
    items: List[BatchProductItem] = Field(..., description="商品列表，每个商品包含ID和数量")


class BatchCostCalculationResult(BaseModel):
    results: List[CostCalculationResult]
    total_products: int
    total_cost: float


# ========== 计算历史相关 Schema ==========
class CalculationHistory(BaseModel):
    id: int
    product_id: int
    quantity: int
    material_cost: float
    labor_cost: float
    tax_cost: float
    discount: float
    total_cost: float
    unit_cost: float
    details: Optional[Dict[str, Any]] = None
    applied_rules: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CalculationHistoryResponse(BaseModel):
    """包含商品名称的历史记录响应"""
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    material_cost: float
    labor_cost: float
    tax_cost: float
    discount: float
    total_cost: float
    unit_cost: float
    details: Optional[Dict[str, Any]] = None
    applied_rules: Optional[List[Dict[str, Any]]] = None
    created_at: datetime


# ========== 通用响应 Schema ==========
class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
