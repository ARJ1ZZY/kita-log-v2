<?php
$is_app = strpos($_SERVER['HTTP_USER_AGENT'], 'KITA-LOG-APP') !== false;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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

$current_month = date('Y-m-01');
$month_end = date('Y-m-t');

// Get overall budget
$stmt = $pdo->prepare("SELECT * FROM budgets WHERE user_id = ? AND month = ? AND category_id IS NULL");
$stmt->execute([$user_id, $current_month]);
$overall_budget = $stmt->fetch();

// Get category budgets
$stmt = $pdo->prepare("
    SELECT b.*, c.name as category_name 
    FROM budgets b 
    LEFT JOIN expense_categories c ON b.category_id = c.id 
    WHERE b.user_id = ? AND b.month = ? AND b.category_id IS NOT NULL
");
$stmt->execute([$user_id, $current_month]);
$category_budgets = $stmt->fetchAll();

// Get all expense categories
$categories = $pdo->query("SELECT * FROM expense_categories ORDER BY name")->fetchAll();

// Calculate spent amounts
$category_spent = [];
foreach ($categories as $cat) {
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND category_id = ? AND expense_date BETWEEN ? AND ?");
    $stmt->execute([$user_id, $cat['id'], $current_month, $month_end]);
    $category_spent[$cat['id']] = $stmt->fetch()['total'];
}

$budget_map = [];
foreach ($category_budgets as $b) {
    $budget_map[$b['category_id']] = $b;
}

$total_budget = ($overall_budget['amount'] ?? 0);
foreach ($category_budgets as $b) {
    $total_budget += $b['amount'];
}

$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $current_month, $month_end]);
$total_spent = $stmt->fetch()['total'];

$budget_percentage = $total_budget > 0 ? min(100, round(($total_spent / $total_budget) * 100)) : 0;
$budget_remaining = $total_budget - $total_spent;

// Handle save
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_budgets'])) {
    $overall_amount = floatval($_POST['overall_budget'] ?? 0);
    
    try {
        $pdo->beginTransaction();
        
        // Save overall budget
        $stmt = $pdo->prepare("DELETE FROM budgets WHERE user_id = ? AND month = ? AND category_id IS NULL");
        $stmt->execute([$user_id, $current_month]);
        
        if ($overall_amount > 0) {
            $stmt = $pdo->prepare("INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $current_month, $overall_amount]);
        }
        
        // Save category budgets
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'category_') === 0 && !empty($value)) {
                $category_id = intval(substr($key, 9));
                $amount = floatval($value);
                
                $stmt = $pdo->prepare("DELETE FROM budgets WHERE user_id = ? AND month = ? AND category_id = ?");
                $stmt->execute([$user_id, $current_month, $category_id]);
                
                if ($amount > 0) {
                    $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month, amount) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$user_id, $category_id, $current_month, $amount]);
                }
            }
        }
        
        $pdo->commit();
        $message = "Budgets saved successfully!";
        header("Location: budgets.php?success=1");
        exit;
        
    } catch (Exception $e) {
        $pdo->rollBack();
        $error = "Failed to save budgets: " . $e->getMessage();
    }
}

if (isset($_GET['success'])) {
    $message = "Budgets saved successfully!";
}

$current_page = 'budgets';

if ($is_app) {
    include 'app_header.php';
} else {
    include 'includes/header_new.php';
}
?>

