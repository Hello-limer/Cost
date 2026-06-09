import { getMaterials, setMaterials } from './state.js';
import { showToast, showLoading, hideLoading, escapeHtml } from './ui.js';
import * as api from '../api.js';

export function renderMaterials() {
    const container = document.getElementById('materials-list');
    const materials = getMaterials();
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
                <button class="btn btn-secondary btn-sm" onclick="window.materialModule.openMaterialModal(${material.id})">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="window.materialModule.deleteMaterial(${material.id})">删除</button>
            </div>
        </div>
    `).join('');
}

export function openMaterialModal(id = null) {
    const modal = document.getElementById('material-modal');
    const title = document.getElementById('material-modal-title');
    if (id) {
        const material = getMaterials().find(m => m.id === id);
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

export function closeMaterialModal() {
    document.getElementById('material-modal').classList.remove('active');
}

export async function saveMaterial() {
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
        if (id) await api.MaterialsAPI.update(id, data);
        else await api.MaterialsAPI.create(data);
        showToast(id ? '原料更新成功' : '原料创建成功');
        closeMaterialModal();
        await loadMaterialsData();
        // 原料变化后也更新产品的配方列表，因为产品配方中可能使用这个原料
        if (window.productModule && window.productModule.loadProductsData) {
            await window.productModule.loadProductsData();
        }
        // 同时更新成本计算页面的产品列表
        if (window.calcModule && window.calcModule.renderCalculatorProducts) {
            window.calcModule.renderCalculatorProducts();
        }
    } catch (error) {
        showToast(error.message || '保存失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function deleteMaterial(id) {
    if (!confirm('确定要删除这个原料吗？')) return;
    try {
        showLoading();
        await api.MaterialsAPI.delete(id);
        showToast('原料删除成功');
        await loadMaterialsData();
        // 原料变化后也更新产品的配方列表，因为产品配方中可能使用这个原料
        if (window.productModule && window.productModule.loadProductsData) {
            await window.productModule.loadProductsData();
        }
        // 同时更新成本计算页面的产品列表
        if (window.calcModule && window.calcModule.renderCalculatorProducts) {
            window.calcModule.renderCalculatorProducts();
        }
    } catch (error) {
        showToast(error.message || '删除失败', 'error');
    } finally {
        hideLoading();
    }
}

export async function loadMaterialsData() {
    try {
        setMaterials(await api.MaterialsAPI.getAll());
    } catch (e) {
        setMaterials([]);
    }
    renderMaterials();
}
