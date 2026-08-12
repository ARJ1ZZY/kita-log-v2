<?php
$is_app = strpos($_SERVER['HTTP_USER_AGENT'], 'KITA-LOG-APP') !== false;

if (session_status() === PHP_SESSION_NONE) { session_start(); }

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

require 'config/db.php';
require_once 'includes/config_helpers.php';

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT currency_symbol, date_format FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : config('currency', '₱');
$date_format = $settings ? $settings['date_format'] : config('date_format', 'Y-m-d');

function formatDate($date, $format) {
    if (empty($date)) return '-';
    $timestamp = strtotime($date);
    switch ($format) {
        case 'd-m-Y': return date('d-m-Y', $timestamp);
        case 'm/d/Y': return date('m/d/Y', $timestamp);
        case 'd/m/Y': return date('d/m/Y', $timestamp);
        default: return date('Y-m-d', $timestamp);
    }
}

function getGroupKey($date) {
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    
    if ($date == $today) return 'today';
    if ($date == $yesterday) return 'yesterday';
    if ($date >= $weekStart) return 'this_week';
    return 'older';
}

$preset_type = isset($_GET['type']) ? $_GET['type'] : '';
$is_ajax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

// Handle Add Transaction (POS)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_transaction'])) {
    $type = $_POST['type'] ?? '';
    $amount = $_POST['amount'] ?? '';
    $description = $_POST['description'] ?? '';
    $date = $_POST['date'] ?? '';
    $time = $_POST['time'] ?? date('H:i:s');
    $category_id = null;
    $inventory_item_id = null;
    $quantity = 1;
    $error = null;

    if ($type == 'expense') {
        $category_id = intval($_POST['category_id'] ?? 0);
        if ($category_id <= 0) $category_id = null;
    }

    if ($type == 'sale') {
        $inventory_item_id = intval($_POST['inventory_item_id'] ?? 0);
        $quantity = intval($_POST['quantity'] ?? 1);
    }

    if (empty($date) || empty($type)) {
        $error = 'Date and type are required.';
    } elseif ($type == 'expense' && (empty($amount) || $amount <= 0)) {
        $error = 'Please enter a valid amount.';
    } elseif ($type == 'sale' && empty($inventory_item_id)) {
        $error = 'Please select an item.';
    } else {
        try {
            if ($type == 'sale') {
                $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ? AND user_id = ?");
                $stmt->execute([$inventory_item_id, $user_id]);
                $item = $stmt->fetch();
                
                if ($item) {
                    $description = $item['item_name'];
                    $amount = $item['selling_price'] * $quantity;
                    
                    if ($item['current_stock'] < $quantity) {
                        $error = 'Not enough stock! Only ' . $item['current_stock'] . ' available.';
                    } else {
                        $stmt = $pdo->prepare("INSERT INTO sales (user_id, amount, description, sale_date, transaction_time) VALUES (?, ?, ?, ?, ?)");
                        $success = $stmt->execute([$user_id, $amount, $description, $date, $time]);
                        
                        if ($success) {
                            $new_stock = $item['current_stock'] - $quantity;
                            $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?")
                                ->execute([$new_stock, $inventory_item_id, $user_id]);
                            
                            if ($is_ajax) {
                                echo json_encode(['success' => true]);
                                exit;
                            }
                        }
                    }
                } else {
                    $error = 'Item not found.';
                }
            } else {
                $stmt = $pdo->prepare("INSERT INTO expenses (user_id, amount, description, expense_date, transaction_time, category_id) VALUES (?, ?, ?, ?, ?, ?)");
                $success = $stmt->execute([$user_id, $amount, $description, $date, $time, $category_id]);
                
                if ($success && $is_ajax) {
                    echo json_encode(['success' => true]);
                    exit;
                }
            }
        } catch (Exception $e) {
            $error = $e->getMessage();
        }
    }
    
    if ($is_ajax) {
        echo json_encode(['success' => false, 'error' => $error]);
        exit;
    }
}

