<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }

require 'config/db.php';
require_once 'includes/config_helpers.php';

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT currency_symbol, date_format FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : config('currency', '₱');
$date_format = $settings ? $settings['date_format'] : config('date_format', 'Y-m-d');

// Pagination
$current_page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$items_per_page = 10;
$offset = ($current_page - 1) * $items_per_page;

// Get business type
$stmt = $pdo->prepare("SELECT business_type FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();
$business_type = $user['business_type'] ?? 'sari_sari';

$business_categories = [
    'sari_sari' => ['Canned Goods', 'Rice & Grains', 'Beverages', 'Snacks', 'Household', 'Personal Care'],
    'ukay_ukay' => ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'],
    'online' => ['Electronics', 'Home', 'Fashion', 'Beauty', 'Sports']
];

// Handle Add Item
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_item'])) {
    $item_name = trim($_POST['item_name']);
    $category = $_POST['category'] ?? '';
    $unit = $_POST['unit'] ?? 'pcs';
    $cost_price = floatval($_POST['cost_price'] ?? 0);
    $selling_price = floatval($_POST['selling_price'] ?? 0);
    $quantity = intval($_POST['quantity'] ?? 1);

    if (empty($item_name)) {
        $error = 'Item name is required.';
    } else {
        $check = $pdo->prepare("SELECT id, current_stock FROM inventory_items WHERE user_id = ? AND item_name = ?");
        $check->execute([$user_id, $item_name]);
        $existing = $check->fetch();
        
        if ($existing) {
            $new_stock = $existing['current_stock'] + $quantity;
            $update = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ?");
            if ($update->execute([$new_stock, $existing['id']])) {
                $_SESSION['success_message'] = "Added $quantity to existing stock. New total: $new_stock";
                header('Location: inventory.php');
                exit;
            }
        } else {
            $insert = $pdo->prepare("INSERT INTO inventory_items (user_id, business_type, item_name, category, unit, unit_qty, cost_price, selling_price, current_stock) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)");
            if ($insert->execute([$user_id, $business_type, $item_name, $category, $unit, $cost_price, $selling_price, $quantity])) {
                $_SESSION['success_message'] = 'New item added successfully.';
                header('Location: inventory.php');
                exit;
            }
        }
    }
    if ($error) $_SESSION['error_message'] = $error;
    header('Location: inventory.php');
    exit;
}

// Handle Delete Item
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['delete_item'])) {
    $item_id = intval($_POST['item_id']);
    $stmt = $pdo->prepare("DELETE FROM inventory_items WHERE id = ? AND user_id = ?");
    if ($stmt->execute([$item_id, $user_id])) {
        $_SESSION['success_message'] = 'Item deleted successfully.';
    } else {
        $_SESSION['error_message'] = 'Failed to delete item.';
    }
    header('Location: inventory.php');
    exit;
}

// Handle Edit Item
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['edit_item'])) {
    $item_id = intval($_POST['item_id']);
    $item_name = trim($_POST['item_name']);
    $category = $_POST['category'] ?? '';
    $unit = $_POST['unit'] ?? 'pcs';
    $cost_price = floatval($_POST['cost_price'] ?? 0);
    $selling_price = floatval($_POST['selling_price'] ?? 0);
    
    $update = $pdo->prepare("UPDATE inventory_items SET item_name = ?, category = ?, unit = ?, cost_price = ?, selling_price = ? WHERE id = ? AND user_id = ?");
    if ($update->execute([$item_name, $category, $unit, $cost_price, $selling_price, $item_id, $user_id])) {
        $_SESSION['success_message'] = 'Item updated successfully.';
    } else {
        $_SESSION['error_message'] = 'Failed to update item.';
    }
    header('Location: inventory.php');
    exit;
}

