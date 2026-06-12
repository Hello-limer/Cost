// 成本计算模块 - 移植自 backend/calculator.py
// 在本地模式下使用 storage.js 读取商品/原料/规则数据

import * as storage from './storage.js';

function applyRule(rule, quantity, materialCost, laborCost, unitCost = 0) {
    const conditions = rule.conditions || {};
    const actions = rule.actions || {};
    let conditionMet = false;
    let discountQty = 0;

    if (rule.rule_type === 'quantity_discount') {
        const minQty = conditions.min_quantity || 0;
        const discountMode = conditions.discount_mode || 'all';
        const unitCostCondition = conditions.unit_cost_condition;
        const unitCostValue = conditions.unit_cost_value;

        if (unitCostCondition === 'max' && unitCostValue != null) {
            if (unitCost > unitCostValue) return { applied: false, discount: 0 };
        } else if (unitCostCondition === 'min' && unitCostValue != null) {
            if (unitCost < unitCostValue) return { applied: false, discount: 0 };
        } else if (unitCostCondition === 'equal' && unitCostValue != null) {
            if (Math.abs(unitCost - unitCostValue) > 0.001) return { applied: false, discount: 0 };
        }

        if (quantity >= minQty) {
            conditionMet = true;
            if (discountMode === 'excess') {
                discountQty = quantity - minQty;
            } else {
                discountQty = quantity;
            }
        }
    } else if (rule.rule_type === 'total_cost_discount') {
        const minTotalCost = conditions.min_total_cost || 0;
        if ((materialCost + laborCost) >= minTotalCost) {
            conditionMet = true;
        }
    }

    if (!conditionMet) return { applied: false, discount: 0 };

    let discount = 0;
    if (rule.rule_type === 'quantity_discount') {
        const perUnit = actions.discount_per_unit || 0;
        discount = perUnit * discountQty;
    } else if (rule.rule_type === 'total_cost_discount') {
        const percent = actions.discount_percent || 0;
        discount = (materialCost + laborCost) * percent;
    }

    return { applied: true, discount };
}

function applyRuleWithTotalQuantity(rule, productQuantity, totalQuantity, materialCost, laborCost, unitCost = 0) {
    const conditions = rule.conditions || {};
    const actions = rule.actions || {};
    let conditionMet = false;
    let discountQty = 0;

    if (rule.rule_type === 'quantity_discount') {
        const minQty = conditions.min_quantity || 0;
        const discountMode = conditions.discount_mode || 'all';
        const unitCostCondition = conditions.unit_cost_condition;
        const unitCostValue = conditions.unit_cost_value;

        if (unitCostCondition === 'max' && unitCostValue != null) {
            if (unitCost > unitCostValue) return { applied: false, discount: 0 };
        } else if (unitCostCondition === 'min' && unitCostValue != null) {
            if (unitCost < unitCostValue) return { applied: false, discount: 0 };
        } else if (unitCostCondition === 'equal' && unitCostValue != null) {
            if (Math.abs(unitCost - unitCostValue) > 0.001) return { applied: false, discount: 0 };
        }

        if (totalQuantity >= minQty) {
            conditionMet = true;
            discountQty = productQuantity;
        }
    } else if (rule.rule_type === 'total_cost_discount') {
        const minTotalCost = conditions.min_total_cost || 0;
        if ((materialCost + laborCost) >= minTotalCost) {
            conditionMet = true;
        }
    }

    if (!conditionMet) return { applied: false, discount: 0 };

    let discount = 0;
    if (rule.rule_type === 'quantity_discount') {
        const perUnit = actions.discount_per_unit || 0;
        discount = perUnit * discountQty;
    } else if (rule.rule_type === 'total_cost_discount') {
        const percent = actions.discount_percent || 0;
        discount = (materialCost + laborCost) * percent;
    }

    return { applied: true, discount };
}

