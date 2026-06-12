// 本地存储模块 - 替代后端 MySQL + CRUD
// 使用 localStorage 持久化数据，数据结构与后端保持一致

const STORAGE_KEYS = {
    MATERIALS: 'cost_calc_materials',
    PRODUCTS: 'cost_calc_products',
    RULES: 'cost_calc_rules',
    HISTORY: 'cost_calc_history',
    IDS: 'cost_calc_ids',
};

// 默认规则（首次加载时初始化）
const DEFAULT_RULES = [
    {
        id: 1,
        name: '批量优惠100件',
        rule_type: 'quantity_discount',
        conditions: { min_quantity: 100, discount_mode: 'all' },
        actions: { discount_per_unit: 1 },
        priority: 1,
        is_active: 1,
        description: '数量达到100件时，每件优惠1元',
    },
    {
        id: 2,
        name: '大额成本5%折扣',
        rule_type: 'total_cost_discount',
        conditions: { min_total_cost: 5000 },
        actions: { discount_percent: 0.05 },
        priority: 2,
        is_active: 1,
        description: '总成本达5000元时，享受5%折扣',
    },
];

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        console.error('storage read error', key, e);
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('storage write error', key, e);
    }
}

function nextId(type) {
    const ids = read(STORAGE_KEYS.IDS, { materials: 0, products: 0, rules: 0, history: 0 });
    ids[type] = (ids[type] || 0) + 1;
    write(STORAGE_KEYS.IDS, ids);
    return ids[type];
}

// 首次加载时初始化默认数据
function ensureInitialized() {
    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
        write(STORAGE_KEYS.MATERIALS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        write(STORAGE_KEYS.PRODUCTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RULES)) {
        write(STORAGE_KEYS.RULES, DEFAULT_RULES.map((r, i) => ({ ...r, id: i + 1 })));
        const ids = read(STORAGE_KEYS.IDS, { materials: 0, products: 0, rules: 0, history: 0 });
        ids.rules = DEFAULT_RULES.length;
        write(STORAGE_KEYS.IDS, ids);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
        write(STORAGE_KEYS.HISTORY, []);
    }
}

ensureInitialized();

// ---------------- 原料 CRUD ----------------
export function getMaterialsAll() {
    return read(STORAGE_KEYS.MATERIALS, []);
}

export function getMaterial(id) {
    return getMaterialsAll().find(m => m.id === id) || null;
}

export function createMaterial(data) {
    const materials = getMaterialsAll();
    const item = {
        id: nextId('materials'),
        name: data.name,
        unit: data.unit,
        price: parseFloat(data.price) || 0,
        description: data.description || null,
    };
    materials.push(item);
    write(STORAGE_KEYS.MATERIALS, materials);
    return item;
}

export function updateMaterial(id, data) {
    const materials = getMaterialsAll();
    const idx = materials.findIndex(m => m.id === id);
    if (idx < 0) throw new Error('原料不存在');
    materials[idx] = {
        ...materials[idx],
        name: data.name,
        unit: data.unit,
        price: parseFloat(data.price) || 0,
        description: data.description || null,
    };
    write(STORAGE_KEYS.MATERIALS, materials);
    return materials[idx];
}

export function deleteMaterial(id) {
    const materials = getMaterialsAll().filter(m => m.id !== id);
    write(STORAGE_KEYS.MATERIALS, materials);
    // 同时清理产品中引用了该原料的配方（保持数据一致性）
    const products = getProductsAll().map(p => ({
        ...p,
        recipes: (p.recipes || []).filter(r => r.material_id !== id),
    }));
    write(STORAGE_KEYS.PRODUCTS, products);
    return { success: true };
}

// ---------------- 商品 CRUD ----------------
export function getProductsAll() {
    // 返回时附加原料的详细信息（模拟后端关联）
    const materials = getMaterialsAll();
    const materialMap = {};
    materials.forEach(m => { materialMap[m.id] = m; });
    const products = read(STORAGE_KEYS.PRODUCTS, []);
    return products.map(p => ({
        id: p.id,
        name: p.name,
        labor_cost: parseFloat(p.labor_cost) || 0,
        tax_rate: parseFloat(p.tax_rate) || 0,
        description: p.description || null,
        recipes: (p.recipes || []).map(r => ({
            id: r.id,
            material_id: r.material_id,
            quantity: parseFloat(r.quantity) || 0,
            material: materialMap[r.material_id] || null,
        })),
    }));
}

export function getProduct(id) {
    return getProductsAll().find(p => p.id === id) || null;
}

export function createProduct(data) {
    const products = read(STORAGE_KEYS.PRODUCTS, []);
    const item = {
        id: nextId('products'),
        name: data.name,
        labor_cost: parseFloat(data.labor_cost) || 0,
        tax_rate: parseFloat(data.tax_rate) || 0,
        description: data.description || null,
        recipes: (data.recipes || []).map((r, i) => ({
            id: i + 1,
            material_id: r.material_id,
            quantity: parseFloat(r.quantity) || 0,
        })),
    };
    products.push(item);
    write(STORAGE_KEYS.PRODUCTS, products);
    return getProduct(item.id);
}

