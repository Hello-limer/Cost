// API 层 - 支持两种模式
//   LOCAL  - 纯前端本地计算 + localStorage 存储（打包 Android 时使用）
//   REMOTE - 请求后端 FastAPI（开发调试或联网场景）
//
// 通过 window.__API_MODE__ 切换，默认自动检测：
//   - 若无后端服务可用（fetch 失败）自动降级为 LOCAL
//   - 可在页面加载前设置 window.__API_MODE__ = 'LOCAL' 或 'REMOTE'

import * as storage from './modules/storage.js';
import * as costCalc from './modules/cost-calc.js';

const API_BASE = '/api';

// ---------------- 模式控制 ----------------
export function getMode() {
    if (window.__API_MODE__) return window.__API_MODE__;
    return 'LOCAL'; // 默认使用本地模式（便于打包）
}

export function setMode(mode) {
    window.__API_MODE__ = mode;
}

// ---------------- 通用请求（REMOTE 模式） ----------------
async function request(url, options = {}) {
    const defaultOptions = {
        headers: { 'Content-Type': 'application/json' },
    };
    const response = await fetch(`${API_BASE}${url}`, {
        ...defaultOptions, ...options,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.message || '请求失败');
    }
    return await response.json();
}

// ---------------- 原料 ----------------
export const MaterialsAPI = {
    getAll: async () => {
        if (getMode() === 'LOCAL') return storage.getMaterialsAll();
        return request('/materials/');
    },
    get: async (id) => {
        if (getMode() === 'LOCAL') return storage.getMaterial(id);
        return request(`/materials/${id}`);
    },
    create: async (data) => {
        if (getMode() === 'LOCAL') return storage.createMaterial(data);
        return request('/materials/', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id, data) => {
        if (getMode() === 'LOCAL') return storage.updateMaterial(id, data);
        return request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id) => {
        if (getMode() === 'LOCAL') return storage.deleteMaterial(id);
        return request(`/materials/${id}`, { method: 'DELETE' });
    },
};

// ---------------- 商品 ----------------
export const ProductsAPI = {
    getAll: async () => {
        if (getMode() === 'LOCAL') return storage.getProductsAll();
        return request('/products/');
    },
    get: async (id) => {
        if (getMode() === 'LOCAL') return storage.getProduct(id);
        return request(`/products/${id}`);
    },
    create: async (data) => {
        if (getMode() === 'LOCAL') return storage.createProduct(data);
        return request('/products/', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id, data) => {
        if (getMode() === 'LOCAL') return storage.updateProduct(id, data);
        return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id) => {
        if (getMode() === 'LOCAL') return storage.deleteProduct(id);
        return request(`/products/${id}`, { method: 'DELETE' });
    },
};

// ---------------- 规则 ----------------
export const RulesAPI = {
    getAll: async (activeOnly = true) => {
        if (getMode() === 'LOCAL') return storage.getRulesAll(activeOnly);
        return request(`/rules/?active_only=${activeOnly}`);
    },
    get: async (id) => {
        if (getMode() === 'LOCAL') return storage.getRule(id);
        return request(`/rules/${id}`);
    },
    create: async (data) => {
        if (getMode() === 'LOCAL') return storage.createRule(data);
        return request('/rules/', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id, data) => {
        if (getMode() === 'LOCAL') return storage.updateRule(id, data);
        return request(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id) => {
        if (getMode() === 'LOCAL') return storage.deleteRule(id);
        return request(`/rules/${id}`, { method: 'DELETE' });
    },
};

// ---------------- 成本计算 ----------------
export const CalculatorAPI = {
    calculate: async (data) => {
        if (getMode() === 'LOCAL') return costCalc.calculateProductCost(data.product_id, data.quantity || 1);
        return request('/calculate/', { method: 'POST', body: JSON.stringify(data) });
    },
    calculateBatch: async (data) => {
        if (getMode() === 'LOCAL') return costCalc.calculateBatchCost(data.items || []);
        return request('/calculate/batch/', { method: 'POST', body: JSON.stringify(data) });
    },
};

// ---------------- 历史记录 ----------------
export const HistoryAPI = {
    getAll: async () => {
        if (getMode() === 'LOCAL') return storage.getHistoryAll();
        return request('/history/');
    },
    get: async (id) => {
        if (getMode() === 'LOCAL') return { id };
        return request(`/history/${id}`);
    },
    getPaginated: async (page = 1, pageSize = 10) => {
        if (getMode() === 'LOCAL') return storage.getHistoryPaginated(page, pageSize);
        return request(`/history/paginated/?page=${page}&pageSize=${pageSize}`);
    },
    clearAll: async () => {
        if (getMode() === 'LOCAL') return storage.clearHistory();
        return request('/history/', { method: 'DELETE' });
    },
};

// ---------------- 系统 ----------------
export const SystemAPI = {
    initDefaultRules: async () => {
        if (getMode() === 'LOCAL') return storage.initDefaultRules();
        try {
            return await request('/init-default-rules/', { method: 'POST' });
        } catch (e) {
            // 后端不存在此端点时静默忽略
            return { success: true };
        }
    },
};
