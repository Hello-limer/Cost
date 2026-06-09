let materials = [];
let products = [];
let rules = [];
const batchProductState = {};

export function setMaterials(data) { materials = data; }
export function setProducts(data) { products = data; }
export function setRules(data) { rules = data; }
export function getMaterials() { return materials; }
export function getProducts() { return products; }
export function getRules() { return rules; }
export function getBatchState() { return batchProductState; }
export function clearBatchState() {
    for (const key in batchProductState) delete batchProductState[key];
}
export function updateBatchState(productId, quantity) {
    batchProductState[productId] = quantity;
}
export function removeFromBatchState(productId) {
    delete batchProductState[productId];
}