export function calculateProductCost(productId, quantity) {
    const product = storage.getProduct(productId);
    if (!product) throw new Error(`商品 ID ${productId} 不存在`);

    let materialCost = 0;
    const materialDetails = [];

    for (const recipe of (product.recipes || [])) {
        const material = recipe.material;
        if (material) {
            const cost = material.price * recipe.quantity * quantity;
            materialCost += cost;
            materialDetails.push({
                material_id: material.id,
                material_name: material.name,
                unit: material.unit,
                price_per_unit: material.price,
                quantity_used: recipe.quantity * quantity,
                cost,
            });
        }
    }

    const laborCost = product.labor_cost * quantity;
    const taxCost = (materialCost + laborCost) * product.tax_rate;
    let discount = 0;
    const appliedRules = [];
    const tempUnitCost = product.labor_cost;

    const rules = storage.getRulesAll(true);
    for (const rule of rules) {
        const result = applyRule(rule, quantity, materialCost, laborCost, tempUnitCost);
        if (result.applied) {
            discount += result.discount;
            appliedRules.push({
                rule_id: rule.id,
                rule_name: rule.name,
                discount: result.discount,
            });
        }
    }

    const totalCost = materialCost + laborCost + taxCost - discount;
    const unitCost = quantity > 0 ? totalCost / quantity : 0;

    storage.createHistoryRecord({
        product_id: product.id,
        product_name: product.name,
        quantity,
        material_cost: materialCost,
        labor_cost: laborCost,
        tax_cost: taxCost,
        discount,
        total_cost: totalCost,
        unit_cost: unitCost,
        details: { materials: materialDetails, tax_rate: product.tax_rate },
        applied_rules: appliedRules,
    });

    return {
        product_id: product.id,
        product_name: product.name,
        quantity,
        material_cost: materialCost,
        labor_cost: laborCost,
        tax_cost: taxCost,
        discount,
        total_cost: totalCost,
        unit_cost: unitCost,
        details: { materials: materialDetails, tax_rate: product.tax_rate },
        applied_rules: appliedRules,
    };
}

export function calculateBatchCost(items) {
    const results = [];
    let totalCost = 0;
    const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    const preCalc = [];
    for (const item of items) {
        const product = storage.getProduct(item.product_id);
        if (!product) continue;

        let materialCost = 0;
        for (const recipe of (product.recipes || [])) {
            if (recipe.material) {
                materialCost += recipe.material.price * recipe.quantity * item.quantity;
            }
        }
        const laborCost = product.labor_cost * item.quantity;
        const taxCost = (materialCost + laborCost) * product.tax_rate;
        const tempUnitCost = product.labor_cost;

        preCalc.push({
            product,
            quantity: item.quantity,
            material_cost: materialCost,
            labor_cost: laborCost,
            tax_cost: taxCost,
            temp_unit_cost: tempUnitCost,
        });
    }

    const rules = storage.getRulesAll(true);

    for (const pc of preCalc) {
        let discount = 0;
        const appliedRules = [];
        for (const rule of rules) {
            const result = applyRuleWithTotalQuantity(
                rule,
                pc.quantity,
                totalQuantity,
                pc.material_cost,
                pc.labor_cost,
                pc.temp_unit_cost,
            );
            if (result.applied) {
                discount += result.discount;
                appliedRules.push({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    discount: result.discount,
                });
            }
        }

        const productTotal = pc.material_cost + pc.labor_cost + pc.tax_cost - discount;
        const unitCost = pc.quantity > 0 ? productTotal / pc.quantity : 0;

        const materialDetails = [];
        for (const recipe of (pc.product.recipes || [])) {
            if (recipe.material) {
                const cost = recipe.material.price * recipe.quantity * pc.quantity;
                materialDetails.push({
                    material_id: recipe.material.id,
                    material_name: recipe.material.name,
                    unit: recipe.material.unit,
                    price_per_unit: recipe.material.price,
                    quantity_used: recipe.quantity * pc.quantity,
                    cost,
                });
            }
        }

        storage.createHistoryRecord({
            product_id: pc.product.id,
            product_name: pc.product.name,
            quantity: pc.quantity,
            material_cost: pc.material_cost,
            labor_cost: pc.labor_cost,
            tax_cost: pc.tax_cost,
            discount,
            total_cost: productTotal,
            unit_cost: unitCost,
            details: { materials: materialDetails, tax_rate: pc.product.tax_rate },
            applied_rules: appliedRules,
        });

        results.push({
            product_id: pc.product.id,
            product_name: pc.product.name,
            quantity: pc.quantity,
            material_cost: pc.material_cost,
            labor_cost: pc.labor_cost,
            tax_cost: pc.tax_cost,
            discount,
            total_cost: productTotal,
            unit_cost: unitCost,
            details: { materials: materialDetails, tax_rate: pc.product.tax_rate },
            applied_rules: appliedRules,
        });
        totalCost += productTotal;
    }

    return { results, total_products: results.length, total_cost: totalCost };
}
