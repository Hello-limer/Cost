from sqlalchemy.orm import Session
from typing import Dict, Any, List, Tuple
from . import models, schemas, crud


class CostCalculator:
    """成本计算器"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_product_cost(self, product_id: int, quantity: int = 1) -> schemas.CostCalculationResult:
        """计算单个商品成本"""
        # 获取商品信息
        product = crud.get_product(self.db, product_id)
        if not product:
            raise ValueError(f"商品 ID {product_id} 不存在")
        
        # 计算材料成本
        material_cost = 0.0
        material_details = []
        
        for recipe in product.recipes:
            material = recipe.material
            if material:
                cost = material.price * recipe.quantity * quantity
                material_cost += cost
                material_details.append({
                    "material_id": material.id,
                    "material_name": material.name,
                    "unit": material.unit,
                    "price_per_unit": material.price,
                    "quantity_used": recipe.quantity * quantity,
                    "cost": cost
                })
        
        # 计算人工成本
        labor_cost = product.labor_cost * quantity
        
        # 计算税费（基于材料+人工成本）
        tax_cost = (material_cost + labor_cost) * product.tax_rate
        
        # 初始化折扣
        discount = 0.0
        applied_rules = []
        
        # 应用计算规则
        rules = crud.get_rules(self.db, active_only=True)
        for rule in rules:
            rule_applied, rule_discount = self._apply_rule(rule, quantity, material_cost, labor_cost)
            if rule_applied:
                discount += rule_discount
                applied_rules.append({
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "discount": rule_discount
                })
        
        # 计算总成本和单位成本
        total_cost = material_cost + labor_cost + tax_cost - discount
        unit_cost = total_cost / quantity if quantity > 0 else 0
        
        # 保存计算历史
        history_data = {
            "product_id": product_id,
            "quantity": quantity,
            "material_cost": material_cost,
            "labor_cost": labor_cost,
            "tax_cost": tax_cost,
            "discount": discount,
            "total_cost": total_cost,
            "unit_cost": unit_cost,
            "details": {
                "materials": material_details,
                "tax_rate": product.tax_rate
            },
            "applied_rules": applied_rules
        }
        crud.create_calculation_history(self.db, history_data)
        
        return schemas.CostCalculationResult(
            product_id=product_id,
            product_name=product.name,
            quantity=quantity,
            material_cost=material_cost,
            labor_cost=labor_cost,
            tax_cost=tax_cost,
            discount=discount,
            total_cost=total_cost,
            unit_cost=unit_cost,
            details={
                "materials": material_details,
                "tax_rate": product.tax_rate
            },
            applied_rules=applied_rules
        )
    
    def calculate_batch_cost(self, items: List[schemas.BatchProductItem]) -> schemas.BatchCostCalculationResult:
        """批量计算商品成本，每个商品有独立数量"""
        results = []
        total_cost = 0.0
        
        for item in items:
            try:
                result = self.calculate_product_cost(item.product_id, item.quantity)
                results.append(result)
                total_cost += result.total_cost
            except Exception as e:
                # 单个商品计算失败，记录错误但继续其他商品
                pass
        
        return schemas.BatchCostCalculationResult(
            results=results,
            total_products=len(results),
            total_cost=total_cost
        )
    
    def _apply_rule(self, rule: models.CalculationRule, quantity: int, material_cost: float, labor_cost: float) -> Tuple[bool, float]:
        """应用计算规则"""
        conditions = rule.conditions
        actions = rule.actions
        
        # 检查规则条件
        condition_met = False
        
        if rule.rule_type == "quantity_discount":
            # 数量折扣规则：条件格式 {"min_quantity": 45}，动作格式 {"discount_per_unit": 1.0}
            min_quantity = conditions.get("min_quantity", 0)
            if quantity >= min_quantity:
                condition_met = True
        
        elif rule.rule_type == "total_cost_discount":
            # 总成本折扣规则：条件格式 {"min_total_cost": 1000}，动作格式 {"discount_percent": 0.05}
            min_total_cost = conditions.get("min_total_cost", 0)
            if (material_cost + labor_cost) >= min_total_cost:
                condition_met = True
        
        if not condition_met:
            return False, 0.0
        
        # 执行规则动作
        discount = 0.0
        if rule.rule_type == "quantity_discount":
            discount_per_unit = actions.get("discount_per_unit", 0.0)
            discount = discount_per_unit * quantity
        elif rule.rule_type == "total_cost_discount":
            discount_percent = actions.get("discount_percent", 0.0)
            discount = (material_cost + labor_cost) * discount_percent
        
        return True, discount