// Handle Edit Transaction
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['edit_transaction'])) {
    $id = intval($_POST['id']);
    $type = $_POST['type'];
    $amount = floatval($_POST['amount']);
    $description = $_POST['description'];
    $date = $_POST['date'];
    $category_id = isset($_POST['category_id']) ? intval($_POST['category_id']) : null;
    
    try {
        if ($type == 'sale') {
            $stmt = $pdo->prepare("UPDATE sales SET amount = ?, description = ?, sale_date = ? WHERE id = ? AND user_id = ?");
            $success = $stmt->execute([$amount, $description, $date, $id, $user_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE expenses SET amount = ?, description = ?, expense_date = ?, category_id = ? WHERE id = ? AND user_id = ?");
            $success = $stmt->execute([$amount, $description, $date, $category_id, $id, $user_id]);
        }
        
        echo json_encode(['success' => $success]);
        exit;
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// Handle Get Transaction for Edit
if (isset($_GET['get_transaction'])) {
    $id = intval($_GET['id']);
    $type = $_GET['type'];
    
    try {
        if ($type == 'sale') {
            $stmt = $pdo->prepare("SELECT id, 'sale' as type, amount, description, sale_date as trans_date FROM sales WHERE id = ? AND user_id = ?");
        } else {
            $stmt = $pdo->prepare("SELECT id, 'expense' as type, amount, description, expense_date as trans_date, category_id FROM expenses WHERE id = ? AND user_id = ?");
        }
        $stmt->execute([$id, $user_id]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'transaction' => $transaction]);
        exit;
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// Get categories
if (isset($_GET['get_categories'])) {
    $stmt = $pdo->query("SELECT id, name FROM expense_categories ORDER BY name");
    $categories = $stmt->fetchAll();
    echo json_encode(['success' => true, 'categories' => $categories]);
    exit;
}

// Get POS items
if (isset($_GET['get_pos_items'])) {
    $stmt = $pdo->prepare("
        SELECT id, item_name, selling_price, current_stock, unit, category 
        FROM inventory_items 
        WHERE user_id = ? AND current_stock > 0 
        ORDER BY category, item_name
    ");
    $stmt->execute([$user_id]);
    $items = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'items' => $items, 'currency' => $currency]);
    exit;
}

// Get transactions data
function getTransactionsData($user_id, $pdo, $currency, $date_format) {
    $stmt = $pdo->prepare("
        (SELECT s.id as trans_id, 'sale' as type, s.sale_date as trans_date, s.amount, s.description, NULL as category_name 
         FROM sales s WHERE s.user_id = ?)
        UNION ALL
        (SELECT e.id as trans_id, 'expense' as type, e.expense_date as trans_date, e.amount, e.description, c.name as category_name 
         FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id WHERE e.user_id = ?)
        ORDER BY trans_date DESC LIMIT 50
    ");
    $stmt->execute([$user_id, $user_id]);
    $transactions = $stmt->fetchAll();
    
    $total_sales = 0;
    $total_expenses = 0;
    $grouped = ['today' => [], 'yesterday' => [], 'this_week' => [], 'older' => []];
    
    foreach ($transactions as $t) {
        if ($t['type'] == 'sale') {
            $total_sales += $t['amount'];
        } else {
            $total_expenses += $t['amount'];
        }
        
        $groupKey = getGroupKey($t['trans_date']);
        $grouped[$groupKey][] = $t;
    }
    
    return [
        'grouped' => $grouped,
        'total_sales' => $total_sales,
        'total_expenses' => $total_expenses,
        'net' => $total_sales - $total_expenses,
        'count' => count($transactions)
    ];
}

$data = getTransactionsData($user_id, $pdo, $currency, $date_format);
$grouped = $data['grouped'];
$transaction_count = $data['count'];

$current_page = 'transactions';
include 'app_header.php';
?>

<div class="transactions-page">
    <!-- POS CARD -->
    <div class="pos-card">
        <div class="card-header">
            <i class="fas fa-shopping-cart"></i> POS Sale
            <span class="pos-badge">Quick Sale</span>
        </div>
        <div class="card-body pos-body">
            <form method="post" id="posForm">
                <input type="hidden" name="add_transaction" value="1">
                <input type="hidden" name="type" value="sale">
                <input type="hidden" name="inventory_item_id" id="posItemId" value="">
                <input type="hidden" name="time" value="<?php echo date('H:i:s'); ?>">
                
                <div class="selected-item-area" id="selectedItemArea" style="display: none;">
                    <div class="selected-item-card">
                        <div class="selected-item-info">
                            <div class="selected-item-name" id="selectedItemName">-</div>
                            <div class="selected-item-price" id="selectedItemPrice"><?php echo $currency; ?>0.00</div>
                        </div>
                        <button type="button" class="clear-selection" onclick="clearSelectedItem()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="quantity-area" id="quantityArea" style="display: none;">
                    <label class="form-label">Quantity</label>
                    <div class="quantity-selector">
                        <button type="button" class="qty-btn" onclick="updateQuantity(-1)">-</button>
                        <input type="number" name="quantity" id="posQuantity" class="qty-input" value="1" min="1" readonly>
                        <button type="button" class="qty-btn" onclick="updateQuantity(1)">+</button>
                    </div>
                    <div class="subtotal-row">
                        <span>Subtotal:</span>
                        <span id="subtotalAmount"><?php echo $currency; ?>0.00</span>
                    </div>
                </div>
                
                <div class="date-area">
                    <label class="form-label">Sale Date</label>
                    <input type="date" name="date" class="pos-date-input" value="<?php echo date('Y-m-d'); ?>" required>
                </div>
                
                <button type="submit" class="pos-submit-btn" id="posSubmitBtn" disabled>
                    <i class="fas fa-check-circle"></i> Complete Sale
                </button>
            </form>
        </div>
    </div>

    <!-- POS ITEMS GRID -->
    <div class="pos-items-card">
        <div class="card-header">
            <i class="fas fa-boxes"></i> Select Item
            <span class="items-count" id="itemsCount">Loading...</span>
        </div>
        <div class="card-body pos-items-body">
            <div class="items-search">
                <i class="fas fa-search"></i>
                <input type="text" id="itemsSearch" placeholder="Search items..." class="search-input">
            </div>
            <div class="items-grid" id="itemsGrid">
                <div class="loading-spinner" id="posLoadingSpinner">
                    <i class="fas fa-spinner fa-spin"></i> Loading items...
                </div>
            </div>
        </div>
    </div>

    <!-- TRANSACTION HISTORY WITH SEARCH -->
    <div class="history-card">
        <div class="card-header collapsible" onclick="toggleHistory()">
            <div class="header-left">
                <i class="fas fa-history"></i> Transaction History
                <span class="count"><?php echo $transaction_count; ?></span>
            </div>
            <i class="fas fa-chevron-down" id="historyIcon"></i>
        </div>
        
        <div class="history-body" id="historyBody">
            <div class="search-filter-area">
                <div class="search-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" id="transactionSearch" class="search-filter-input" placeholder="Search by product, amount, or date...">
                    <button type="button" id="clearSearch" class="clear-search" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="filters">
                <button class="filter active" data-filter="all">All</button>
                <button class="filter" data-filter="sale">Sales</button>
                <button class="filter" data-filter="expense">Expenses</button>
            </div>
            
            <div class="txn-groups" id="txnGroups">
                <?php
                function renderGroup($title, $transactions, $currency, $date_format) {
                    if (count($transactions) == 0) return;
                    ?>
                    <div class="txn-group" data-group="<?php echo $title; ?>">
                        <div class="group-title"><?php echo $title; ?></div>
                        <?php foreach ($transactions as $t): 
                            $formatted_date = formatDate($t['trans_date'], $date_format);
                        ?>
                        <div class="txn-row" data-id="<?php echo $t['trans_id']; ?>" data-type="<?php echo $t['type']; ?>" data-name="<?php echo htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense')); ?>">
                            <div class="txn-info" onclick="showDetails(<?php echo $t['trans_id']; ?>, '<?php echo $t['type']; ?>', '<?php echo addslashes(htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense'))); ?>', <?php echo $t['amount']; ?>, '<?php echo $formatted_date; ?>', '<?php echo addslashes($t['category_name'] ?? ''); ?>')">
                                <div class="txn-badge <?php echo $t['type']; ?>">
                                    <?php echo $t['type'] == 'sale' ? 'Sale' : 'Expense'; ?>
                                </div>
                                <div class="txn-details">
                                    <div class="txn-name"><?php echo htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense')); ?></div>
                                    <?php if ($t['type'] == 'expense' && $t['category_name']): ?>
                                        <span class="txn-tag"><?php echo htmlspecialchars($t['category_name']); ?></span>
                                    <?php endif; ?>
                                    <div class="txn-date"><?php echo $formatted_date; ?></div>
                                </div>
                            </div>
                            <div class="txn-actions">
                                <div class="txn-amount <?php echo $t['type']; ?>">
                                    <?php echo $t['type'] == 'sale' ? '+' : '-'; ?> <?php echo $currency . number_format($t['amount'], 2); ?>
                                </div>
                                <div class="action-btns" onclick="event.stopPropagation()">
                                    <button class="edit-btn" onclick="editTransaction(<?php echo $t['trans_id']; ?>, '<?php echo $t['type']; ?>')"><i class="fas fa-edit"></i></button>
                                    <button class="delete-btn" onclick="deleteTransaction(<?php echo $t['trans_id']; ?>, '<?php echo $t['type']; ?>', '<?php echo addslashes(htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense'))); ?>')"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php
                }
                ?>
                <?php renderGroup('Today', $grouped['today'], $currency, $date_format); ?>
                <?php renderGroup('Yesterday', $grouped['yesterday'], $currency, $date_format); ?>
                <?php renderGroup('This Week', $grouped['this_week'], $currency, $date_format); ?>
                <?php renderGroup('Earlier', $grouped['older'], $currency, $date_format); ?>
            </div>
            <div class="no-results-message" id="noResultsMsg" style="display: none;">
                <i class="fas fa-search"></i>
                <p>No transactions match your search</p>
            </div>
        </div>
    </div>
</div>

<!-- Edit Modal -->
<div id="editModal" class="modal">
    <div class="modal-box">
        <div class="modal-head">
            <h3><i class="fas fa-edit"></i> Edit Transaction</h3>
            <button class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <div class="modal-content" id="editModalContent">
            <div class="loader"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
        </div>
    </div>
</div>

<!-- Details Modal -->
<div id="detailsModal" class="modal">
    <div class="modal-box modal-small">
        <div class="modal-head">
            <h3><i class="fas fa-info-circle"></i> Transaction Details</h3>
            <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
        </div>
        <div class="modal-content" id="detailsModalContent"></div>
    </div>
</div>

<style>
.transactions-page {
    padding: 16px;
    padding-bottom: 20px;
    min-height: 100vh;
}

.pos-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    margin-bottom: 16px;
    overflow: hidden;
}

.pos-badge {
    margin-left: auto;
    background: var(--success);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
}

.card-header {
    padding: 14px 16px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
}

.card-header i {
    color: var(--primary);
}

.card-body {
    padding: 16px;
}

.selected-item-area {
    margin-bottom: 16px;
}

.selected-item-card {
    background: linear-gradient(135deg, rgba(102, 153, 204, 0.1), rgba(74, 123, 168, 0.05));
    border: 1px solid var(--primary);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.selected-item-name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.selected-item-price {
    font-size: 0.85rem;
    color: var(--primary);
    font-weight: 600;
}

.clear-selection {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    background: rgba(239, 68, 68, 0.1);
    border: none;
    color: var(--danger);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-selection:active {
    transform: scale(0.94);
}

.quantity-area {
    margin-bottom: 16px;
}

.form-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.quantity-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.qty-btn {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--primary);
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qty-btn:active {
    transform: scale(0.94);
    background: var(--primary);
    color: white;
}

.qty-input {
    flex: 1;
    height: 48px;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 700;
    border: 1.5px solid var(--border-color);
    border-radius: 24px;
    background: var(--bg-input);
    color: var(--text-primary);
}

.subtotal-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--border-color);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
}

.subtotal-row span:last-child {
    font-size: 1.1rem;
    color: var(--primary);
}

.date-area {
    margin-bottom: 16px;
}

.pos-date-input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--border-color);
    border-radius: 14px;
    font-size: 0.9rem;
    background: var(--bg-input);
    color: var(--text-primary);
}

.pos-date-input:focus {
    outline: none;
    border-color: var(--primary);
}

.pos-submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--success), #0e9f6e);
    color: white;
    border: none;
    border-radius: 44px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.pos-submit-btn:active {
    transform: scale(0.97);
}

.pos-submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.pos-items-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    margin-bottom: 16px;
    overflow: hidden;
}

