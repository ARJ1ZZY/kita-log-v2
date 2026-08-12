// ============================================
// KITA-LOG Complete UI Features
// Edit Modal, FAB Inline Forms, Empty States
// NO duplicate pull-to-refresh (handled per page)
// ============================================

// ===== 1. Edit Transaction Modal =====
const EditTransactionModal = {
    show: function(id, type) {
        let modal = document.getElementById('editTransactionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editTransactionModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Edit Transaction</h3>
                        <button class="modal-close" onclick="EditTransactionModal.close()">&times;</button>
                    </div>
                    <div class="modal-body" id="editModalBody">
                        <div class="loading-spinner" style="text-align:center;padding:40px;">
                            <i class="fas fa-spinner fa-spin fa-2x"></i>
                            <p>Loading...</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'flex';
        
        fetch('ajax/get_transaction.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'id=' + id + '&type=' + type
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.renderForm(data.transaction);
            } else {
                document.getElementById('editModalBody').innerHTML = '<div class="alert alert-danger">Error loading transaction</div>';
            }
        })
        .catch(function() {
            document.getElementById('editModalBody').innerHTML = '<div class="alert alert-danger">Network error</div>';
        });
    },
    
    renderForm: function(transaction) {
        const self = this;
        const body = document.getElementById('editModalBody');
        const currency = document.querySelector('.transaction-amount')?.textContent?.match(/[₱$€£¥]/)?.[0] || '₱';
        
        if (transaction.type === 'expense') {
            fetch('ajax/get_categories.php')
                .then(res => res.json())
                .then(data => {
                    let categoryOptions = '<option value="">Select Category</option>';
                    if (data.categories) {
                        data.categories.forEach(function(cat) {
                            const selected = (cat.id == transaction.category_id) ? 'selected' : '';
                            categoryOptions += `<option value="${cat.id}" ${selected}>${cat.name}</option>`;
                        });
                    }
                    self.renderFormWithCategories(transaction, categoryOptions, currency);
                })
                .catch(function() {
                    self.renderFormWithCategories(transaction, '<option value="">Select Category</option>', currency);
                });
        } else {
            this.renderFormWithCategories(transaction, '', currency);
        }
    },
    
    renderFormWithCategories: function(transaction, categoryOptions, currency) {
        const body = document.getElementById('editModalBody');
        
        body.innerHTML = `
            <form id="editTransactionForm">
                <input type="hidden" name="id" value="${transaction.id}">
                <input type="hidden" name="type" value="${transaction.type}">
                
                <div class="form-group">
                    <label class="form-label">Amount (${currency})</label>
                    <input type="number" step="0.01" name="amount" class="app-input" value="${transaction.amount}" required>
                </div>
                
                ${transaction.type === 'expense' ? `
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select name="category_id" class="app-input">${categoryOptions}</select>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" name="description" class="app-input" value="${this.escapeHtml(transaction.description || '')}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" name="date" class="app-input" value="${transaction.trans_date}" required>
                </div>
                
                <div class="modal-footer" style="margin-top:16px;padding:0;border:none;">
                    <button type="button" class="btn-secondary" onclick="EditTransactionModal.close()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        document.getElementById('editTransactionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            EditTransactionModal.save();
        });
    },
    
    save: function() {
        const form = document.getElementById('editTransactionForm');
        const formData = new FormData(form);
        
        fetch('ajax/update_transaction.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.close();
                location.reload();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(function() {
            alert('Network error. Please try again.');
        });
    },
    
    close: function() {
        const modal = document.getElementById('editTransactionModal');
        if (modal) modal.style.display = 'none';
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== 2. FAB Inline Forms =====
function showQuickAdd(type) {
    let modal = document.getElementById('quickAddModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quickAddModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    fetch(`ajax/quick_add_form.php?type=${type}`)
        .then(response => response.text())
        .then(html => {
            modal.innerHTML = html;
            modal.style.display = 'flex';
        })
        .catch(function() {
            window.location.href = `transactions.php?type=${type}`;
        });
}

function closeQuickAdd() {
    const modal = document.getElementById('quickAddModal');
    if (modal) modal.style.display = 'none';
}

// ===== 3. Empty States Enhancement =====
function showEmptyState(containerId, type, onAction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const icons = {
        sales: 'fa-chart-line',
        expenses: 'fa-wallet',
        inventory: 'fa-box-open',
        transactions: 'fa-receipt',
        default: 'fa-folder-open'
    };
    
    const titles = {
        sales: 'No Sales Yet',
        expenses: 'No Expenses Yet',
        inventory: 'Inventory Empty',
        transactions: 'No Transactions',
        default: 'Nothing Here Yet'
    };
    
    const messages = {
        sales: 'Start by adding your first sale',
        expenses: 'Record your first expense to track spending',
        inventory: 'Add items to start managing your stock',
        transactions: 'Add a sale or expense to get started',
        default: 'Get started by adding some data'
    };
    
    const icon = icons[type] || icons.default;
    const title = titles[type] || titles.default;
    const message = messages[type] || messages.default;
    
    container.innerHTML = `
        <div class="empty-state-enhanced">
            <i class="fas ${icon}"></i>
            <h4>${title}</h4>
            <p>${message}</p>
            <button class="btn-primary" onclick="${onAction}">+ Add Your First</button>
        </div>
    `;
}

// ===== 4. Offline Mode Indicator =====
function updateOfflineStatus() {
    const indicator = document.getElementById('offlineIndicator');
    if (!navigator.onLine) {
        if (!indicator) {
            const div = document.createElement('div');
            div.id = 'offlineIndicator';
            div.innerHTML = '<i class="fas fa-wifi"></i> You are offline. Some features may be limited.';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:var(--warning);color:white;text-align:center;padding:8px;font-size:0.8rem;z-index:10000;';
            document.body.insertBefore(div, document.body.firstChild);
        }
    } else {
        if (indicator) indicator.remove();
    }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);
updateOfflineStatus();

// ===== 5. Smooth Page Transitions =====
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin) && !link.target && !link.getAttribute('data-no-transition')) {
        e.preventDefault();
        const url = link.href;
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.2s';
        setTimeout(function() { window.location.href = url; }, 150);
    }
});
document.body.style.opacity = '1';

// Make functions global
window.editTransaction = EditTransactionModal.show;
window.showQuickAdd = showQuickAdd;
window.closeQuickAdd = closeQuickAdd;
window.showEmptyState = showEmptyState;