// Handle Purchase Stock
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['purchase_stock'])) {
    $item_id = intval($_POST['item_id']);
    $quantity = intval($_POST['quantity']);
    
    $stmt = $pdo->prepare("SELECT current_stock, item_name FROM inventory_items WHERE id = ? AND user_id = ?");
    $stmt->execute([$item_id, $user_id]);
    $item = $stmt->fetch();
    
    if ($item) {
        $new_stock = $item['current_stock'] + $quantity;
        $update = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?");
        if ($update->execute([$new_stock, $item_id, $user_id])) {
            $_SESSION['success_message'] = "Added $quantity to {$item['item_name']}. New stock: $new_stock";
        }
    }
    header('Location: inventory.php');
    exit;
}

// Get messages
$message = isset($_SESSION['success_message']) ? $_SESSION['success_message'] : null;
$error = isset($_SESSION['error_message']) ? $_SESSION['error_message'] : null;
unset($_SESSION['success_message']);
unset($_SESSION['error_message']);

// Get total count for pagination
$count_stmt = $pdo->prepare("SELECT COUNT(DISTINCT item_name) as total FROM inventory_items WHERE user_id = ?");
$count_stmt->execute([$user_id]);
$total_items = $count_stmt->fetch()['total'];
$total_pages = ceil($total_items / $items_per_page);

// Get paginated items
$stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE user_id = ? GROUP BY item_name ORDER BY category, item_name LIMIT ? OFFSET ?");
$stmt->execute([$user_id, $items_per_page, $offset]);
$items = $stmt->fetchAll();

// Get stats
$stats_stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE user_id = ?");
$stats_stmt->execute([$user_id]);
$all_items = $stats_stmt->fetchAll();
$total_stock = array_sum(array_column($all_items, 'current_stock'));
$out_of_stock = count(array_filter($all_items, fn($i) => $i['current_stock'] == 0));
$inventory_value = array_sum(array_map(fn($i) => $i['current_stock'] * $i['cost_price'], $all_items));

$current_page_name = 'inventory';
include 'app_header.php';
?>

