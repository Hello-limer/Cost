import { initNavigation } from './modules/navigation.js';
import { renderMaterials, openMaterialModal, closeMaterialModal, saveMaterial, deleteMaterial, loadMaterialsData } from './modules/materials.js';
import { renderProducts, openProductModal, closeProductModal, renderRecipeList, createRecipeRow, addRecipeRow, saveProduct, deleteProduct, loadProductsData } from './modules/products.js';
import { renderRules, openRuleModal, closeRuleModal, updateRuleForm, saveRule, deleteRule, loadRulesData } from './modules/rules.js';
import { renderCalculatorProducts, toggleProductSelection, updateBatchQuantity, clearBatchSelection, calculateCost, calculateBatchCost } from './modules/calculator.js';
import { renderHistory } from './modules/history.js';
import { setMaterials, setProducts, setRules } from './modules/state.js';
import { hideLoading, showToast } from './modules/ui.js';
import * as api from './api.js';

window.materialModule = { openMaterialModal, closeMaterialModal, saveMaterial, deleteMaterial, loadMaterialsData };
window.productModule = { openProductModal, closeProductModal, addRecipeRow, saveProduct, deleteProduct, loadProductsData };
window.ruleModule = { openRuleModal, closeRuleModal, updateRuleForm, saveRule, deleteRule, loadRulesData };
window.calcModule = { renderCalculatorProducts, toggleProductSelection, updateBatchQuantity, clearBatchSelection, calculateCost, calculateBatchCost };

async function initDefaultRules() {
    try {
        await api.SystemAPI.initDefaultRules();
    } catch (error) {
    }
}

async function loadAllData() {
    try {
        await loadMaterialsData();
        await loadProductsData();
        await loadRulesData();
        renderMaterials();
        renderProducts();
        renderRules();
        renderCalculatorProducts();
        await renderHistory();
    } catch (error) {
    }
}

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

window.loadAllData = loadAllData;
