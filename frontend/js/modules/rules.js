import { getRules, setRules } from './state.js';
import { showToast, showLoading, hideLoading, escapeHtml } from './ui.js';
import * as api from '../api.js';

export function renderRules() {
    const container = document.getElementById('rules-list');
    const rules = getRules();
    if (rules.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="color: var(--text-secondary);">暂无规则</p>
            </div>
        `;
        return;
    }
    container.innerHTML = rules.map(rule => {
        let ruleDescription = '';
        if (rule.rule_type === 'quantity_discount') {
            const minQty = rule.conditions?.min_quantity || 0;
            const discountUnit = rule.actions?.discount_per_unit || 0;
            const discountMode = rule.conditions?.discount_mode || 'all';
            
            if (discountMode === 'excess') {
                ruleDescription = `数量 ≥ ${minQty}，超过部分每单位减 ¥${discountUnit}`;
            } else {
                ruleDescription = `数量 ≥ ${minQty}，每单位减 ¥${discountUnit}`;
            }
            
            // 兼容旧数据和新数据
            const unitCostCondition = rule.conditions?.unit_cost_condition;
            const unitCostValue = rule.conditions?.unit_cost_value;
            const maxUnitCost = rule.conditions?.max_unit_cost;
            
            if (unitCostCondition === 'max' && unitCostValue) {
                ruleDescription += `，仅≤¥${unitCostValue}商品`;
            } else if (unitCostCondition === 'min' && unitCostValue) {
                ruleDescription += `，仅≥¥${unitCostValue}商品`;
            } else if (unitCostCondition === 'equal' && unitCostValue) {
                ruleDescription += `，仅=¥${unitCostValue}商品`;
            } else if (maxUnitCost) {
                ruleDescription += `，仅≤¥${maxUnitCost}商品`;
            }
        } else {
            const minCost = rule.conditions?.min_total_cost || 0;
            const discountPercent = (rule.actions?.discount_percent || 0) * 100;
            ruleDescription = `成本 ≥ ¥${minCost}，${discountPercent}% 折扣`;
        }
        
        return `
            <div class="card">
                <h3>${escapeHtml(rule.name)}</h3>
                <p><span class="badge ${rule.is_active ? 'badge-success' : 'badge-danger'}">${rule.is_active ? '启用' : '禁用'}</span></p>
                <p><strong>规则:</strong> ${ruleDescription}</p>
                <p><strong>优先级:</strong> ${rule.priority}</p>
                ${rule.description ? `<p><strong>描述:</strong> ${escapeHtml(rule.description)}</p>` : ''}
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.ruleModule.openRuleModal(${rule.id})">编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="window.ruleModule.deleteRule(${rule.id})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

export function openRuleModal(id = null) {
    const modal = document.getElementById('rule-modal');
    const title = document.getElementById('rule-modal-title');
    
    // 添加事件监听器
    const formFields = ['rule-type', 'rule-min-quantity', 'rule-discount-unit', 'rule-discount-mode', 'rule-min-cost', 'rule-discount-percent', 'rule-unit-cost-condition-type', 'rule-unit-cost-value'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.removeEventListener('input', updateRulePreview);
            field.removeEventListener('change', updateRulePreview);
            field.addEventListener('input', updateRulePreview);
            field.addEventListener('change', updateRulePreview);
        }
    });
    
    // 单位成本条件类型变化时更新显示
    const conditionTypeField = document.getElementById('rule-unit-cost-condition-type');
    if (conditionTypeField) {
        conditionTypeField.removeEventListener('change', updateUnitCostValueVisibility);
        conditionTypeField.addEventListener('change', () => {
            updateUnitCostValueVisibility();
            updateRulePreview();
        });
    }
    
    if (id) {
        const rule = getRules().find(r => r.id === id);
        if (rule) {
            title.textContent = '编辑规则';
            document.getElementById('rule-id').value = rule.id;
            document.getElementById('rule-name').value = rule.name;
            document.getElementById('rule-type').value = rule.rule_type;
            document.getElementById('rule-priority').value = rule.priority;
            document.getElementById('rule-active').value = rule.is_active;
            document.getElementById('rule-desc').value = rule.description || '';
            if (rule.rule_type === 'quantity_discount') {
                document.getElementById('rule-min-quantity').value = rule.conditions?.min_quantity || '';
                document.getElementById('rule-discount-unit').value = rule.actions?.discount_per_unit || '';
                document.getElementById('rule-discount-mode').value = rule.conditions?.discount_mode || 'all';
                // 兼容旧数据和新数据
                if (rule.conditions?.unit_cost_condition) {
                    document.getElementById('rule-unit-cost-condition-type').value = rule.conditions.unit_cost_condition;
                    document.getElementById('rule-unit-cost-value').value = rule.conditions.unit_cost_value || '';
                } else if (rule.conditions?.max_unit_cost) {
                    document.getElementById('rule-unit-cost-condition-type').value = 'max';
                    document.getElementById('rule-unit-cost-value').value = rule.conditions.max_unit_cost;
                } else {
                    document.getElementById('rule-unit-cost-condition-type').value = 'none';
                    document.getElementById('rule-unit-cost-value').value = '';
                }
            } else {
                document.getElementById('rule-min-cost').value = rule.conditions?.min_total_cost || '';
                document.getElementById('rule-discount-percent').value = rule.actions?.discount_percent || '';
            }
            updateRuleForm();
        }
    } else {
        title.textContent = '添加规则';
        document.getElementById('rule-form').reset();
        document.getElementById('rule-id').value = '';
        document.getElementById('rule-priority').value = '1';
        document.getElementById('rule-active').value = '1';
        document.getElementById('rule-discount-mode').value = 'all';
        document.getElementById('rule-unit-cost-condition-type').value = 'none';
        document.getElementById('rule-unit-cost-value').value = '';
        updateRuleForm();
    }
    modal.classList.add('active');
}

