<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/includes/config_helpers.php';

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT currency_symbol, date_format FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : config('currency', '₱');
$date_format = $settings ? $settings['date_format'] : config('date_format', 'Y-m-d');

function formatDateLocal($date, $format) {
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
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

$stmt = $pdo->prepare("
    (SELECT s.id as trans_id, 'sale' as type, s.sale_date as trans_date, s.amount, s.description, NULL as category_name 
     FROM sales s WHERE s.user_id = ?)
    UNION ALL
    (SELECT e.id as trans_id, 'expense' as type, e.expense_date as trans_date, e.amount, e.description, c.name as category_name 
     FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id WHERE e.user_id = ?)
    ORDER BY trans_date DESC LIMIT ? OFFSET ?
");
$stmt->execute([$user_id, $user_id, $limit, $offset]);
$transactions = $stmt->fetchAll();

$stmt = $pdo->prepare("
    SELECT COUNT(*) as total FROM (
        SELECT id FROM sales WHERE user_id = ?
        UNION ALL
        SELECT id FROM expenses WHERE user_id = ?
    ) as combined
");
$stmt->execute([$user_id, $user_id]);
$total_count = $stmt->fetch()['total'];
$total_pages = ceil($total_count / $limit);
?>
<div class="transactions-list">
    <?php if (count($transactions) > 0): ?>
        <?php foreach ($transactions as $t): 
            $formatted_date = formatDateLocal($t['trans_date'], $date_format);
            $amount_class = $t['type'] == 'sale' ? 'positive' : 'negative';
            $amount_sign = $t['type'] == 'sale' ? '+' : '-';
            $icon = $t['type'] == 'sale' ? 'fa-shopping-cart' : 'fa-receipt';
        ?>
        <div class="transaction-card" data-id="<?php echo $t['trans_id']; ?>" data-type="<?php echo $t['type']; ?>" data-description="<?php echo htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense')); ?>" data-amount="<?php echo $t['amount']; ?>" data-date="<?php echo $t['trans_date']; ?>">
            <div class="transaction-left">
                <div class="transaction-icon-circle <?php echo $t['type']; ?>">
                    <i class="fas <?php echo $icon; ?>"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-description"><?php echo htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense')); ?></div>
                    <div class="transaction-date"><?php echo $formatted_date; ?></div>
                </div>
            </div>
            <div class="transaction-right">
                <div class="transaction-amount <?php echo $amount_class; ?>">
                    <?php echo $amount_sign . $currency . number_format($t['amount'], 2); ?>
                </div>
                <button class="transaction-menu-btn" onclick="showActionSheet(<?php echo $t['trans_id']; ?>, '<?php echo $t['type']; ?>', '<?php echo addslashes($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense')); ?>', <?php echo $t['amount']; ?>, '<?php echo $t['trans_date']; ?>')">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
        <?php endforeach; ?>
        
        <?php if ($total_pages > 1): ?>
        <div class="pagination-container">
            <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                <a href="?page=<?php echo $i; ?>#transactions-list" class="pagination-btn <?php echo $i == $page ? 'active' : ''; ?>" data-page="<?php echo $i; ?>"><?php echo $i; ?></a>
            <?php endfor; ?>
        </div>
        <?php endif; ?>
    <?php else: ?>
        <div class="empty-transactions">
            <i class="fas fa-receipt"></i>
            <p>No transactions found</p>
        </div>
    <?php endif; ?>
</div>