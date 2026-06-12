// 简单的自测脚本 - 在 Node.js 中模拟 localStorage 并验证本地模块逻辑
// 运行： node frontend/_selftest.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 在 globalThis 上模拟 localStorage
const __dirname = dirname(fileURLToPath(import.meta.url));
const storePath = join(__dirname, '_selftest_store.json');
let store = {};
try { store = JSON.parse(readFileSync(storePath, 'utf8')); } catch { store = {}; }

globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); writeFileSync(storePath, JSON.stringify(store, null, 2)); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
};

// 动态加载模块（因为它们引用了 localStorage）
const storage = await import('./js/modules/storage.js');
const costCalc = await import('./js/modules/cost-calc.js');

console.log('== 原料测试 ==');
const m1 = storage.createMaterial({ name: '面粉', unit: 'kg', price: 5, description: '中筋' });
const m2 = storage.createMaterial({ name: '鸡蛋', unit: '个', price: 1.2, description: '土鸡蛋' });
console.log('创建原料:', m1, m2);
console.log('列表:', storage.getMaterialsAll().length, '条');

console.log('\n== 商品测试 ==');
const p1 = storage.createProduct({
    name: '煎饼',
    labor_cost: 3,
    tax_rate: 0.06,
    description: '简易煎饼',
    recipes: [
        { material_id: m1.id, quantity: 0.2 },
        { material_id: m2.id, quantity: 1 },
    ],
});
console.log('创建商品:', p1);

console.log('\n== 规则测试 ==');
storage.deleteRule(1);
storage.deleteRule(2);
const r1 = storage.createRule({
    name: '满10件优惠',
    rule_type: 'quantity_discount',
    conditions: { min_quantity: 10, discount_mode: 'all' },
    actions: { discount_per_unit: 0.5 },
    priority: 1,
    is_active: 1,
});
console.log('规则:', r1);

console.log('\n== 单个成本计算 ==');
const single = costCalc.calculateProductCost(p1.id, 1);
console.log('1个煎饼成本:', JSON.stringify(single, null, 2));

console.log('\n== 批量成本计算（触发优惠）==');
const batch = costCalc.calculateBatchCost([{ product_id: p1.id, quantity: 15 }]);
console.log('批量结果:', JSON.stringify(batch, null, 2));

console.log('\n== 历史记录 ==');
console.log('总记录数:', storage.getHistoryPaginated(1, 20).total);

console.log('\n✅ 本地模式自测完成');