<div class="<?php echo $is_app ? 'app-main' : 'page-content'; ?>">
    <?php if (isset($message)): ?>
        <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>
    <?php if (isset($error)): ?>
        <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>
    
    <div class="app-card">
        <div class="app-card-header">
            <h3><i class="fas fa-calendar-alt"></i> <?php echo date('F Y'); ?> Budget Summary</h3>
        </div>
        <div class="app-card-body">
            <div class="budget-summary-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="budget-summary-item" style="text-align: center;">
                    <div class="budget-summary-label" style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary);">Total Budget</div>
                    <div class="budget-summary-value" style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);"><?php echo $currency . number_format($total_budget, 2); ?></div>
                </div>
                <div class="budget-summary-item" style="text-align: center;">
                    <div class="budget-summary-label" style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary);">Total Spent</div>
                    <div class="budget-summary-value" style="font-size: 1.2rem; font-weight: 700; color: <?php echo $total_spent > $total_budget ? 'var(--danger)' : 'var(--text-primary)'; ?>;"><?php echo $currency . number_format($total_spent, 2); ?></div>
                </div>
                <div class="budget-summary-item" style="text-align: center;">
                    <div class="budget-summary-label" style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary);">Remaining</div>
                    <div class="budget-summary-value" style="font-size: 1.2rem; font-weight: 700; color: <?php echo $budget_remaining >= 0 ? 'var(--success)' : 'var(--danger)'; ?>;"><?php echo $currency . number_format($budget_remaining, 2); ?></div>
                </div>
            </div>
            
            <div class="budget-progress-section">
                <div class="progress-label" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">Overall Progress</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);"><?php echo $budget_percentage; ?>%</span>
                </div>
                <div class="progress" style="height: 8px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden;">
                    <div class="progress-bar <?php echo $budget_percentage >= 100 ? 'bg-danger' : ($budget_percentage >= 80 ? 'bg-warning' : 'bg-success'); ?>" style="width: <?php echo $budget_percentage; ?>%;"></div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="app-card">
        <div class="app-card-header">
            <h3><i class="fas fa-edit"></i> Set Monthly Budgets</h3>
        </div>
        <div class="app-card-body">
            <form method="post">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Overall Monthly Budget</label>
                    <div class="amount-input-wrapper" style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: 16px; background: var(--bg-input); overflow: hidden;">
                        <span class="currency-symbol" style="padding: 12px 14px; background: var(--bg-secondary); color: var(--text-secondary); border-right: 1px solid var(--border-color);"><?php echo $currency; ?></span>
                        <input type="number" step="0.01" name="overall_budget" class="app-input amount-input" style="border: none; padding: 12px 14px; flex: 1; background: transparent; color: var(--text-primary);" value="<?php echo $overall_budget['amount'] ?? ''; ?>" placeholder="Enter overall budget">
                    </div>
                </div>
                
                <div class="divider" style="height: 1px; background: var(--border-color); margin: 20px 0;"></div>
                
                <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 16px; color: var(--text-primary);">Category Budgets</h4>
                
                <?php foreach ($categories as $cat): 
                    $budget = $budget_map[$cat['id']] ?? null;
                    $spent = $category_spent[$cat['id']] ?? 0;
                    $budget_amount = $budget['amount'] ?? 0;
                    $percentage = $budget_amount > 0 ? min(100, round(($spent / $budget_amount) * 100)) : 0;
                ?>
                <div class="category-budget-item" style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 16px; border: 1px solid var(--border-color);">
                    <div class="category-info" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span class="category-name" style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);"><?php echo htmlspecialchars($cat['name']); ?></span>
                        <?php if ($budget_amount > 0): ?>
                        <span class="category-progress-badge" style="font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; background: <?php echo $percentage >= 100 ? 'rgba(177,62,62,0.2)' : ($percentage >= 80 ? 'rgba(184,92,26,0.2)' : 'rgba(46,125,100,0.2)'); ?>; color: <?php echo $percentage >= 100 ? 'var(--danger)' : ($percentage >= 80 ? 'var(--accent)' : 'var(--success)'); ?>;">
                            <?php echo $percentage; ?>%
                        </span>
                        <?php endif; ?>
                    </div>
                    <div class="category-input-group" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span class="currency-symbol-small" style="font-size: 0.85rem; font-weight: 600; background: var(--bg-input); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--border-color); color: var(--text-secondary);"><?php echo $currency; ?></span>
                        <input type="number" step="0.01" name="category_<?php echo $cat['id']; ?>" class="category-input" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-input); color: var(--text-primary);" value="<?php echo $budget_amount; ?>" placeholder="0.00">
                    </div>
                    <?php if ($spent > 0): ?>
                    <div class="category-spent" style="font-size: 0.7rem; color: var(--text-secondary);">Spent: <?php echo $currency . number_format($spent, 2); ?></div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
                
                <button type="submit" name="save_budgets" class="app-btn" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border: none; padding: 14px 20px; border-radius: 40px; font-weight: 600; width: 100%; cursor: pointer; margin-top: 16px;">
                    <i class="fas fa-save"></i> Save Budgets
                </button>
            </form>
        </div>
    </div>
</div>

<style>
.alert {
    padding: 12px 16px;
    border-radius: 16px;
    margin-bottom: 16px;
    font-size: 0.85rem;
}
.alert-success {
    background: rgba(46, 125, 100, 0.2);
    color: var(--success);
}
.alert-danger {
    background: rgba(177, 62, 62, 0.2);
    color: var(--danger);
}
</style>

<?php
if ($is_app) {
    include 'app_footer.php';
} else {
    include 'includes/footer.php';
}
?>