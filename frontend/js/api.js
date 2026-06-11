// API 基础配置
export const API_BASE = '/api';

// 通用请求函数
async function request(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            ...defaultOptions, ...options
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || error.message || '请求失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// 原料 API
export const MaterialsAPI = {
    getAll: () => request('/materials/'),
    get: (id) => request(`/materials/${id}`),
    create: (data) => request('/materials/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/materials/${id}`, {
        method: 'DELETE',
    }),
};

// 商品 API
export const ProductsAPI = {
    getAll: () => request('/products/'),
    get: (id) => request(`/products/${id}`),
    create: (data) => request('/products/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/products/${id}`, {
        method: 'DELETE',
    }),
};

// 规则 API
export const RulesAPI = {
    getAll: (activeOnly = true) => request(`/rules/?active_only=${activeOnly}`),
    get: (id) => request(`/rules/${id}`),
    create: (data) => request('/rules/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/rules/${id}`, {
        method: 'DELETE',
    }),
};

// 成本计算 API
export const CalculatorAPI = {
    calculate: (data) => request('/calculate/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    calculateBatch: (data) => request('/calculate/batch/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// 历史记录 API
export const HistoryAPI = {
    getAll: () => request('/history/'),
    get: (id) => request(`/history/${id}`),
    getPaginated: (page = 1, pageSize = 10) => request(`/history/paginated/?page=${page}&page_size=${pageSize}`),
    clearAll: () => request('/history/', { method: 'DELETE' }),
};

// 系统 API
export const SystemAPI = {
    initDefaultRules: () => request('/init-default-rules/', {
        method: 'POST',
    }),
};
