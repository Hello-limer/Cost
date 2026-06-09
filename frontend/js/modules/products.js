import { getProducts, setProducts, getMaterials } from './state.js';
import { showToast, showLoading, hideLoading, escapeHtml } from './ui.js';
import * as api from '../api.js';

export function renderProducts() {
    const container = document.getElementById('products-list');
    const products = getProducts();
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
                <button class="btn btn-secondary btn-sm" onclick="window.productModule.openProductModal(${product.id})">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="window.productModule.deleteProduct(${product.id})">删除</button>
            </div>
        </div>
    `).join('');
}

export function openProductModal(id = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    if (id) {
        const product = getProducts().find(p => p.id === id);
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

export function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

export function renderRecipeList(recipes) {
    const container = document.getElementById('recipe-list');
    container.innerHTML = recipes.map((recipe, index) => createRecipeRow(recipe)).join('');
}

export function createRecipeRow(recipe = null) {
    const materials = getMaterials();
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
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.recipe-row').remove()">×</button>
        </div>
    `;
}

export function addRecipeRow() {
    const container = document.getElementById('recipe-list');
    container.insertAdjacentHTML('beforeend', createRecipeRow());
}

export async function saveProduct() {
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
        if (id) await api.ProductsAPI.update(id, data);
        else await api.ProductsAPI.create(data);
        showToast(id ? '商品更新成功' : '商品创建成功');
        closeProductModal();
        await loadProductsData();
        // 同时更新成本计算页面的商品列表
        if (window.calcModule && window.calcModule.renderCalculatorProducts) {
            window.calcModule.renderCalculatorProducts();
        }
    } catch (error) {
        showToast(error.message || '保存失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function deleteProduct(id) {
    if (!confirm('确定要删除这个商品吗？')) return;
    try {
        showLoading();
        await api.ProductsAPI.delete(id);
        showToast('商品删除成功');
        await loadProductsData();
        // 同时更新成本计算页面的商品列表
        if (window.calcModule && window.calcModule.renderCalculatorProducts) {
            window.calcModule.renderCalculatorProducts();
        }
    } catch (error) {
        showToast(error.message || '删除失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function loadProductsData() {
    try {
        setProducts(await api.ProductsAPI.getAll());
    } catch (e) {
        setProducts([]);
    }
    renderProducts();
}