.items-count {
    margin-left: auto;
    background: var(--bg-card);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.pos-items-body {
    padding: 12px;
}

.items-search {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: 44px;
    padding: 8px 16px;
    margin-bottom: 16px;
}

.items-search i {
    color: var(--text-secondary);
}

.search-input {
    flex: 1;
    border: none;
    background: none;
    font-size: 0.85rem;
    outline: none;
    color: var(--text-primary);
}

.search-input::placeholder {
    color: var(--text-secondary);
}

.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
    max-height: 320px;
    overflow-y: auto;
    padding: 2px;
}

.pos-item-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 100px;
    display: flex;
    flex-direction: column;
}

.pos-item-card:active {
    transform: scale(0.97);
    background: var(--bg-hover);
}

.pos-item-card.selected {
    border-color: var(--primary);
    background: rgba(102, 153, 204, 0.1);
    box-shadow: 0 0 0 2px rgba(102, 153, 204, 0.2);
}

.pos-item-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 6px;
    line-height: 1.3;
    word-break: break-word;
}

.pos-item-price {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 8px;
}

.pos-item-stock {
    font-size: 0.6rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
}

.pos-item-stock.low {
    color: var(--warning);
}

.pos-item-stock.critical {
    color: var(--danger);
}

.loading-spinner {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
}