<div class="inventory-page">

    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-boxes"></i></div>
            <div class="stat-content">
                <span class="stat-label">Total Items</span>
                <span class="stat-number"><?php echo $total_items; ?></span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-cubes"></i></div>
            <div class="stat-content">
                <span class="stat-label">Total Stock</span>
                <span class="stat-number"><?php echo number_format($total_stock); ?></span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-content">
                <span class="stat-label">Out of Stock</span>
                <span class="stat-number danger"><?php echo $out_of_stock; ?></span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
            <div class="stat-content">
                <span class="stat-label">Inventory Value</span>
                <span class="stat-number"><?php echo $currency . number_format($inventory_value, 0); ?></span>
            </div>
        </div>
    </div>

    <!-- Add Item Button -->
    <div class="action-bar">
        <button class="add-item-btn" onclick="document.getElementById('addItemModal').style.display='flex'">
            <i class="fas fa-plus"></i> Add New Item
        </button>
    </div>

    <!-- Inventory List -->
    <div class="inventory-card">
        <div class="card-header">
            <div class="header-left">
                <i class="fas fa-list"></i> Item List
                <span class="badge"><?php echo $total_items; ?></span>
            </div>
        </div>
        
        <div class="inventory-list">
            <?php if (count($items) > 0): ?>
                <?php foreach ($items as $item): 
                    if ($item['current_stock'] == 0) {
                        $stock_class = 'critical';
                        $stock_text = 'Out of Stock';
                    } elseif ($item['current_stock'] <= 5) {
                        $stock_class = 'low';
                        $stock_text = 'Low Stock';
                    } else {
                        $stock_class = 'good';
                        $stock_text = 'In Stock';
                    }
                    $profit_per_item = $item['selling_price'] - $item['cost_price'];
                    $margin = $item['selling_price'] > 0 ? round(($profit_per_item / $item['selling_price']) * 100, 1) : 0;
                ?>
                <div class="item-row">
                    <div class="item-info" onclick="showItemDetails(<?php echo htmlspecialchars(json_encode($item)); ?>)">
                        <div class="item-icon <?php echo $stock_class; ?>">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="item-details">
                            <div class="item-name"><?php echo htmlspecialchars($item['item_name']); ?></div>
                            <div class="item-meta">
                                <span><?php echo htmlspecialchars($item['category']); ?></span>
                                <span class="dot">•</span>
                                <span><?php echo $item['unit']; ?></span>
                            </div>
                        </div>
                    </div>
                    <div class="item-stats">
                        <div class="stock-indicator <?php echo $stock_class; ?>"><?php echo $stock_text; ?></div>
                        <div class="stock-count"><?php echo $item['current_stock']; ?> left</div>
                    </div>
                    <div class="item-pricing">
                        <div class="price"><?php echo $currency . number_format($item['selling_price'], 0); ?></div>
                        <div class="margin">+<?php echo $margin; ?>%</div>
                    </div>
                    <div class="item-actions" onclick="event.stopPropagation()">
                        <button class="action purchase" onclick="openPurchaseModal(<?php echo $item['id']; ?>, '<?php echo htmlspecialchars($item['item_name']); ?>')" title="Add Stock">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                        <button class="action edit" onclick="editItem(<?php echo htmlspecialchars(json_encode($item)); ?>)" title="Edit Item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <form method="post" style="display:inline;" onsubmit="return confirm('Delete this item?');">
                            <input type="hidden" name="delete_item" value="1">
                            <input type="hidden" name="item_id" value="<?php echo $item['id']; ?>">
                            <button type="submit" class="action delete" title="Delete Item">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </form>
                    </div>
                </div>
                <?php endforeach; ?>
                
                <!-- Pagination -->
                <?php if ($total_pages > 1): ?>
                <div class="pagination-bar">
                    <?php if ($current_page > 1): ?>
                        <a href="?page=<?php echo $current_page - 1; ?>" class="page-btn prev"><i class="fas fa-chevron-left"></i> Previous</a>
                    <?php endif; ?>
                    
                    <span class="page-number">Page <?php echo $current_page; ?> of <?php echo $total_pages; ?></span>
                    
                    <?php if ($current_page < $total_pages): ?>
                        <a href="?page=<?php echo $current_page + 1; ?>" class="page-btn next">Next <i class="fas fa-chevron-right"></i></a>
                    <?php else: ?>
                        <span class="end-message"><i class="fas fa-check-circle"></i> You've reached the end</span>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
                
            <?php else: ?>
                <div class="empty-inventory">
                    <i class="fas fa-box-open"></i>
                    <p>No inventory items yet</p>
                    <button class="empty-action" onclick="document.getElementById('addItemModal').style.display='flex'">Add Your First Item</button>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Add Item Modal -->
<div id="addItemModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3><i class="fas fa-plus-circle"></i> Add New Item</h3>
            <button class="modal-close" onclick="document.getElementById('addItemModal').style.display='none'">&times;</button>
        </div>
        <form method="post">
            <input type="hidden" name="add_item" value="1">
            <div class="modal-body">
                <div class="field">
                    <label>Item Name</label>
                    <input type="text" name="item_name" class="input" required>
                </div>
                <div class="field">
                    <label>Category</label>
                    <select name="category" class="input" required>
                        <option value="">Select Category</option>
                        <?php foreach ($business_categories[$business_type] as $cat): ?>
                            <option value="<?php echo $cat; ?>"><?php echo $cat; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="row">
                    <div class="field">
                        <label>Unit</label>
                        <select name="unit" class="input">
                            <option value="pcs">Piece (pcs)</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="box">Box</option>
                            <option value="dozen">Dozen</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Initial Stock</label>
                        <input type="number" name="quantity" class="input" value="5" min="1">
                    </div>
                </div>
                <div class="row">
                    <div class="field">
                        <label>Cost Price</label>
                        <input type="number" step="0.01" name="cost_price" class="input" placeholder="0.00" required>
                    </div>
                    <div class="field">
                        <label>Selling Price</label>
                        <input type="number" step="0.01" name="selling_price" class="input" placeholder="0.00" required>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="document.getElementById('addItemModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn-submit">Add Item</button>
            </div>
        </form>
    </div>
