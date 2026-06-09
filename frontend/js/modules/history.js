import { showLoading, hideLoading, escapeHtml, formatDate } from './ui.js';
import * as api from '../api.js';

export async function renderHistory() {
    const container = document.getElementById('history-list');
    try {
        showLoading();
        const history = await api.HistoryAPI.getAll();
        if (history.length === 0) {
            container.innerHTML = `
                <table>
                    <tbody>
                        <tr>
                            <td style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">暂无计算记录</td>
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
                        <td style="text-align: center; padding: 60px 20px; color: var(--danger-color);">加载失败</td>
                    </tr>
                </tbody>
            </table>
        `;
    } finally {
        hideLoading();
    }
}