.loading-spinner i {
    font-size: 1.5rem;
    margin-bottom: 8px;
}

.history-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.collapsible {
    cursor: pointer;
}

.collapsible:active {
    background: var(--bg-hover);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.count {
    background: var(--bg-card);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.history-body {
    transition: max-height 0.3s ease;
    overflow: hidden;
}

.history-body.collapsed {
    max-height: 0 !important;
}

.search-filter-area {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}

.search-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: 44px;
    padding: 10px 16px;
}

.search-wrapper i {
    color: var(--text-secondary);
}

.search-filter-input {
    flex: 1;
    border: none;
    background: none;
    font-size: 0.85rem;
    outline: none;
    color: var(--text-primary);
}

.search-filter-input::placeholder {
    color: var(--text-secondary);
}

.clear-search {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-search:active {
    transform: scale(0.94);
}

.filters {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}

.filter {
    padding: 6px 16px;
    border-radius: 30px;
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}

.filter:active {
    transform: scale(0.95);
}

.filter.active {
    background: var(--primary);
    border-color: transparent;
    color: white;
}

.txn-group {
    margin-bottom: 4px;
}

.group-title {
    padding: 8px 16px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    background: rgba(0,0,0,0.02);
    border-bottom: 1px solid var(--border-color);
}

.txn-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    transition: background 0.15s;
}

.txn-row:hover {
    background: var(--bg-hover);
}

.txn-row.hidden {
    display: none;
}

.txn-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    cursor: pointer;
}

