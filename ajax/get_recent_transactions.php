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
    $timestamp = strtotime($date);
    switch ($format) {
        case 'd-m-Y': return date('d-m-Y', $timestamp);
        case 'm/d/Y': return date('m/d/Y', $timestamp);
        case 'd/m/Y': return date('d/m/Y', $timestamp);
        default: return date('Y-m-d', $timestamp);
    }
}

// Get recent 10 transactions
$stmt = $pdo->prepare("
    (SELECT 
        'sale' as type, 
        sale_date as trans_date, 
        amount, 
        description, 
        NULL as category_name 
    FROM sales 
    WHERE user_id = ?)
    UNION ALL
    (SELECT 
        'expense' as type, 
        expense_date as trans_date, 
        amount, 
        description, 
        c.name as category_name 
    FROM expenses e 
    LEFT JOIN expense_categories c ON e.category_id = c.id 
    WHERE e.user_id = ?)
    ORDER BY trans_date DESC 
    LIMIT 10
");
$stmt->execute([$user_id, $user_id]);
$transactions = $stmt->fetchAll();

if (count($transactions) > 0): ?>
    <?php foreach ($transactions as $t): 
        $formatted_date = formatDate($t['trans_date'], $date_format);
    ?>
    <div class="transaction-row">
        <span class="transaction-date"><?php echo $formatted_date; ?></span>
        <span class="transaction-type">
            <span class="badge-<?php echo $t['type']; ?>">
                <?php echo ucfirst($t['type']); ?>
            </span>
        </span>
        <span class="transaction-description">
            <?php echo htmlspecialchars($t['description'] ?: ($t['category_name'] ?? '')); ?>
        </span>
        <span class="transaction-amount <?php echo $t['type'] == 'sale' ? 'amount-positive' : 'amount-negative'; ?>">
            <?php echo $t['type'] == 'sale' ? '+' : '-'; ?>
            <?php echo $currency . ' ' . number_format($t['amount'], 2); ?>
        </span>
    </div>
    <?php endforeach; ?>
<?php else: ?>
    <div class="text-center py-4">
        <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
        <p class="text-muted">No transactions yet</p>
        <a href="transactions.php" class="btn btn-primary btn-sm">Add Transaction</a>
    </div>
<?php endif; ?>