</div>

<!-- Purchase Modal -->
<div id="purchaseModal" class="modal">
    <div class="modal-content modal-small">
        <div class="modal-header">
            <h3><i class="fas fa-shopping-cart"></i> Purchase Stock</h3>
            <button class="modal-close" onclick="closePurchaseModal()">&times;</button>
        </div>
        <form method="post">
            <input type="hidden" name="purchase_stock" value="1">
            <input type="hidden" name="item_id" id="purchaseItemId">
            <div class="modal-body">
                <div class="field">
                    <label>Item</label>
                    <input type="text" id="purchaseItemName" class="input" readonly disabled>
                </div>
                <div class="field">
                    <label>Quantity to Add</label>
                    <input type="number" name="quantity" class="input" value="1" min="1" required>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closePurchaseModal()">Cancel</button>
                <button type="submit" class="btn-submit">Add Stock</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Item Modal -->
<div id="editItemModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Edit Item</h3>
            <button class="modal-close" onclick="closeEditItemModal()">&times;</button>
        </div>
        <form method="post">
            <input type="hidden" name="edit_item" value="1">
            <input type="hidden" name="item_id" id="editItemId">
            <div class="modal-body">
                <div class="field">
                    <label>Item Name</label>
                    <input type="text" name="item_name" id="editItemName" class="input" required>
                </div>
                <div class="field">
                    <label>Category</label>
                    <select name="category" id="editItemCategory" class="input" required>
                        <option value="">Select Category</option>
                        <?php foreach ($business_categories[$business_type] as $cat): ?>
                            <option value="<?php echo $cat; ?>"><?php echo $cat; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="row">
                    <div class="field">
                        <label>Unit</label>
                        <select name="unit" id="editItemUnit" class="input">
                            <option value="pcs">Piece (pcs)</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="box">Box</option>
                            <option value="dozen">Dozen</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Current Stock</label>
                        <input type="number" id="editItemStock" class="input" readonly disabled>
                    </div>
                </div>
                <div class="row">
                    <div class="field">
                        <label>Cost Price</label>
                        <input type="number" step="0.01" name="cost_price" id="editItemCost" class="input" required>
                    </div>
                    <div class="field">
                        <label>Selling Price</label>
                        <input type="number" step="0.01" name="selling_price" id="editItemPrice" class="input" required>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeEditItemModal()">Cancel</button>
                <button type="submit" class="btn-submit">Save Changes</button>
            </div>
        </form>
    </div>
</div>

<!-- Item Details Modal -->
<div id="itemDetailsModal" class="modal">
    <div class="modal-content modal-small">
        <div class="modal-header">
            <h3><i class="fas fa-info-circle"></i> Item Details</h3>
            <button class="modal-close" onclick="closeItemDetailsModal()">&times;</button>
        </div>
        <div class="modal-body" id="itemDetailsContent"></div>
    </div>
</div>

<style>
.inventory-page {
    padding: 16px;
    padding-bottom: 20px;
    background: var(--bg-canvas);
    min-height: 100vh;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.stat-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--border-color);
}

.stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: rgba(102, 153, 204, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 1.1rem;
}

.stat-content {
    flex: 1;
}

.stat-label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 4px;
}

.stat-number {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
}

.stat-number.danger {
    color: var(--danger);
}

/* Action Bar */
.action-bar {
    margin-bottom: 16px;
}

.add-item-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    border: none;
    border-radius: 44px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.add-item-btn:active {
    transform: scale(0.97);
}

/* Inventory Card */
.inventory-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.card-header {
    padding: 14px 16px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
}

.header-left i {
    color: var(--primary);
}