.txn-badge {
    padding: 4px 10px;
    border-radius: 30px;
    font-size: 0.6rem;
    font-weight: 700;
    min-width: 60px;
    text-align: center;
}

.txn-badge.sale {
    background: rgba(16, 185, 129, 0.12);
    color: var(--success);
}

.txn-badge.expense {
    background: rgba(239, 68, 68, 0.12);
    color: var(--danger);
}

.txn-details {
    flex: 1;
}

.txn-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.txn-tag {
    font-size: 0.6rem;
    padding: 2px 6px;
    background: var(--bg-secondary);
    border-radius: 12px;
    color: var(--text-secondary);
    display: inline-block;
    margin-right: 6px;
}

.txn-date {
    font-size: 0.6rem;
    color: var(--text-muted);
}

.txn-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.txn-amount {
    font-size: 0.85rem;
    font-weight: 700;
    min-width: 85px;
    text-align: right;
}

.txn-amount.sale {
    color: var(--success);
}

.txn-amount.expense {
    color: var(--danger);
}

.action-btns {
    display: flex;
    gap: 6px;
}

.action-btns button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
}

.edit-btn {
    background: rgba(102, 153, 204, 0.1);
    color: var(--primary);
}

.delete-btn {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.no-results-message {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);
}

.no-results-message i {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.5;
}

