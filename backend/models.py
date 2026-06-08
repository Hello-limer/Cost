from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Material(Base):
    """原料模型"""
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="原料名称")
    unit = Column(String(20), nullable=False, comment="单位")
    price = Column(Float, nullable=False, comment="单价")
    description = Column(Text, nullable=True, comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
    
    # 关联配方
    recipes = relationship("Recipe", back_populates="material")


class Product(Base):
    """商品模型"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="商品名称")
    labor_cost = Column(Float, default=0.0, comment="人工成本")
    tax_rate = Column(Float, default=0.0, comment="税率")
    description = Column(Text, nullable=True, comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
    
    # 关联配方
    recipes = relationship("Recipe", back_populates="product", cascade="all, delete-orphan")
    # 关联计算历史
    calculation_history = relationship("CalculationHistory", back_populates="product")


class Recipe(Base):
    """配方模型（商品-原料关系）"""
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, comment="商品ID")
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, comment="原料ID")
    quantity = Column(Float, nullable=False, comment="用量")
    
    # 关联
    product = relationship("Product", back_populates="recipes")
    material = relationship("Material", back_populates="recipes")


class CalculationRule(Base):
    """计算规则模型"""
    __tablename__ = "calculation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="规则名称")
    rule_type = Column(String(50), nullable=False, comment="规则类型")
    conditions = Column(JSON, nullable=False, comment="规则条件")
    actions = Column(JSON, nullable=False, comment="规则动作")
    is_active = Column(Integer, default=1, comment="是否启用")
    priority = Column(Integer, default=0, comment="优先级")
    description = Column(Text, nullable=True, comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")


class CalculationHistory(Base):
    """计算历史模型"""
    __tablename__ = "calculation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, comment="商品ID")
    quantity = Column(Integer, default=1, comment="计算数量")
    material_cost = Column(Float, nullable=False, comment="材料成本")
    labor_cost = Column(Float, nullable=False, comment="人工成本")
    tax_cost = Column(Float, nullable=False, comment="税费")
    discount = Column(Float, default=0.0, comment="优惠金额")
    total_cost = Column(Float, nullable=False, comment="总成本")
    unit_cost = Column(Float, nullable=False, comment="单位成本")
    details = Column(JSON, nullable=True, comment="详细信息")
    applied_rules = Column(JSON, nullable=True, comment="应用的规则")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="计算时间")
    
    # 关联
    product = relationship("Product", back_populates="calculation_history")
