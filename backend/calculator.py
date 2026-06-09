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
        
        # 应用计算规则（使用商品的人工成本作为单位成本参考）
        temp_unit_cost = product.labor_cost
        
        rules = crud.get_rules(self.db, active_only=True)
        for rule in rules:
            rule_applied, rule_discount = self._apply_rule(rule, quantity, material_cost, labor_cost, temp_unit_cost)
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
        """批量计算商品成本，每个商品有独立数量，规则基于总数量判断"""
        results = []
        total_cost = 0.0
        
        # 第一步：计算所有商品的总数量
        total_quantity = sum(item.quantity for item in items)
        
        # 第二步：预获取所有商品信息和计算材料/人工成本
        product_costs = []
        for item in items:
            product = crud.get_product(self.db, item.product_id)
            if not product:
                continue
            
            # 计算材料成本
            material_cost = 0.0
            for recipe in product.recipes:
                material = recipe.material
                if material:
                    cost = material.price * recipe.quantity * item.quantity
                    material_cost += cost
            
            # 计算人工成本
            labor_cost = product.labor_cost * item.quantity
            
            # 计算临时单位成本（用于规则判断）：直接使用商品的人工成本作为参考
            # 这样更简单直接，符合用户预期
            temp_unit_cost = product.labor_cost
            
            product_costs.append({
                'product': product,
                'quantity': item.quantity,
                'material_cost': material_cost,
                'labor_cost': labor_cost,
                'tax_cost': (material_cost + labor_cost) * product.tax_rate,
                'temp_unit_cost': temp_unit_cost
            })
        
        # 第三步：获取所有规则，并用总数量预先判断哪些规则可能生效
        rules = crud.get_rules(self.db, active_only=True)
        
        # 第四步：对每个商品单独计算，但使用总数量判断规则
        for pc in product_costs:
            try:
                result = self._calculate_product_with_total_quantity(
                    pc['product'],
                    pc['quantity'],
                    pc['material_cost'],
                    pc['labor_cost'],
                    pc['tax_cost'],
                    pc['temp_unit_cost'],
                    total_quantity,
                    rules
                )
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
    
    def _calculate_product_with_total_quantity(self, product, quantity, material_cost, labor_cost, tax_cost, temp_unit_cost, total_quantity, rules):
        """使用总数量来计算单个商品的成本"""
        # 初始化折扣
        discount = 0.0
        applied_rules = []
        
        # 应用计算规则，使用总数量而非单个商品数量
        for rule in rules:
            rule_applied, rule_discount = self._apply_rule_with_total_quantity(
                rule,
                quantity,
                total_quantity,
                material_cost,
                labor_cost,
                temp_unit_cost
            )
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
        
        # 获取材料详情
        material_details = []
        for recipe in product.recipes:
            material = recipe.material
            if material:
                cost = material.price * recipe.quantity * quantity
                material_details.append({
                    "material_id": material.id,
                    "material_name": material.name,
                    "unit": material.unit,
                    "price_per_unit": material.price,
                    "quantity_used": recipe.quantity * quantity,
                    "cost": cost
                })
        
        # 保存计算历史
        history_data = {
            "product_id": product.id,
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
            product_id=product.id,
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
    
    def _apply_rule_with_total_quantity(self, rule: models.CalculationRule, product_quantity: int, total_quantity: int, material_cost: float, labor_cost: float, unit_cost: float = 0.0) -> Tuple[bool, float]:
        """应用计算规则，使用总数量判断，产品数量用于计算优惠金额"""
        conditions = rule.conditions
        actions = rule.actions
        
        # 检查规则条件
        condition_met = False
        discount_quantity = 0
        
        # 调试信息
        print(f"DEBUG: Applying rule '{rule.name}', product_quantity={product_quantity}, total_quantity={total_quantity}, unit_cost={unit_cost}")
        
        if rule.rule_type == "quantity_discount":
            # 数量折扣规则，使用总数量判断
            min_quantity = conditions.get("min_quantity", 0)
            discount_mode = conditions.get("discount_mode", "all")  # "all": 全部优惠, "excess": 仅超过部分优惠
            unit_cost_condition = conditions.get("unit_cost_condition", None)  # 单位成本条件类型: "none", "max", "min"
            unit_cost_value = conditions.get("unit_cost_value", None)  # 单位成本值
            
            # 检查单位成本条件
            print(f"DEBUG: unit_cost_condition={unit_cost_condition}, unit_cost_value={unit_cost_value}")
            if unit_cost_condition == "max" and unit_cost_value is not None:
                if unit_cost > unit_cost_value:
                    print(f"DEBUG: unit cost {unit_cost} > {unit_cost_value}, skip")
                    return False, 0.0
            elif unit_cost_condition == "min" and unit_cost_value is not None:
                if unit_cost < unit_cost_value:
                    print(f"DEBUG: unit cost {unit_cost} < {unit_cost_value}, skip")
                    return False, 0.0
            elif unit_cost_condition == "equal" and unit_cost_value is not None:
                if abs(unit_cost - unit_cost_value) > 0.001:
                    print(f"DEBUG: unit cost {unit_cost} != {unit_cost_value}, skip")
                    return False, 0.0
            print(f"DEBUG: Unit cost condition passed")
            
            # 使用总数量判断规则是否生效
            print(f"DEBUG: min_quantity={min_quantity}, total_quantity={total_quantity}, check={total_quantity >= min_quantity}")
            if total_quantity >= min_quantity:
                condition_met = True
                # 批量计算时，只要总数量达到阈值，所有符合条件的商品都全额享受优惠
                discount_quantity = product_quantity
                print(f"DEBUG: Rule condition met!")
        
        elif rule.rule_type == "total_cost_discount":
            # 总成本折扣规则（这个暂时保持原有逻辑）
            min_total_cost = conditions.get("min_total_cost", 0)
            if (material_cost + labor_cost) >= min_total_cost:
                condition_met = True
        
        if not condition_met:
            return False, 0.0
        
        # 执行规则动作
        discount = 0.0
        if rule.rule_type == "quantity_discount":
            discount_per_unit = actions.get("discount_per_unit", 0.0)
            discount = discount_per_unit * discount_quantity
        elif rule.rule_type == "total_cost_discount":
            discount_percent = actions.get("discount_percent", 0.0)
            discount = (material_cost + labor_cost) * discount_percent
        
        return True, discount
    
    def _apply_rule(self, rule: models.CalculationRule, quantity: int, material_cost: float, labor_cost: float, unit_cost: float = 0.0) -> Tuple[bool, float]:
        """应用计算规则"""
        conditions = rule.conditions
        actions = rule.actions
        
        # 检查规则条件
        condition_met = False
        discount_quantity = 0
        
        if rule.rule_type == "quantity_discount":
            # 数量折扣规则
            min_quantity = conditions.get("min_quantity", 0)
            discount_mode = conditions.get("discount_mode", "all")  # "all": 全部优惠, "excess": 仅超过部分优惠
            unit_cost_condition = conditions.get("unit_cost_condition", None)  # 单位成本条件类型: "none", "max", "min"
            unit_cost_value = conditions.get("unit_cost_value", None)  # 单位成本值
            
            # 检查单位成本条件
            if unit_cost_condition == "max" and unit_cost_value is not None:
                if unit_cost > unit_cost_value:
                    # 单位成本超过限制，不应用优惠
                    return False, 0.0
            elif unit_cost_condition == "min" and unit_cost_value is not None:
                if unit_cost < unit_cost_value:
                    # 单位成本低于限制，不应用优惠
                    return False, 0.0
            elif unit_cost_condition == "equal" and unit_cost_value is not None:
                # 由于浮点数比较，使用近似相等
                if abs(unit_cost - unit_cost_value) > 0.001:
                    # 单位成本不等于该价格，不应用优惠
                    return False, 0.0
            
            if quantity >= min_quantity:
                condition_met = True
                if discount_mode == "excess":
                    # 仅超过最低数量的部分享受优惠
                    discount_quantity = quantity - min_quantity
                else:
                    # 全部数量享受优惠
                    discount_quantity = quantity
        
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
            discount = discount_per_unit * discount_quantity
        elif rule.rule_type == "total_cost_discount":
            discount_percent = actions.get("discount_percent", 0.0)
            discount = (material_cost + labor_cost) * discount_percent
        
        return True, discount
