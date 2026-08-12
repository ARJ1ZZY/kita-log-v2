<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];
$current_month = date('Y-m-01');

// Get user settings for currency
$stmt = $pdo->prepare("SELECT currency_symbol FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : '$';

// Get overall budget for current month
$stmt = $pdo->prepare("SELECT * FROM budgets WHERE user_id = ? AND month = ? AND category_id IS NULL");
$stmt->execute([$user_id, $current_month]);
$overall = $stmt->fetch();

// Get total spent this month
$month_end = date('Y-m-t', strtotime($current_month));
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $current_month, $month_end]);
$total_spent = $stmt->fetch()['total'];

if ($overall): 
    $percentage = $overall['amount'] > 0 ? min(100, round(($total_spent / $overall['amount']) * 100)) : 0;
    $progress_class = $percentage >= 100 ? 'bg-danger' : ($percentage >= 80 ? 'bg-warning' : 'bg-success');
?>
    <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-bold">Overall Budget</span>
        <span><?php echo $currency . number_format($total_spent, 0); ?> / <?php echo $currency . number_format($overall['amount'], 0); ?></span>
    </div>
    <div class="progress mb-3" style="height: 8px;">
        <div class="progress-bar <?php echo $progress_class; ?>" style="width: <?php echo $percentage; ?>%;"></div>
    </div>
    <p class="text-muted small mb-0"><?php echo $percentage; ?>% of monthly budget used</p>
<?php else: ?>
    <p class="text-muted text-center py-3">No budget set for this month</p>
<?php endif; ?>