// ============================================
// Loading Skeletons Manager for KITA-LOG
// Supports Dashboard, Transactions, Inventory, Settings
// ============================================

const SkeletonManager = {
    showDashboardSkeleton: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="stats-skeleton">
                <div class="stat-skeleton-card"><div class="stat-skeleton-line"></div><div class="stat-skeleton-label"></div></div>
                <div class="stat-skeleton-card"><div class="stat-skeleton-line"></div><div class="stat-skeleton-label"></div></div>
                <div class="stat-skeleton-card"><div class="stat-skeleton-line"></div><div class="stat-skeleton-label"></div></div>
                <div class="stat-skeleton-card"><div class="stat-skeleton-line"></div><div class="stat-skeleton-label"></div></div>
            </div>
            <div class="quick-actions-skeleton">
                <div class="quick-btn-skeleton"></div>
                <div class="quick-btn-skeleton"></div>
                <div class="quick-btn-skeleton"></div>
            </div>
            <div class="trending-skeleton">
                <div class="trending-card-skeleton"><div class="trending-icon-skeleton"></div><div class="trending-title-skeleton"></div><div class="trending-price-skeleton"></div></div>
                <div class="trending-card-skeleton"><div class="trending-icon-skeleton"></div><div class="trending-title-skeleton"></div><div class="trending-price-skeleton"></div></div>
                <div class="trending-card-skeleton"><div class="trending-icon-skeleton"></div><div class="trending-title-skeleton"></div><div class="trending-price-skeleton"></div></div>
            </div>
            <div class="transaction-skeleton">
                <div class="transaction-item-skeleton"><div class="transaction-left-skeleton"><div class="transaction-icon-skeleton"></div><div class="transaction-info-skeleton"><div class="transaction-title-skeleton"></div><div class="transaction-date-skeleton"></div></div></div><div class="transaction-amount-skeleton"></div></div>
                <div class="transaction-item-skeleton"><div class="transaction-left-skeleton"><div class="transaction-icon-skeleton"></div><div class="transaction-info-skeleton"><div class="transaction-title-skeleton"></div><div class="transaction-date-skeleton"></div></div></div><div class="transaction-amount-skeleton"></div></div>
                <div class="transaction-item-skeleton"><div class="transaction-left-skeleton"><div class="transaction-icon-skeleton"></div><div class="transaction-info-skeleton"><div class="transaction-title-skeleton"></div><div class="transaction-date-skeleton"></div></div></div><div class="transaction-amount-skeleton"></div></div>
            </div>
        `;
    },
    
    showTransactionsSkeleton: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '<div class="transaction-skeleton">';
        for (let i = 0; i < 5; i++) {
            html += `
                <div class="transaction-item-skeleton">
                    <div class="transaction-left-skeleton">
                        <div class="transaction-icon-skeleton"></div>
                        <div class="transaction-info-skeleton">
                            <div class="transaction-title-skeleton"></div>
                            <div class="transaction-date-skeleton"></div>
                        </div>
                    </div>
                    <div class="transaction-amount-skeleton"></div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    },
    
    showInventorySkeleton: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < 5; i++) {
            html += `
                <div class="inventory-item-skeleton" style="background: var(--bg-card); border-radius: 20px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                    <div style="flex: 2;"><div style="height: 16px; width: 100px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 8px; margin-bottom: 6px; animation: skeletonWave 1.5s infinite;"></div><div style="height: 10px; width: 60px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 8px; animation: skeletonWave 1.5s infinite;"></div></div>
                    <div style="display: flex; gap: 12px;"><div style="width: 50px; height: 14px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 8px; animation: skeletonWave 1.5s infinite;"></div><div style="width: 60px; height: 14px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 8px; animation: skeletonWave 1.5s infinite;"></div></div>
                </div>
            `;
        }
        container.innerHTML = html;
    },
    
    showSettingsSkeleton: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < 4; i++) {
            html += `
                <div style="background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-color); margin-bottom: 16px; overflow: hidden;">
                    <div style="padding: 14px 16px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);"><div style="height: 20px; width: 120px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 8px; animation: skeletonWave 1.5s infinite;"></div></div>
                    <div style="padding: 16px;">
                        <div style="height: 50px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 12px; margin-bottom: 12px; animation: skeletonWave 1.5s infinite;"></div>
                        <div style="height: 50px; background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%); background-size: 200% 100%; border-radius: 12px; animation: skeletonWave 1.5s infinite;"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },
    
    hideSkeleton: function(containerId, realContent) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = realContent;
        }
    }
};

window.SkeletonManager = SkeletonManager;