// Edit Transaction Modal Functions

function editTransaction(id, type) {
    // Show loading state
    showEditModal('loading');
    
    // Fetch transaction data
    fetch('ajax/get_transaction.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'id=' + id + '&type=' + type
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showEditForm(data.transaction);
        } else {
            alert('Error: ' + data.error);
            closeEditModal();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load transaction');
        closeEditModal();
    });
}

function showEditModal(state) {
    let modal = document.getElementById('editTransactionModal');
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = 'editTransactionModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Edit Transaction</h3>
                    <button class="modal-close" onclick="closeEditModal()">&times;</button>
                </div>
                <div class="modal-body" id="editModalBody">
                    <div class="loading-spinner" style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
}

function showEditForm(transaction) {
    const body = document.getElementById('editModalBody');
    
    // Get categories for expense dropdown
    let categoryOptions = '';
    if (transaction.type === 'expense') {
        fetchCategories().then(categories => {
            categoryOptions = '<option value="">Select Category</option>';
            categories.forEach(cat => {
                const selected = (cat.id == transaction.category_id) ? 'selected' : '';
                categoryOptions += `<option value="${cat.id}" ${selected}>${cat.name}</option>`;
            });
            renderForm();
        });
    } else {
        renderForm();
    }
    
    function renderForm() {
        body.innerHTML = `
            <form id="editTransactionForm">
                <input type="hidden" name="id" value="${transaction.id}">
                <input type="hidden" name="type" value="${transaction.type}">
                
                <div class="form-group">
                    <label class="form-label">Amount (${getCurrencySymbol()})</label>
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
                    <input type="text" name="description" class="app-input" value="${escapeHtml(transaction.description || '')}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" name="date" class="app-input" value="${transaction.trans_date}" required>
                </div>
                
                <div class="modal-footer" style="margin-top: 16px; padding: 0; border: none;">
                    <button type="button" class="btn-secondary" onclick="closeEditModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        document.getElementById('editTransactionForm').addEventListener('submit', saveTransaction);
    }
}

function saveTransaction(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    fetch('ajax/update_transaction.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeEditModal();
            location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to save transaction');
    });
}

function closeEditModal() {
    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function fetchCategories() {
    const response = await fetch('ajax/get_categories.php');
    const data = await response.json();
    return data.categories || [];
}

function getCurrencySymbol() {
    // Try to get from page or default to PHP
    const currencySpan = document.querySelector('.transaction-amount');
    if (currencySpan) {
        const text = currencySpan.textContent;
        const match = text.match(/[₱$€£¥]/);
        if (match) return match[0];
    }
    return '₱';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
});