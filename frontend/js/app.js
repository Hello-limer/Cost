// 全局数据
let materials = [];
let products = [];
let rules = [];

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDefaultRules();
        await loadAllData();
        initNavigation();
    } catch (error) {
        showToast('初始化失败，请检查服务是否启动', 'error');
    } finally {
        hideLoading();
    }
});

// 初始化默认规则
async function initDefaultRules() {
    try {
        await SystemAPI.initDefaultRules();
    } catch (error) {
        // 规则可能已存在，静默失败
    }
}

// 加载所有数据
async function loadAllData() {
    try {
        // 分别加载，避免一个失败全部失败
        try {
            materials = await MaterialsAPI.getAll();
        } catch (e) {
            materials = [];
        }
        
        try {
            products = await ProductsAPI.getAll();
        } catch (e) {
            products = [];
        }
        
        try {
            rules = await RulesAPI.getAll(false);
        } catch (e) {
            rules = [];
        }
        
        renderMaterials();
        renderProducts();
        renderRules();
        renderCalculatorProducts();
        
        try {
            await renderHistory();
        } catch (e) {
            // 静默失败
        }
    } catch (error) {
        // 静默失败
    }
}

// 显示/隐藏加载动画
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 初始化导航
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // 更新按钮状态
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 切换内容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });
}

