import { showLoading, hideLoading, escapeHtml, formatDate, showToast } from './ui.js';
import * as api from '../api.js';

let currentPage = 1;
const pageSize = 10;

export async function renderHistory() {
    await loadHistory(currentPage);
}

async function loadHistory(page = 1) {
    currentPage = page;
    const container = document.getElementById('history-list');
    try {
        showLoading();
        const result = await api.HistoryAPI.getPaginated(page, pageSize);

        if (result.total === 0) {
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
            <div class="history-header">
                <button class="btn btn-danger btn-sm" id="clear-all-history" onclick="window.historyModule.clearAllHistory()">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H19H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    一键清空计算历史
                </button>
            </div>
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
                    ${result.items.map(h => `
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
            <div class="pagination">
                <div class="pagination-info">
                    共 ${result.total} 条记录，第 ${result.page} / ${result.total_pages} 页
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(1)" ${result.page <= 1 ? 'disabled' : ''}>首页</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(${result.page - 1})" ${result.page <= 1 ? 'disabled' : ''}>上一页</button>
                    <span class="pagination-page-numbers">
                        ${generatePageNumbers(result.page, result.total_pages)}
                    </span>
                    <button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(${result.page + 1})" ${result.page >= result.total_pages ? 'disabled' : ''}>下一页</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(${result.total_pages})" ${result.page >= result.total_pages ? 'disabled' : ''}>末页</button>
                </div>
            </div>
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

function generatePageNumbers(currentPage, totalPages) {
    let pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        pages.push(`<button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(1)">1</button>`);
        if (startPage > 2) {
            pages.push(`<span class="pagination-ellipsis">...</span>`);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            pages.push(`<button class="btn btn-sm btn-primary" disabled>${i}</button>`);
        } else {
            pages.push(`<button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(${i})">${i}</button>`);
        }
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(`<span class="pagination-ellipsis">...</span>`);
        }
        pages.push(`<button class="btn btn-sm btn-secondary" onclick="window.historyModule.loadHistory(${totalPages})">${totalPages}</button>`);
    }

    return pages.join('');
}

export async function clearAllHistory() {
    if (!confirm('确定要清空所有计算历史吗？此操作不可恢复！')) {
        return;
    }
    try {
        showLoading();
        const result = await api.HistoryAPI.clearAll();
        currentPage = 1;
        showToast(result.message || '已清空计算历史', 'success');
        await loadHistory(1);
    } catch (error) {
        console.error('清空历史记录失败:', error);
        showToast('清空失败，请重试', 'error');
    } finally {
        hideLoading();
    }
}

// 暴露到全局，供HTML中的onclick使用
window.historyModule = {
    loadHistory: loadHistory,
    clearAllHistory: clearAllHistory,
};