.badge {
    background: var(--bg-card);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-secondary);
}

/* Inventory List */
.inventory-list {
    padding-bottom: 20px;
}

/* Item Row */
.item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    transition: background 0.15s;
}

.item-row:hover {
    background: var(--bg-hover);
}

.item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 2;
    cursor: pointer;
}

.item-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.item-icon.good {
    background: rgba(16, 185, 129, 0.12);
    color: var(--success);
}

.item-icon.low {
    background: rgba(245, 158, 11, 0.12);
    color: var(--warning);
}

.item-icon.critical {
    background: rgba(239, 68, 68, 0.12);
    color: var(--danger);
}

.item-details {
    flex: 1;
}

.item-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.item-meta {
    font-size: 0.65rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
}

.dot {
    color: var(--border-color);
}

.item-stats {
    min-width: 100px;
    text-align: center;
}

.stock-indicator {
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    display: inline-block;
}

.stock-indicator.good {
    background: rgba(16, 185, 129, 0.12);
    color: var(--success);
}

.stock-indicator.low {
    background: rgba(245, 158, 11, 0.12);
    color: var(--warning);
}

.stock-indicator.critical {
    background: rgba(239, 68, 68, 0.12);
    color: var(--danger);
}

.stock-count {
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 4px;
}

.item-pricing {
    text-align: right;
    min-width: 85px;
}

.price {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary);
}

.margin {
    font-size: 0.6rem;
    color: var(--success);
}

.item-actions {
    display: flex;
    gap: 8px;
}

.action {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
}