// ========== 原料管理 ==========
function renderMaterials() {
    const container = document.getElementById('materials-list');
    
    if (materials.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="color: var(--text-secondary);">暂无原料，点击上方按钮添加</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = materials.map(material => `
        <div class="card">
            <h3>${escapeHtml(material.name)}</h3>
            <p><strong>单价:</strong> ¥${material.price.toFixed(2)} / ${escapeHtml(material.unit)}</p>
            ${material.description ? `<p><strong>描述:</strong> ${escapeHtml(material.description)}</p>` : ''}
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openMaterialModal(${material.id})">
                    编辑
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteMaterial(${material.id})">
                    删除
                </button>
            </div>
        </div>
    `).join('');
}

function openMaterialModal(id = null) {
    const modal = document.getElementById('material-modal');
    const title = document.getElementById('material-modal-title');
    
    if (id) {
        const material = materials.find(m => m.id === id);
        if (material) {
            title.textContent = '编辑原料';
            document.getElementById('material-id').value = material.id;
            document.getElementById('material-name').value = material.name;
            document.getElementById('material-unit').value = material.unit;
            document.getElementById('material-price').value = material.price;
            document.getElementById('material-desc').value = material.description || '';
        }
    } else {
        title.textContent = '添加原料';
        document.getElementById('material-form').reset();
        document.getElementById('material-id').value = '';
    }
    
    modal.classList.add('active');
}

function closeMaterialModal() {
    document.getElementById('material-modal').classList.remove('active');
}

async function saveMaterial() {
    const id = document.getElementById('material-id').value;
    const data = {
        name: document.getElementById('material-name').value,
        unit: document.getElementById('material-unit').value,
        price: parseFloat(document.getElementById('material-price').value),
        description: document.getElementById('material-desc').value || null,
    };
    
    if (!data.name || !data.unit || isNaN(data.price)) {
        showToast('请填写必要信息', 'error');
        return;
    }
    
    try {
        showLoading();
        if (id) {
            await MaterialsAPI.update(id, data);
            showToast('原料更新成功');
        } else {
            await MaterialsAPI.create(data);
            showToast('原料创建成功');
        }
        closeMaterialModal();
        await loadAllData();
    } catch (error) {
        showToast(error.message || '保存失败', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteMaterial(id) {
    if (!confirm('确定要删除这个原料吗？')) return;
    
    try {
        showLoading();
        await MaterialsAPI.delete(id);
        showToast('原料删除成功');
        await loadAllData();
    } catch (error) {
        showToast(error.message || '删除失败', 'error');
    } finally {
        hideLoading();
    }
}

// ========== 商品管理 ==========
function renderProducts() {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="color: var(--text-secondary);">暂无商品，点击上方按钮添加</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="card">
            <h3>${escapeHtml(product.name)}</h3>
            <p><strong>人工成本:</strong> ¥${product.labor_cost.toFixed(2)}</p>
            <p><strong>税率:</strong> ${(product.tax_rate * 100).toFixed(0)}%</p>
            <p><strong>配方原料:</strong> ${product.recipes?.length || 0} 种</p>
            ${product.description ? `<p><strong>描述:</strong> ${escapeHtml(product.description)}</p>` : ''}
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openProductModal(${product.id})">
                    编辑
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                    删除
                </button>
            </div>
        </div>
    `).join('');
}

function openProductModal(id = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    
    if (id) {
        const product = products.find(p => p.id === id);
        if (product) {
            title.textContent = '编辑商品';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-labor').value = product.labor_cost;
            document.getElementById('product-tax').value = product.tax_rate;
            document.getElementById('product-desc').value = product.description || '';
            
            renderRecipeList(product.recipes || []);
        }
    } else {
        title.textContent = '添加商品';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-labor').value = '0';
        document.getElementById('product-tax').value = '0';
        renderRecipeList([]);
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

function renderRecipeList(recipes) {
    const container = document.getElementById('recipe-list');
    container.innerHTML = recipes.map((recipe, index) => createRecipeRow(recipe)).join('');
}

function createRecipeRow(recipe = null) {
    const materialOptions = materials.map(m => 
        `<option value="${m.id}" ${recipe?.material_id === m.id ? 'selected' : ''}>${escapeHtml(m.name)} (¥${m.price}/${m.unit})</option>`
    ).join('');
    
    return `
        <div class="recipe-row">
            <div class="form-group">
                <label>原料</label>
                <select class="form-control recipe-material" required>
                    <option value="">请选择原料</option>
                    ${materialOptions}
                </select>
            </div>
            <div class="form-group">
                <label>用量</label>
                <input type="number" class="form-control recipe-quantity" value="${recipe?.quantity || ''}" step="0.01" min="0" required>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.recipe-row').remove()">
                ×
            </button>
        </div>
    `;
}

function addRecipeRow() {
    const container = document.getElementById('recipe-list');
    container.insertAdjacentHTML('beforeend', createRecipeRow());
}

async function saveProduct() {
    const id = document.getElementById('product-id').value;
    
    const recipeRows = document.querySelectorAll('.recipe-row');
    const recipes = [];
    recipeRows.forEach(row => {
        const materialId = parseInt(row.querySelector('.recipe-material').value);
        const quantity = parseFloat(row.querySelector('.recipe-quantity').value);
        if (materialId && !isNaN(quantity)) {
            recipes.push({ material_id: materialId, quantity });
        }
    });
    
    const data = {
        name: document.getElementById('product-name').value,
        labor_cost: parseFloat(document.getElementById('product-labor').value) || 0,
        tax_rate: parseFloat(document.getElementById('product-tax').value) || 0,
        description: document.getElementById('product-desc').value || null,
        recipes,
    };
    
    if (!data.name) {
        showToast('请填写商品名称', 'error');
        return;
    }
    
    try {
        showLoading();
        if (id) {
            await ProductsAPI.update(id, data);
            showToast('商品更新成功');
        } else {
            await ProductsAPI.create(data);
            showToast('商品创建成功');
        }
        closeProductModal();
        await loadAllData();
    } catch (error) {
        showToast(error.message || '保存失败', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(id) {
    if (!confirm('确定要删除这个商品吗？')) return;
    
    try {
        showLoading();
        await ProductsAPI.delete(id);
        showToast('商品删除成功');
        await loadAllData();
    } catch (error) {
        showToast(error.message || '删除失败', 'error');
    } finally {
        hideLoading();
    }
}

// ========== 规则管理 ==========
function renderRules() {
    const container = document.getElementById('rules-list');
    
    if (rules.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="color: var(--text-secondary);">暂无规则</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = rules.map(rule => `
        <div class="card">
            <h3>${escapeHtml(rule.name)}</h3>
            <p><span class="badge ${rule.is_active ? 'badge-success' : 'badge-danger'}">${rule.is_active ? '启用' : '禁用'}</span></p>
            <p><strong>类型:</strong> ${rule.rule_type === 'quantity_discount' ? '数量折扣' : '总成本折扣'}</p>
            <p><strong>优先级:</strong> ${rule.priority}</p>
            ${rule.description ? `<p><strong>描述:</strong> ${escapeHtml(rule.description)}</p>` : ''}
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openRuleModal(${rule.id})">
                    编辑
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRule(${rule.id})">
                    删除
                </button>
            </div>
        </div>
    `).join('');
}

function openRuleModal(id = null) {
    const modal = document.getElementById('rule-modal');
    const title = document.getElementById('rule-modal-title');
    
    if (id) {
        const rule = rules.find(r => r.id === id);
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
        updateRuleForm();
    }
    
    modal.classList.add('active');
}

function closeRuleModal() {
    document.getElementById('rule-modal').classList.remove('active');
}

function updateRuleForm() {
    const type = document.getElementById('rule-type').value;
    
    if (type === 'quantity_discount') {
        document.getElementById('condition-quantity').style.display = 'block';
        document.getElementById('condition-cost').style.display = 'none';
        document.getElementById('action-unit-discount').style.display = 'block';
        document.getElementById('action-percent-discount').style.display = 'none';
    } else {
        document.getElementById('condition-quantity').style.display = 'none';
        document.getElementById('condition-cost').style.display = 'block';
        document.getElementById('action-unit-discount').style.display = 'none';
        document.getElementById('action-percent-discount').style.display = 'block';
    }
}

async function saveRule() {
    const id = document.getElementById('rule-id').value;
    const type = document.getElementById('rule-type').value;
    
    let conditions, actions;
    if (type === 'quantity_discount') {
        conditions = { min_quantity: parseInt(document.getElementById('rule-min-quantity').value) };
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
        if (id) {
            await RulesAPI.update(id, data);
            showToast('规则更新成功');
        } else {
            await RulesAPI.create(data);
            showToast('规则创建成功');
        }
        closeRuleModal();
        await loadAllData();
    } catch (error) {
        showToast(error.message || '保存失败', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteRule(id) {
    if (!confirm('确定要删除这个规则吗？')) return;
    
    try {
        showLoading();
        await RulesAPI.delete(id);
        showToast('规则删除成功');
        await loadAllData();
    } catch (error) {
        showToast(error.message || '删除失败', 'error');
    } finally {
        hideLoading();
    }
}

// ========== 成本计算 ==========
function renderCalculatorProducts() {
    const select = document.getElementById('calc-product');
    const batchContainer = document.getElementById('batch-products');

    const options = products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    select.innerHTML = `<option value="">请选择商品</option>${options}`;

    batchContainer.innerHTML = products.map(p => `
        <div class="batch-product-item" data-product-id="${p.id}">
            <input type="checkbox" class="batch-product-check" onchange="toggleProductSelection(${p.id})">
            <span class="product-name">${escapeHtml(p.name)}</span>
            <input type="number" class="quantity-input" value="1" min="1" data-product-id="${p.id}" onchange="updateBatchQuantity(${p.id}, this.value)">
        </div>
    `).join('');
}

// 存储每个商品的数量和选中状态
const batchProductState = {};

function toggleProductSelection(productId) {
    const item = document.querySelector(`.batch-product-item[data-product-id="${productId}"]`);
    const checkbox = item.querySelector('.batch-product-check');
    const quantityInput = item.querySelector('.quantity-input');
    
    if (checkbox.checked) {
        item.classList.add('selected');
        batchProductState[productId] = parseInt(quantityInput.value) || 1;
    } else {
        item.classList.remove('selected');
        delete batchProductState[productId];
    }
}

function updateBatchQuantity(productId, value) {
    const item = document.querySelector(`.batch-product-item[data-product-id="${productId}"]`);
    const checkbox = item.querySelector('.batch-product-check');
    if (checkbox.checked) {
        batchProductState[productId] = parseInt(value) || 1;
    }
}

function clearBatchSelection() {
    document.querySelectorAll('.batch-product-check').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.batch-product-item').forEach(item => {
        item.classList.remove('selected');
    });
    // 清空状态对象
    for (const key in batchProductState) {
        delete batchProductState[key];
    }
}

async function calculateCost() {
    const productId = parseInt(document.getElementById('calc-product').value);
    const quantity = parseInt(document.getElementById('calc-quantity').value) || 1;
    
    if (!productId) {
        showToast('请选择商品', 'warning');
        return;
    }
    
    try {
        showLoading();
        const result = await CalculatorAPI.calculate({ product_id: productId, quantity });
        renderCalculationResult(result);
        await loadAllData();
        showToast('计算完成');
    } catch (error) {
        showToast(error.message || '计算失败', 'error');
    } finally {
        hideLoading();
    }
}

async function calculateBatchCost() {
    const items = Object.entries(batchProductState).map(([productId, quantity]) => ({
        product_id: parseInt(productId),
        quantity: quantity
    }));
    
    if (items.length === 0) {
        showToast('请选择要计算的商品', 'warning');
        return;
    }
    
    try {
        showLoading();
        const result = await CalculatorAPI.calculateBatch({ items });
        renderBatchCalculationResult(result);
        await loadAllData();
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
    
    const resultsHtml = result.results?.map(r => `
        <div class="result-row">
            <span>${escapeHtml(r.product_name)} × ${r.quantity}</span>
            <span>¥${r.total_cost.toFixed(2)}</span>
        </div>
    `).join('') || '';
    
    container.innerHTML = `
        <h3 style="margin-bottom: 16px;">批量计算结果</h3>
        <div class="result-details">
            ${resultsHtml}
            <div class="result-row total">
                <span>总计 (${result.total_products} 种商品)</span>
                <span>¥${result.total_cost.toFixed(2)}</span>
            </div>
        </div>
    `;
}

// ========== 计算历史 ==========
async function renderHistory() {
    const container = document.getElementById('history-list');
    
    try {
        const history = await HistoryAPI.getAll();
        
        if (history.length === 0) {
            container.innerHTML = `
                <table>
                    <tbody>
                        <tr>
                            <td style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                                暂无计算记录
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>商品</th>
                        <th>数量</th>
                        <th>材料成本</th>
                        <th>人工成本</th>
                        <th>税费</th>
                        <th>优惠</th>
                        <th>总成本</th>
                        <th>单位成本</th>
                        <th>时间</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(h => `
                        <tr>
                            <td>${escapeHtml(h.product_name || '-')}</td>
                            <td>${h.quantity}</td>
                            <td>¥${h.material_cost.toFixed(2)}</td>
                            <td>¥${h.labor_cost.toFixed(2)}</td>
                            <td>¥${h.tax_cost.toFixed(2)}</td>
                            <td>${h.discount > 0 ? `<span style="color: var(--success-color);">-¥${h.discount.toFixed(2)}</span>` : '-'}</td>
                            <td><strong>¥${h.total_cost.toFixed(2)}</strong></td>
                            <td>¥${h.unit_cost.toFixed(2)}</td>
                            <td>${formatDate(h.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('加载历史记录失败:', error);
        container.innerHTML = `
            <table>
                <tbody>
                    <tr>
                        <td style="text-align: center; padding: 60px 20px; color: var(--danger-color);">
                            加载失败
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }
}

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