export function closeRuleModal() {
    document.getElementById('rule-modal').classList.remove('active');
}

export function updateRuleForm() {
    const type = document.getElementById('rule-type').value;
    if (type === 'quantity_discount') {
        document.getElementById('condition-quantity').style.display = 'block';
        document.getElementById('discount-mode-select').style.display = 'block';
        document.getElementById('unit-cost-condition-type').style.display = 'block';
        updateUnitCostValueVisibility();
        document.getElementById('condition-cost').style.display = 'none';
        document.getElementById('action-unit-discount').style.display = 'block';
        document.getElementById('action-percent-discount').style.display = 'none';
    } else {
        document.getElementById('condition-quantity').style.display = 'none';
        document.getElementById('discount-mode-select').style.display = 'none';
        document.getElementById('unit-cost-condition-type').style.display = 'none';
        document.getElementById('unit-cost-value').style.display = 'none';
        document.getElementById('condition-cost').style.display = 'block';
        document.getElementById('action-unit-discount').style.display = 'none';
        document.getElementById('action-percent-discount').style.display = 'block';
    }
    updateRulePreview();
}

function updateUnitCostValueVisibility() {
    const conditionType = document.getElementById('rule-unit-cost-condition-type').value;
    document.getElementById('unit-cost-value').style.display = conditionType === 'none' ? 'none' : 'block';
}

function updateRulePreview() {
    const type = document.getElementById('rule-type').value;
    const preview = document.getElementById('rule-preview');
    
    if (type === 'quantity_discount') {
        const minQty = document.getElementById('rule-min-quantity').value;
        const discountUnit = document.getElementById('rule-discount-unit').value;
        const discountMode = document.getElementById('rule-discount-mode').value;
        const conditionType = document.getElementById('rule-unit-cost-condition-type').value;
        const unitCostValue = document.getElementById('rule-unit-cost-value').value;
        
        if (minQty && discountUnit) {
            let previewText = '';
            if (discountMode === 'excess') {
                previewText = `当数量 ≥ ${minQty} 时，超过 ${minQty} 的部分每单位优惠 ¥${discountUnit}（前 ${minQty} 单位不享受优惠）`;
            } else {
                previewText = `当数量 ≥ ${minQty} 时，每单位优惠 ¥${discountUnit}（全部 ${minQty} 单位以上都享受优惠）`;
            }
            
            if (conditionType === 'max' && unitCostValue) {
                previewText += `，仅适用于单位成本 ≤ ¥${unitCostValue} 的商品`;
            } else if (conditionType === 'min' && unitCostValue) {
                previewText += `，仅适用于单位成本 ≥ ¥${unitCostValue} 的商品`;
            } else if (conditionType === 'equal' && unitCostValue) {
                previewText += `，仅适用于单位成本 = ¥${unitCostValue} 的商品`;
            }
            
            preview.textContent = previewText;
        } else {
            preview.textContent = '请填写最低数量和优惠金额';
        }
    } else {
        const minCost = document.getElementById('rule-min-cost').value;
        const discountPercent = document.getElementById('rule-discount-percent').value;
        
        if (minCost && discountPercent) {
            const percent = (parseFloat(discountPercent) * 100).toFixed(0);
            preview.textContent = `当总成本 ≥ ¥${minCost} 时，享受 ${percent}% 的折扣优惠`;
        } else {
            preview.textContent = '请填写最低成本和折扣比例';
        }
    }
}

export async function saveRule() {
    const id = document.getElementById('rule-id').value;
    const type = document.getElementById('rule-type').value;
    let conditions, actions;
    if (type === 'quantity_discount') {
        conditions = { 
            min_quantity: parseInt(document.getElementById('rule-min-quantity').value),
            discount_mode: document.getElementById('rule-discount-mode').value
        };
        const conditionType = document.getElementById('rule-unit-cost-condition-type').value;
        const unitCostValue = document.getElementById('rule-unit-cost-value').value;
        if (conditionType !== 'none' && unitCostValue) {
            conditions.unit_cost_condition = conditionType;
            conditions.unit_cost_value = parseFloat(unitCostValue);
        }
        actions = { discount_per_unit: parseFloat(document.getElementById('rule-discount-unit').value) };
    } else {
        conditions = { min_total_cost: parseFloat(document.getElementById('rule-min-cost').value) };
        actions = { discount_percent: parseFloat(document.getElementById('rule-discount-percent').value) };
    }
    const data = {
        name: document.getElementById('rule-name').value,
        rule_type: type,
        conditions,
        actions,
        priority: parseInt(document.getElementById('rule-priority').value) || 0,
        is_active: parseInt(document.getElementById('rule-active').value),
        description: document.getElementById('rule-desc').value || null,
    };
    if (!data.name) {
        showToast('请填写规则名称', 'error');
        return;
    }
    try {
        showLoading();
        if (id) await api.RulesAPI.update(id, data);
        else await api.RulesAPI.create(data);
        showToast(id ? '规则更新成功' : '规则创建成功');
        closeRuleModal();
        await loadRulesData();
    } catch (error) {
        showToast(error.message || '保存失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function deleteRule(id) {
    if (!confirm('确定要删除这个规则吗？')) return;
    try {
        showLoading();
        await api.RulesAPI.delete(id);
        showToast('规则删除成功');
        await loadRulesData();
    } catch (error) {
        showToast(error.message || '删除失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function loadRulesData() {
    try {
        setRules(await api.RulesAPI.getAll(false));
    } catch (e) {
        setRules([]);
    }
    renderRules();
}
