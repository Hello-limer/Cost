import { getProducts, getBatchState, clearBatchState, updateBatchState, removeFromBatchState } from './state.js';
import { showToast, showLoading, hideLoading, escapeHtml } from './ui.js';
import * as api from '../api.js';
import { renderHistory } from './history.js';

export function renderCalculatorProducts() {
    const select = document.getElementById('calc-product');
    const batchContainer = document.getElementById('batch-products');
    const products = getProducts();
    const options = products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    select.innerHTML = `<option value="">请选择商品</option>${options}`;
    batchContainer.innerHTML = products.map(p => `
        <div class="batch-product-item" data-product-id="${p.id}">
            <input type="checkbox" class="batch-product-check" onchange="window.calcModule.toggleProductSelection(${p.id})">
            <span class="product-name">${escapeHtml(p.name)}</span>
            <input type="number" class="quantity-input" value="1" min="1" data-product-id="${p.id}" onchange="window.calcModule.updateBatchQuantity(${p.id}, this.value)">
        </div>
    `).join('');
}

export function toggleProductSelection(productId) {
    const item = document.querySelector(`.batch-product-item[data-product-id="${productId}"]`);
    const checkbox = item.querySelector('.batch-product-check');
    const quantityInput = item.querySelector('.quantity-input');
    if (checkbox.checked) {
        item.classList.add('selected');
        updateBatchState(productId, parseInt(quantityInput.value) || 1);
    } else {
        item.classList.remove('selected');
        removeFromBatchState(productId);
    }
}

export function updateBatchQuantity(productId, value) {
    const item = document.querySelector(`.batch-product-item[data-product-id="${productId}"]`);
    const checkbox = item.querySelector('.batch-product-check');
    if (checkbox.checked) {
        updateBatchState(productId, parseInt(value) || 1);
    }
}

export function clearBatchSelection() {
    document.querySelectorAll('.batch-product-check').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.batch-product-item').forEach(item => {
        item.classList.remove('selected');
    });
    clearBatchState();
}

export async function calculateCost() {
    const productId = parseInt(document.getElementById('calc-product').value);
    const quantity = parseInt(document.getElementById('calc-quantity').value) || 1;
    if (!productId) {
        showToast('请选择商品', 'warning');
        return;
    }
    try {
        showLoading();
        const result = await api.CalculatorAPI.calculate({ product_id: productId, quantity });
        renderCalculationResult(result);
        await renderHistory();
        showToast('计算完成');
    } catch (error) {
        showToast(error.message || '计算失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function calculateBatchCost() {
    const items = Object.entries(getBatchState()).map(([productId, quantity]) => ({
        product_id: parseInt(productId),
        quantity: quantity
    }));
    if (items.length === 0) {
        showToast('请选择要计算的商品', 'warning');
        return;
    }
    try {
        showLoading();
        const result = await api.CalculatorAPI.calculateBatch({ items });
        renderBatchCalculationResult(result);
        await renderHistory();
        showToast('批量计算完成');
    } catch (error) {
        showToast(error.message || '计算失败', 'error');
    } finally {
        hideLoading();
    }
}

function renderCalculationResult(result) {
    const container = document.getElementById('calc-result');
    const materialDetails = result.details?.materials?.map(m => `
        <div class="result-row">
            <span>${escapeHtml(m.material_name)} (${m.quantity_used} ${m.unit})</span>
            <span>¥${m.cost.toFixed(2)}</span>
        </div>
    `).join('') || '';
    const appliedRules = result.applied_rules?.length > 0 ? `
        <div class="material-breakdown">
            <h4>应用的优惠规则</h4>
            ${result.applied_rules.map(r => `
                <div class="result-row">
                    <span>${escapeHtml(r.rule_name)}</span>
                    <span style="color: var(--success-color);">-¥${r.discount.toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
    ` : '';
    container.innerHTML = `
        <h3 style="margin-bottom: 16px;">${escapeHtml(result.product_name)} × ${result.quantity}</h3>
        <div class="result-details">
            <div class="result-row">
                <span>材料成本</span>
                <span>¥${result.material_cost.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span>人工成本</span>
                <span>¥${result.labor_cost.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span>税费</span>
                <span>¥${result.tax_cost.toFixed(2)}</span>
            </div>
            ${result.discount > 0 ? `
                <div class="result-row">
                    <span>优惠</span>
                    <span style="color: var(--success-color);">-¥${result.discount.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="result-row total">
                <span>总成本</span>
                <span>¥${result.total_cost.toFixed(2)}</span>
            </div>
            <div class="result-row">
                <span>单位成本</span>
                <span>¥${result.unit_cost.toFixed(2)}</span>
            </div>
        </div>
        ${materialDetails ? `
            <div class="material-breakdown">
                <h4>材料明细</h4>
                ${materialDetails}
            </div>
        ` : ''}
        ${appliedRules}
    `;
}

function renderBatchCalculationResult(result) {
    const container = document.getElementById('calc-result');
    
    // 为每个商品生成详细信息
    const resultsHtml = result.results?.map(r => {
        // 生成该商品的材料明细
        const materialDetails = r.details?.materials?.map(m => `
            <div class="result-row">
                <span>${escapeHtml(m.material_name)} (${m.quantity_used} ${m.unit})</span>
                <span>¥${m.cost.toFixed(2)}</span>
            </div>
        `).join('') || '';
        
        // 生成该商品应用的优惠规则
        const appliedRules = r.applied_rules?.length > 0 ? `
            <div class="material-breakdown">
                <h5>应用的优惠规则</h5>
                ${r.applied_rules.map(rule => `
                    <div class="result-row">
                        <span>${escapeHtml(rule.rule_name)}</span>
                        <span style="color: var(--success-color);">-¥${rule.discount.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';
        
        return `
            <div class="batch-product-result">
                <h4 class="batch-result-title">${escapeHtml(r.product_name)} × ${r.quantity}</h4>
                <div class="result-details">
                    <div class="result-row">
                        <span>材料成本</span>
                        <span>¥${r.material_cost.toFixed(2)}</span>
                    </div>
                    <div class="result-row">
                        <span>人工成本</span>
                        <span>¥${r.labor_cost.toFixed(2)}</span>
                    </div>
                    <div class="result-row">
                        <span>税费</span>
                        <span>¥${r.tax_cost.toFixed(2)}</span>
                    </div>
                    ${r.discount > 0 ? `
                        <div class="result-row">
                            <span>优惠</span>
                            <span style="color: var(--success-color);">-¥${r.discount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="result-row">
                        <span>单位成本</span>
                        <span>¥${r.unit_cost.toFixed(2)}</span>
                    </div>
                    <div class="result-row total">
                        <span>该商品总成本</span>
                        <span>¥${r.total_cost.toFixed(2)}</span>
                    </div>
                </div>
                ${materialDetails ? `
                    <div class="material-breakdown">
                        <h5>材料明细</h5>
                        ${materialDetails}
                    </div>
                ` : ''}
                ${appliedRules}
            </div>
        `;
    }).join('') || '';
    
    container.innerHTML = `
        <h3 style="margin-bottom: 16px;">批量计算结果</h3>
        <div class="batch-results-container">
            ${resultsHtml}
        </div>
        <div class="batch-total-section">
            <div class="result-row total">
                <span>总计 (${result.total_products} 种商品)</span>
                <span>¥${result.total_cost.toFixed(2)}</span>
            </div>
        </div>
    `;
}
