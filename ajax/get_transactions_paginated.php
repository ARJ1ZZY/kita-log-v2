<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];

// Get user settings for currency and date format
$stmt = $pdo->prepare("SELECT currency_symbol, date_format FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : '$';
$date_format = $settings ? $settings['date_format'] : 'Y-m-d';

// Helper function for date formatting
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

$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

// Filter values - SANITIZED
$type_filters = isset($_GET['type']) ? $_GET['type'] : [];
if (!is_array($type_filters)) {
    $type_filters = [$type_filters];
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';

// Validate dates
if (!empty($start_date) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
    $start_date = '';
}
if (!empty($end_date) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
    $end_date = '';
}

// Get total count for pagination using prepared statements
$count_parts = [];
$count_params = [':user_id' => $user_id];

if (in_array('sale', $type_filters) || empty($type_filters)) {
    $sale_count_sql = "SELECT id FROM sales WHERE user_id = :user_id";
    if (!empty($search)) {
        $sale_count_sql .= " AND description LIKE :search";
        $count_params[':search'] = "%$search%";
    }
    if (!empty($start_date)) {
        $sale_count_sql .= " AND sale_date >= :start_date";
        $count_params[':start_date'] = $start_date;
    }
    if (!empty($end_date)) {
        $sale_count_sql .= " AND sale_date <= :end_date";
        $count_params[':end_date'] = $end_date;
    }
    $count_parts[] = $sale_count_sql;
}

if (in_array('expense', $type_filters) || empty($type_filters)) {
    $expense_count_sql = "SELECT id FROM expenses WHERE user_id = :user_id";
    if (!empty($search)) {
        $expense_count_sql .= " AND description LIKE :search";
        // search already bound above, rebind for expense
    }
    if (!empty($start_date)) {
        $expense_count_sql .= " AND expense_date >= :start_date";
    }
    if (!empty($end_date)) {
        $expense_count_sql .= " AND expense_date <= :end_date";
    }
    $count_parts[] = $expense_count_sql;
}

if (empty($count_parts)) {
    $total_records = 0;
} else {
    $count_sql = implode(" UNION ALL ", $count_parts);
    $count_stmt = $pdo->prepare("SELECT COUNT(*) as total FROM ($count_sql) as combined");
    foreach ($count_params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }
    $count_stmt->execute();
    $total_records = $count_stmt->fetch()['total'];
}

$total_pages = ceil($total_records / $limit);

// Get transactions using prepared statements
$data_parts = [];
$data_params = [':user_id' => $user_id];

if (in_array('sale', $type_filters) || empty($type_filters)) {
    $sale_sql = "SELECT 
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
    
    if (!empty($search)) {
        $sale_sql .= " AND description LIKE :search";
        $data_params[':search'] = "%$search%";
    }
    if (!empty($start_date)) {
        $sale_sql .= " AND sale_date >= :start_date";
        $data_params[':start_date'] = $start_date;
    }
    if (!empty($end_date)) {
        $sale_sql .= " AND sale_date <= :end_date";
        $data_params[':end_date'] = $end_date;
    }
    
    $data_parts[] = $sale_sql;
}

if (in_array('expense', $type_filters) || empty($type_filters)) {
    $expense_sql = "SELECT 
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
    
    if (!empty($search)) {
        $expense_sql .= " AND e.description LIKE :search";
        // search already bound
    }
    if (!empty($start_date)) {
        $expense_sql .= " AND e.expense_date >= :start_date";
    }
    if (!empty($end_date)) {
        $expense_sql .= " AND e.expense_date <= :end_date";
    }
    
    $data_parts[] = $expense_sql;
}

if (empty($data_parts)) {
    echo '<p class="text-muted text-center py-4">No transactions found.</p>';
    exit;
}

$combined_sql = implode(' UNION ALL ', $data_parts);
$combined_sql .= " ORDER BY trans_date DESC, trans_time DESC LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($combined_sql);
foreach ($data_params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$transactions = $stmt->fetchAll();

// Output HTML table
if (count($transactions) > 0): ?>
    <div class="table-responsive">
        <table class="table-transactions">
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
                <?php foreach ($transactions as $t): 
                    $formatted_date = formatDate($t['trans_date'], $date_format);
                ?>
                <tr>
                    <td><?php echo htmlspecialchars($formatted_date); ?></td>
                    <td><?php echo $t['trans_time'] ? date('h:i A', strtotime($t['trans_time'])) : '-'; ?></td>
                    <td>
                        <span class="<?php echo $t['type'] == 'sale' ? 'badge-sale' : 'badge-expense'; ?>">
                            <?php echo ucfirst($t['type']); ?>
                        </span>
                    </td>
                    <td class="fw-bold <?php echo $t['type'] == 'sale' ? 'text-success' : 'text-danger'; ?>">
                        <?php echo $t['type'] == 'sale' ? '+' : '-'; ?>
                        <?php echo $currency . ' ' . number_format($t['amount'], 2); ?>
                    </td>
                    <td><?php echo htmlspecialchars($t['category_name'] ?? '-'); ?></td>
                    <td><?php echo htmlspecialchars($t['description']); ?></td>
                    <td>
                        <button class="action-btn action-btn-edit edit-transaction" data-id="<?php echo $t['id']; ?>" data-type="<?php echo $t['type']; ?>">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn action-btn-delete delete-transaction" data-id="<?php echo $t['id']; ?>" data-type="<?php echo $t['type']; ?>">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <?php if ($total_pages > 1): ?>
    <ul class="pagination">
        <?php if ($page > 1): ?>
            <li class="page-item">
                <a href="#" class="page-link" data-page="1">&laquo;&laquo;</a>
            </li>
            <li class="page-item">
                <a href="#" class="page-link" data-page="<?php echo $page - 1; ?>">&laquo;</a>
            </li>
        <?php else: ?>
            <li class="page-item disabled">
                <span class="page-link">&laquo;&laquo;</span>
            </li>
            <li class="page-item disabled">
                <span class="page-link">&laquo;</span>
            </li>
        <?php endif; ?>

        <?php
        $start_page = max(1, $page - 2);
        $end_page = min($total_pages, $page + 2);
        
        for ($i = $start_page; $i <= $end_page; $i++): ?>
            <li class="page-item <?php echo $i == $page ? 'active' : ''; ?>">
                <a href="#" class="page-link" data-page="<?php echo $i; ?>"><?php echo $i; ?></a>
            </li>
        <?php endfor; ?>

        <?php if ($page < $total_pages): ?>
            <li class="page-item">
                <a href="#" class="page-link" data-page="<?php echo $page + 1; ?>">&raquo;</a>
            </li>
            <li class="page-item">
                <a href="#" class="page-link" data-page="<?php echo $total_pages; ?>">&raquo;&raquo;</a>
            </li>
        <?php else: ?>
            <li class="page-item disabled">
                <span class="page-link">&raquo;</span>
            </li>
            <li class="page-item disabled">
                <span class="page-link">&raquo;&raquo;</span>
            </li>
        <?php endif; ?>
    </ul>
    <?php endif; ?>

<?php else: ?>
    <p class="text-muted text-center py-4">No transactions found.</p>
<?php endif; ?>