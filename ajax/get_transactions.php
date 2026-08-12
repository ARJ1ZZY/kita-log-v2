<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];
$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

// Filter values
$type_filters = $_GET['type'] ?? [];
if (!is_array($type_filters)) {
    $type_filters = [$type_filters];
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$start_date = $_GET['start_date'] ?? '';
$end_date = $_GET['end_date'] ?? '';

// Get user settings for currency
$stmt = $pdo->prepare("SELECT currency_symbol FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : '$';

// Build queries
$params = [':user_id' => $user_id];

// Sales query
$sales_sql = "SELECT 
                id, 
                'sale' as type, 
                sale_date as trans_date, 
                transaction_time as trans_time,
                amount, 
                description, 
                NULL as category_name,
                NULL as category_id
              FROM sales 
              WHERE user_id = :user_id";

// Expenses query with category join
$expenses_sql = "SELECT 
                    e.id, 
                    'expense' as type, 
                    e.expense_date as trans_date, 
                    e.transaction_time as trans_time,
                    e.amount, 
                    e.description, 
                    c.name as category_name,
                    e.category_id
                 FROM expenses e 
                 LEFT JOIN expense_categories c ON e.category_id = c.id 
                 WHERE e.user_id = :user_id";

// Apply search filter
if (!empty($search)) {
    $sales_sql .= " AND description LIKE :search";
    $expenses_sql .= " AND e.description LIKE :search";
    $params[':search'] = "%$search%";
}

// Apply date filters
if (!empty($start_date)) {
    $sales_sql .= " AND sale_date >= :start_date";
    $expenses_sql .= " AND e.expense_date >= :start_date";
    $params[':start_date'] = $start_date;
}
if (!empty($end_date)) {
    $sales_sql .= " AND sale_date <= :end_date";
    $expenses_sql .= " AND e.expense_date <= :end_date";
    $params[':end_date'] = $end_date;
}

// Build combined query based on selected types
$parts = [];
if (in_array('sale', $type_filters) || empty($type_filters)) {
    $parts[] = $sales_sql;
}
if (in_array('expense', $type_filters) || empty($type_filters)) {
    $parts[] = $expenses_sql;
}

if (count($parts) == 0) {
    echo '<p class="text-muted mb-0">No transaction types selected.</p>';
    exit;
}

$combined_sql = implode(' UNION ALL ', $parts);
$combined_sql .= " ORDER BY trans_date DESC, trans_time DESC LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($combined_sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$transactions = $stmt->fetchAll();

// Output HTML table
if (count($transactions) > 0): ?>
    <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($transactions as $t): ?>
                <tr>
                    <td><?php echo htmlspecialchars($t['trans_date']); ?></td>
                    <td><?php echo $t['trans_time'] ? date('h:i A', strtotime($t['trans_time'])) : '-'; ?></td>
                    <td><span class="badge bg-<?php echo $t['type'] == 'sale' ? 'primary' : 'warning'; ?>"><?php echo ucfirst($t['type']); ?></span></td>
                    <td><?php echo $currency . ' ' . number_format($t['amount'], 2); ?></td>
                    <td><?php echo htmlspecialchars($t['category_name'] ?? '-'); ?></td>
                    <td><?php echo htmlspecialchars($t['description']); ?></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary py-0 me-1 edit-transaction" data-id="<?php echo $t['id']; ?>" data-type="<?php echo $t['type']; ?>">Edit</button>
                        <button class="btn btn-sm btn-outline-danger py-0 delete-transaction" data-id="<?php echo $t['id']; ?>" data-type="<?php echo $t['type']; ?>">Delete</button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php else: ?>
    <p class="text-muted mb-0">No transactions found.</p>
<?php endif; ?>