export function updateProduct(id, data) {
    const products = read(STORAGE_KEYS.PRODUCTS, []);
    const idx = products.findIndex(p => p.id === id);
    if (idx < 0) throw new Error('商品不存在');
    products[idx] = {
        ...products[idx],
        name: data.name,
        labor_cost: parseFloat(data.labor_cost) || 0,
        tax_rate: parseFloat(data.tax_rate) || 0,
        description: data.description || null,
        recipes: (data.recipes || []).map((r, i) => ({
            id: i + 1,
            material_id: r.material_id,
            quantity: parseFloat(r.quantity) || 0,
        })),
    };
    write(STORAGE_KEYS.PRODUCTS, products);
    return getProduct(id);
}

export function deleteProduct(id) {
    const products = read(STORAGE_KEYS.PRODUCTS, []).filter(p => p.id !== id);
    write(STORAGE_KEYS.PRODUCTS, products);
    return { success: true };
}

// ---------------- 规则 CRUD ----------------
export function getRulesAll(activeOnly = false) {
    let rules = read(STORAGE_KEYS.RULES, []);
    if (activeOnly) rules = rules.filter(r => r.is_active === 1 || r.is_active === true);
    return rules.map(r => ({
        id: r.id,
        name: r.name,
        rule_type: r.rule_type,
        conditions: r.conditions || {},
        actions: r.actions || {},
        priority: r.priority || 0,
        is_active: r.is_active ? 1 : 0,
        description: r.description || null,
    })).sort((a, b) => (a.priority || 0) - (b.priority || 0));
}

export function getRule(id) {
    return getRulesAll().find(r => r.id === id) || null;
}

export function createRule(data) {
    const rules = read(STORAGE_KEYS.RULES, []);
    const item = {
        id: nextId('rules'),
        name: data.name,
        rule_type: data.rule_type,
        conditions: data.conditions || {},
        actions: data.actions || {},
        priority: parseInt(data.priority) || 0,
        is_active: parseInt(data.is_active) !== 0 ? 1 : 0,
        description: data.description || null,
    };
    rules.push(item);
    write(STORAGE_KEYS.RULES, rules);
    return item;
}

export function updateRule(id, data) {
    const rules = read(STORAGE_KEYS.RULES, []);
    const idx = rules.findIndex(r => r.id === id);
    if (idx < 0) throw new Error('规则不存在');
    rules[idx] = {
        ...rules[idx],
        name: data.name,
        rule_type: data.rule_type,
        conditions: data.conditions || {},
        actions: data.actions || {},
        priority: parseInt(data.priority) || 0,
        is_active: parseInt(data.is_active) !== 0 ? 1 : 0,
        description: data.description || null,
    };
    write(STORAGE_KEYS.RULES, rules);
    return rules[idx];
}

export function deleteRule(id) {
    const rules = read(STORAGE_KEYS.RULES, []).filter(r => r.id !== id);
    write(STORAGE_KEYS.RULES, rules);
    return { success: true };
}

export function initDefaultRules() {
    // 只有在规则库为空时才重新写入默认规则
    const current = read(STORAGE_KEYS.RULES, null);
    if (current === null || current.length === 0) {
        const rules = DEFAULT_RULES.map((r, i) => ({ ...r, id: i + 1 }));
        write(STORAGE_KEYS.RULES, rules);
        const ids = read(STORAGE_KEYS.IDS, { materials: 0, products: 0, rules: 0, history: 0 });
        ids.rules = DEFAULT_RULES.length;
        write(STORAGE_KEYS.IDS, ids);
    }
    return { success: true };
}

// ---------------- 历史记录 CRUD ----------------
export function getHistoryAll() {
    const list = read(STORAGE_KEYS.HISTORY, []);
    return list.map((h, i) => ({
        ...h,
        id: h.id || (list.length - i),
    }));
}

export function getHistoryPaginated(page = 1, pageSize = 10) {
    const all = read(STORAGE_KEYS.HISTORY, []);
    // 按创建时间倒序
    const sorted = [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);
    return {
        items,
        total,
        page: currentPage,
        pageSize,
        total_pages: totalPages,
    };
}

export function createHistoryRecord(record) {
    const list = read(STORAGE_KEYS.HISTORY, []);
    const item = {
        id: nextId('history'),
        product_id: record.product_id,
        product_name: record.product_name,
        quantity: record.quantity,
        material_cost: record.material_cost,
        labor_cost: record.labor_cost,
        tax_cost: record.tax_cost,
        discount: record.discount,
        total_cost: record.total_cost,
        unit_cost: record.unit_cost,
        details: record.details || {},
        applied_rules: record.applied_rules || [],
        created_at: new Date().toISOString(),
    };
    list.unshift(item);
    write(STORAGE_KEYS.HISTORY, list);
    return item;
}

export function clearHistory() {
    write(STORAGE_KEYS.HISTORY, []);
    return { success: true, message: '已清空计算历史' };
}