.no-results-message p {
    font-size: 0.85rem;
    margin: 0;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1100;
}

.modal.show {
    display: flex;
}

.modal-box {
    background: var(--bg-card);
    border-radius: 28px;
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    border: 1px solid var(--border-color);
}

.modal-small {
    max-width: 340px;
}

.modal-head {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
}

.modal-head h3 {
    font-size: 0.9rem;
    margin: 0;
}

.modal-head h3 i {
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

.modal-content {
    padding: 16px;
}

.loader {
    text-align: center;
    padding: 40px;
    color: var(--primary);
}

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

.detail-value.negative {
    color: var(--danger);
}

.modal-footer {
    display: flex;
    gap: 12px;
    margin-top: 20px;
}

.modal-cancel {
    flex: 1;
    padding: 10px;
    border-radius: 40px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    cursor: pointer;
}

.modal-save {
    flex: 1;
    padding: 10px;
    border-radius: 40px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border: none;
    color: white;
    cursor: pointer;
}

@media (max-width: 480px) {
    .transactions-page {
        padding: 12px;
        padding-bottom: 20px;
    }
    
    .items-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 8px;
    }
    
    .pos-item-card {
        padding: 10px;
        min-height: 90px;
    }
    
    .pos-item-name {
        font-size: 0.8rem;
    }
    
    .qty-btn {
        width: 42px;
        height: 42px;
    }
    
    .txn-row {
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .txn-info {
        flex: 1;
        min-width: 55%;
    }
    
    .txn-actions {
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
    }
    
    .search-wrapper {
        padding: 8px 14px;
    }
}
</style>

<script>
// POS System
let currentItem = null;
let currentQuantity = 1;
let currency = '<?php echo $currency; ?>';

document.addEventListener('DOMContentLoaded', function() {
    loadPosItems();
    setupSearchFilter();
});

function loadPosItems() {
    const spinner = document.getElementById('posLoadingSpinner');
    if (spinner) spinner.style.display = 'block';
    
    fetch('ajax/get_pos_items.php')
        .then(response => response.json())
        .then(data => {
            if (spinner) spinner.style.display = 'none';
            
            if (data.success) {
                renderItemsGrid(data.items);
                document.getElementById('itemsCount').innerText = data.items.length + ' items';
            } else {
                document.getElementById('itemsGrid').innerHTML = '<div class="loading-spinner"><i class="fas fa-exclamation-circle"></i><br>Failed to load items</div>';
            }
        })
        .catch(error => {
            if (spinner) spinner.style.display = 'none';
            console.error('Error:', error);
            document.getElementById('itemsGrid').innerHTML = '<div class="loading-spinner"><i class="fas fa-exclamation-circle"></i><br>Error loading items</div>';
        });
}

function renderItemsGrid(items) {
    const grid = document.getElementById('itemsGrid');
    if (!items.length) {
        grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-box-open"></i><br>No items in inventory</div>';
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="pos-item-card" onclick="selectItem(${item.id}, '${escapeHtml(item.item_name)}', ${item.selling_price}, ${item.current_stock})">
            <div class="pos-item-name">${escapeHtml(item.item_name)}</div>
            <div class="pos-item-price">${currency} ${parseFloat(item.selling_price).toFixed(2)}</div>
            <div class="pos-item-stock ${item.current_stock <= 5 ? (item.current_stock == 0 ? 'critical' : 'low') : ''}">
                <i class="fas fa-box"></i> Stock: ${item.current_stock} ${item.unit}
            </div>
        </div>
    `).join('');
    
    const searchInput = document.getElementById('itemsSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.pos-item-card').forEach(card => {
                const name = card.querySelector('.pos-item-name').innerText.toLowerCase();
                card.style.display = name.includes(term) ? 'flex' : 'none';
            });
        });
    }
}

function selectItem(id, name, price, stock) {
    if (stock <= 0) {
        alert('Item is out of stock!');
        return;
    }
    
    currentItem = { id, name, price, stock };
    currentQuantity = 1;
    
    document.getElementById('posItemId').value = id;
    document.getElementById('selectedItemName').innerText = name;
    document.getElementById('selectedItemPrice').innerHTML = `${currency} ${price.toFixed(2)}`;
    document.getElementById('selectedItemArea').style.display = 'block';
    document.getElementById('quantityArea').style.display = 'block';
    document.getElementById('posQuantity').value = 1;
    updateSubtotal();
    document.getElementById('posSubmitBtn').disabled = false;
    
    document.querySelectorAll('.pos-item-card').forEach(card => card.classList.remove('selected'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }
}

function clearSelectedItem() {
    currentItem = null;
    document.getElementById('posItemId').value = '';
    document.getElementById('selectedItemArea').style.display = 'none';
    document.getElementById('quantityArea').style.display = 'none';
    document.getElementById('posSubmitBtn').disabled = true;
    document.querySelectorAll('.pos-item-card').forEach(card => card.classList.remove('selected'));
}

function updateQuantity(delta) {
    if (!currentItem) return;
    let newQty = currentQuantity + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > currentItem.stock) {
        alert(`Only ${currentItem.stock} item(s) available`);
        return;
    }
    currentQuantity = newQty;
    document.getElementById('posQuantity').value = currentQuantity;
    updateSubtotal();
}

function updateSubtotal() {
    if (!currentItem) return;
    document.getElementById('subtotalAmount').innerHTML = `${currency} ${(currentItem.price * currentQuantity).toFixed(2)}`;
}

document.getElementById('posForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentItem) {
        alert('Please select an item first');
        return;
    }
    
    const formData = new FormData(this);
    formData.set('quantity', currentQuantity);
    
    fetch(window.location.href, {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || 'Error processing sale');
        }
    })
    .catch(() => alert('Error processing sale'));
});

// Search & Filter
function setupSearchFilter() {
    const searchInput = document.getElementById('transactionSearch');
    const clearBtn = document.getElementById('clearSearch');
    const filterBtns = document.querySelectorAll('.filter');
    let currentFilter = 'all';
    let currentSearch = '';
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase().trim();
            if (clearBtn) clearBtn.style.display = currentSearch ? 'flex' : 'none';
            applyFilters(currentFilter, currentSearch);
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            currentSearch = '';
            clearBtn.style.display = 'none';
            applyFilters(currentFilter, currentSearch);
            if (searchInput) searchInput.focus();
        });
    }
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            applyFilters(currentFilter, currentSearch);
        });
    });
}

function applyFilters(filter, search) {
    const rows = document.querySelectorAll('.txn-row');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const type = row.dataset.type;
        const name = (row.dataset.name || '').toLowerCase();
        const amount = parseFloat(row.querySelector('.txn-amount')?.innerText?.replace(/[^0-9.-]/g, '') || 0);
        
        let typeMatch = filter === 'all' || (filter === 'sale' && type === 'sale') || (filter === 'expense' && type === 'expense');
        
        let searchMatch = true;
        if (search) {
            searchMatch = name.includes(search) || amount.toString().includes(search);
        }
        
        const isVisible = typeMatch && searchMatch;
        if (isVisible) visibleCount++;
        row.classList.toggle('hidden', !isVisible);
    });
    
    document.querySelectorAll('.txn-group').forEach(group => {
        const hasVisible = group.querySelectorAll('.txn-row:not(.hidden)').length > 0;
        group.style.display = hasVisible ? 'block' : 'none';
    });
    
    const noResults = document.getElementById('noResultsMsg');
    if (noResults) {
        noResults.style.display = (visibleCount === 0 && document.querySelectorAll('.txn-row').length > 0) ? 'block' : 'none';
    }
}

// ============================================
// DELETE FUNCTION - SIMPLE DIRECT APPROACH
// ============================================

function deleteTransaction(id, type, name) {
    if (!confirm(`⚠️ Delete "${name}"?\n\nStock will be restored automatically.`)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('id', id);
    formData.append('type', type);
    
    fetch('ajax/delete_sale.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✓ Transaction deleted! Stock restored.');
            location.reload();
        } else {
            alert('✗ Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Network error. Please refresh and try again.');
    });
}

// Edit Transaction
function editTransaction(id, type) {
    document.getElementById('editModal').classList.add('show');
    
    fetch(`${window.location.href}?get_transaction=1&id=${id}&type=${type}`)
        .then(r => r.json())
        .then(data => {
            if (data.success) renderEditForm(data.transaction);
            else document.getElementById('editModalContent').innerHTML = '<div class="loader">Error</div>';
        });
}

function renderEditForm(txn) {
    if (txn.type === 'expense') {
        fetch(`${window.location.href}?get_categories=1`)
            .then(r => r.json())
            .then(data => {
                let opts = '<option value="">Select Category</option>';
                if (data.categories) {
                    data.categories.forEach(c => {
                        opts += `<option value="${c.id}" ${c.id == txn.category_id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`;
                    });
                }
                buildEditForm(txn, opts);
            });
    } else {
        buildEditForm(txn, '');
    }
}

function buildEditForm(txn, catOpts) {
    document.getElementById('editModalContent').innerHTML = `
        <form id="editForm">
            <input type="hidden" name="edit_transaction" value="1">
            <input type="hidden" name="id" value="${txn.id}">
            <input type="hidden" name="type" value="${txn.type}">
            <div class="form-group">
                <label class="form-label">Amount (${currency})</label>
                <input type="number" step="0.01" name="amount" class="app-input" value="${txn.amount}" required>
            </div>
            ${txn.type === 'expense' ? `<div class="form-group"><label class="form-label">Category</label><select name="category_id" class="app-input">${catOpts}</select></div>` : ''}
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" name="description" class="app-input" value="${escapeHtml(txn.description || '')}">
            </div>
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" name="date" class="app-input" value="${txn.trans_date}" required>
            </div>
            <div class="modal-footer">
                <button type="button" class="modal-cancel" onclick="closeEditModal()">Cancel</button>
                <button type="submit" class="modal-save">Save</button>
            </div>
        </form>
    `;
    document.getElementById('editForm').onsubmit = function(e) {
        e.preventDefault();
        const fd = new FormData(this);
        fetch(window.location.href, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json())
            .then(data => { if (data.success) { closeEditModal(); location.reload(); } else alert('Error'); });
    };
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

// Details Modal
function showDetails(id, type, name, amount, date, category) {
    document.getElementById('detailsModalContent').innerHTML = `
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${type === 'sale' ? 'Sale' : 'Expense'}</span></div>
        <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(name)}</span></div>
        ${category ? `<div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(category)}</span></div>` : ''}
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value ${type === 'sale' ? 'positive' : 'negative'}">${type === 'sale' ? '+' : '-'} ${currency} ${parseFloat(amount).toFixed(2)}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${date}</span></div>
    `;
    document.getElementById('detailsModal').classList.add('show');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('show');
}

// Utilities
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleHistory() {
    const body = document.getElementById('historyBody');
    const icon = document.getElementById('historyIcon');
    if (body && icon) {
        body.classList.toggle('collapsed');
        icon.style.transform = body.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDetailsModal();
    }
});

document.getElementById('editModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeEditModal(); });
document.getElementById('detailsModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeDetailsModal(); });

document.getElementById('historyBody')?.classList.remove('collapsed');
</script>

<?php include 'app_footer.php'; ?>