.action.purchase {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.action.edit {
    background: rgba(102, 153, 204, 0.1);
    color: var(--primary);
}

.action.delete {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

/* Pagination */
.pagination-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-top: 1px solid var(--border-color);
}

.page-btn {
    padding: 8px 18px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 40px;
    color: var(--text-primary);
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.page-btn:active {
    transform: scale(0.96);
}

.page-number {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.end-message {
    font-size: 0.7rem;
    color: var(--success);
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Empty State */
.empty-inventory {
    text-align: center;
    padding: 48px 20px;
}

.empty-inventory i {
    font-size: 3rem;
    color: var(--text-muted);
    margin-bottom: 12px;
    opacity: 0.4;
}

.empty-inventory p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 16px;
}

.empty-action {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 40px;
    font-size: 0.8rem;
    cursor: pointer;
}

/* Modals */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1100;
}

.modal.show {
    display: flex;
}

.modal-content {
    background: var(--bg-card);
    border-radius: 28px;
    width: 90%;
    max-width: 400px;
    max-height: 85vh;
    overflow-y: auto;
    border: 1px solid var(--border-color);
}

.modal-small {
    max-width: 340px;
}

.modal-header {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
}

.modal-header h3 {
    font-size: 0.9rem;
    margin: 0;
}

.modal-header h3 i {
    color: var(--primary);
    margin-right: 8px;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.modal-body {
    padding: 16px;
}

.modal-footer {
    padding: 16px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.field {
    margin-bottom: 14px;
}

.field label {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: var(--text-secondary);
    margin-bottom: 6px;
}

.input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid var(--border-color);
    border-radius: 12px;
    font-size: 0.85rem;
    background: var(--bg-input);
    color: var(--text-primary);
}

.input:focus {
    outline: none;
    border-color: var(--primary);
}

.input:disabled {
    opacity: 0.6;
}

.row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.btn-cancel {
    padding: 10px 20px;
    border-radius: 40px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
}

.btn-submit {
    padding: 10px 20px;
    border-radius: 40px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border: none;
    color: white;
    font-weight: 600;
    cursor: pointer;
}

/* Detail Rows */
.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary);
}

.detail-value {
    font-size: 0.85rem;
    color: var(--text-primary);
}

.detail-value.positive {
    color: var(--success);
}

/* Responsive */
@media (max-width: 600px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
    
    .item-row {
        flex-wrap: wrap;
        gap: 12px;
    }
    
    .item-info {
        flex: 1;
        min-width: 55%;
    }
    
    .item-stats {
        order: 1;
    }
    
    .item-pricing {
        order: 2;
    }
    
    .item-actions {
        order: 3;
        width: 100%;
        justify-content: flex-end;
    }
    
    .row {
        grid-template-columns: 1fr;
        gap: 0;
    }
    
    .pagination-bar {
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .inventory-page {
        padding: 12px;
    }
    
    .stat-card {
        padding: 10px;
    }
    
    .stat-icon {
        width: 36px;
        height: 36px;
        font-size: 0.9rem;
    }
    
    .stat-number {
        font-size: 0.85rem;
    }
}
</style>

<script>
// Purchase modal
function openPurchaseModal(id, name) {
    document.getElementById('purchaseItemId').value = id;
    document.getElementById('purchaseItemName').value = name;
    document.getElementById('purchaseModal').style.display = 'flex';
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
}

// Edit item
function editItem(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.item_name;
    document.getElementById('editItemCategory').value = item.category;
    document.getElementById('editItemUnit').value = item.unit;
    document.getElementById('editItemStock').value = item.current_stock;
    document.getElementById('editItemCost').value = item.cost_price;
    document.getElementById('editItemPrice').value = item.selling_price;
    document.getElementById('editItemModal').style.display = 'flex';
}

function closeEditItemModal() {
    document.getElementById('editItemModal').style.display = 'none';
}

// Item details
function showItemDetails(item) {
    const currency = '<?php echo $currency; ?>';
    const profit = item.selling_price - item.cost_price;
    const margin = item.selling_price > 0 ? ((profit / item.selling_price) * 100).toFixed(1) : 0;
    const stockStatus = item.current_stock == 0 ? 'Out of Stock' : (item.current_stock <= 5 ? 'Low Stock' : 'In Stock');
    
    document.getElementById('itemDetailsContent').innerHTML = `
        <div class="detail-row"><span class="detail-label">Item Name</span><span class="detail-value">${escapeHtml(item.item_name)}</span></div>
        <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(item.category)}</span></div>
        <div class="detail-row"><span class="detail-label">Unit</span><span class="detail-value">${item.unit}</span></div>
        <div class="detail-row"><span class="detail-label">Current Stock</span><span class="detail-value">${item.current_stock}</span></div>
        <div class="detail-row"><span class="detail-label">Stock Status</span><span class="detail-value">${stockStatus}</span></div>
        <div class="detail-row"><span class="detail-label">Cost Price</span><span class="detail-value">${currency} ${parseFloat(item.cost_price).toFixed(2)}</span></div>
        <div class="detail-row"><span class="detail-label">Selling Price</span><span class="detail-value positive">${currency} ${parseFloat(item.selling_price).toFixed(2)}</span></div>
        <div class="detail-row"><span class="detail-label">Profit per Item</span><span class="detail-value positive">+${currency} ${profit.toFixed(2)}</span></div>
        <div class="detail-row"><span class="detail-label">Profit Margin</span><span class="detail-value positive">${margin}%</span></div>
    `;
    document.getElementById('itemDetailsModal').style.display = 'flex';
}

function closeItemDetailsModal() {
    document.getElementById('itemDetailsModal').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modals on escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePurchaseModal();
        closeEditItemModal();
        closeItemDetailsModal();
        document.getElementById('addItemModal').style.display = 'none';
    }
});

// Close modals on outside click
const modals = ['addItemModal', 'purchaseModal', 'editItemModal', 'itemDetailsModal'];
modals.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
});

// Auto-hide messages
setTimeout(() => {
    const msg = document.getElementById('successMessage');
    const err = document.getElementById('errorMessage');
    if (msg) msg.remove();
    if (err) err.remove();
}, 3000);
</script>



<?php include 'app_footer.php'; ?>