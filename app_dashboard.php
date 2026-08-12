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

function formatDate($date, $format) {
    $timestamp = strtotime($date);
    switch ($format) {
        case 'd-m-Y': return date('d-m-Y', $timestamp);
        case 'm/d/Y': return date('m/d/Y', $timestamp);
        case 'd/m/Y': return date('d/m/Y', $timestamp);
        default: return date('Y-m-d', $timestamp);
    }
}

// Today's stats
$today = date('Y-m-d');
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date = ?");
$stmt->execute([$user_id, $today]);
$today_sales = $stmt->fetch()['total'];
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date = ?");
$stmt->execute([$user_id, $today]);
$today_expenses = $stmt->fetch()['total'];
$today_profit = $today_sales - $today_expenses;
$profit_margin = $today_sales > 0 ? round(($today_profit / $today_sales) * 100, 1) : 0;

// This week's stats
$week_start = date('Y-m-d', strtotime('monday this week'));
$week_end = date('Y-m-d', strtotime('sunday this week'));
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $week_start, $week_end]);
$week_sales = $stmt->fetch()['total'];
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $week_start, $week_end]);
$week_expenses = $stmt->fetch()['total'];
$week_profit = $week_sales - $week_expenses;

// This month's stats
$yearMonth = date('Y-m');
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND DATE_FORMAT(sale_date, '%Y-%m') = ?");
$stmt->execute([$user_id, $yearMonth]);
$month_sales = $stmt->fetch()['total'];
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?");
$stmt->execute([$user_id, $yearMonth]);
$month_expenses = $stmt->fetch()['total'];
$month_profit = $month_sales - $month_expenses;

// Recent transactions (limited to 5 for dashboard)
$stmt = $pdo->prepare("(SELECT 'sale' as type, sale_date as trans_date, amount, description FROM sales WHERE user_id = ? LIMIT 5) UNION ALL (SELECT 'expense' as type, expense_date as trans_date, amount, description FROM expenses WHERE user_id = ? LIMIT 5) ORDER BY trans_date DESC LIMIT 5");
$stmt->execute([$user_id, $user_id]);
$recent_transactions = $stmt->fetchAll();

// Top selling items
$stmt = $pdo->prepare("SELECT description, COUNT(*) as count, SUM(amount) as total FROM sales WHERE user_id = ? AND description IS NOT NULL AND description != '' GROUP BY description ORDER BY total DESC LIMIT 4");
$stmt->execute([$user_id]);
$top_items = $stmt->fetchAll();

// Low stock alert
$stmt = $pdo->prepare("SELECT item_name, current_stock, unit FROM inventory_items WHERE user_id = ? AND current_stock <= low_stock_threshold ORDER BY current_stock ASC LIMIT 4");
$stmt->execute([$user_id]);
$low_stock_items = $stmt->fetchAll();

$current_page = 'app_dashboard';
include 'app_header.php';
?>

<div class="app-main page-content" id="dashboardContent">
    <!-- Period Selector Tabs -->
    <div class="period-tabs">
        <button class="period-tab active" data-period="today">Today</button>
        <button class="period-tab" data-period="week">This Week</button>
        <button class="period-tab" data-period="month">This Month</button>
    </div>

    <!-- Today's Stats -->
    <div id="stats-today" class="stats-period active">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $currency . number_format($today_sales, 0); ?></div>
                    <div class="stat-label">Sales</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $currency . number_format($today_expenses, 0); ?></div>
                    <div class="stat-label">Expenses</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
                <div class="stat-content">
                    <div class="stat-value <?php echo $today_profit >= 0 ? 'text-success' : 'text-danger'; ?>"><?php echo $currency . number_format($today_profit, 0); ?></div>
                    <div class="stat-label">Profit</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-percent"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $profit_margin; ?>%</div>
                    <div class="stat-label">Margin</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Week's Stats -->
    <div id="stats-week" class="stats-period">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $currency . number_format($week_sales, 0); ?></div>
                    <div class="stat-label">Sales</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $currency . number_format($week_expenses, 0); ?></div>
                    <div class="stat-label">Expenses</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
                <div class="stat-content">
                    <div class="stat-value <?php echo $week_profit >= 0 ? 'text-success' : 'text-danger'; ?>"><?php echo $currency . number_format($week_profit, 0); ?></div>
                    <div class="stat-label">Profit</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-week"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo date('M j', strtotime($week_start)) . ' - ' . date('j', strtotime($week_end)); ?></div>
                    <div class="stat-label">Period</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Month's Stats -->
    <div id="stats-month" class="stats-period">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $currency . number_format($month_sales, 0); ?></div>
                    <div class="stat-label">Sales</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $currency . number_format($month_expenses, 0); ?></div>
                    <div class="stat-label">Expenses</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-piggy-bank"></i></div>
                <div class="stat-content">
                    <div class="stat-value <?php echo $month_profit >= 0 ? 'text-success' : 'text-danger'; ?>"><?php echo $currency . number_format($month_profit, 0); ?></div>
                    <div class="stat-label">Profit</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo date('F Y'); ?></div>
                    <div class="stat-label">Period</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
        <a href="transactions.php" class="quick-btn sale-btn"><i class="fas fa-plus-circle"></i> Quick Sale</a>
        <a href="transactions.php?type=expense" class="quick-btn expense-btn"><i class="fas fa-minus-circle"></i> Quick Expense</a>
        <a href="inventory.php" class="quick-btn stock-btn"><i class="fas fa-box"></i> Manage Stock</a>
    </div>

    <!-- Low Stock Alert -->
    <?php if (count($low_stock_items) > 0): ?>
    <div class="alert-card">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="alert-content">
            <p><strong><?php echo count($low_stock_items); ?> item(s)</strong> need reordering</p>
        </div>
        <a href="inventory.php">View Stock</a>
    </div>
    <?php endif; ?>

    <!-- Two Column Layout -->
    <div class="two-column-layout">
        <div class="column">
            <div class="section-header">
                <h2><i class="fas fa-fire"></i> Top Selling</h2>
                <a href="transactions.php">View All</a>
            </div>
            <div class="trending-list">
                <?php if (count($top_items) > 0): ?>
                    <?php foreach ($top_items as $item): ?>
                    <div class="trending-row row-item">
                        <div class="trending-rank">#<?php echo $item['count']; ?></div>
                        <div class="trending-name"><?php echo htmlspecialchars($item['description']); ?></div>
                        <div class="trending-amount"><?php echo $currency . number_format($item['total'], 0); ?></div>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="empty-placeholder">
                        <i class="fas fa-chart-simple"></i>
                        <p>No sales data yet</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="column">
            <div class="section-header">
                <h2><i class="fas fa-history"></i> Recent Activity</h2>
                <a href="transactions.php">View All</a>
            </div>
            <div class="activity-list">
                <?php if (count($recent_transactions) > 0): ?>
                    <?php foreach ($recent_transactions as $t): ?>
                    <div class="activity-item row-item">
                        <div class="activity-icon <?php echo $t['type']; ?>">
                            <i class="fas fa-<?php echo $t['type'] == 'sale' ? 'shopping-cart' : 'receipt'; ?>"></i>
                        </div>
                        <div class="activity-details">
                            <div class="activity-title"><?php echo htmlspecialchars($t['description'] ?: ($t['type'] == 'sale' ? 'Sale' : 'Expense')); ?></div>
                            <div class="activity-date"><?php echo formatDate($t['trans_date'], $date_format); ?></div>
                        </div>
                        <div class="activity-amount <?php echo $t['type'] == 'sale' ? 'positive' : 'negative'; ?>">
                            <?php echo $t['type'] == 'sale' ? '+' : '-'; ?> <?php echo $currency . number_format($t['amount'], 2); ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="empty-placeholder">
                        <i class="fas fa-receipt"></i>
                        <p>No transactions yet</p>
                        <a href="transactions.php" class="btn-sm">Add First Transaction</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<style>
/* Dashboard Styles */
.period-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    background: var(--bg-secondary);
    padding: 4px;
    border-radius: 60px;
    width: fit-content;
}

.period-tab {
    padding: 8px 20px;
    border-radius: 40px;
    font-size: 0.8rem;
    font-weight: 600;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}

.period-tab.active {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
}

.stats-period {
    display: none;
}

.stats-period.active {
    display: block;
    animation: fadeIn 0.3s ease;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
}

.stat-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 14px 12px;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 12px;
}

.stat-icon {
    width: 44px;
    height: 44px;
    background: var(--bg-secondary);
    border-radius: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 1.2rem;
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
}

.stat-label {
    font-size: 0.6rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.text-success {
    color: var(--success) !important;
}

.text-danger {
    color: var(--danger) !important;
}

.quick-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.quick-btn {
    flex: 1;
    text-align: center;
    padding: 14px 12px;
    border-radius: 40px;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
    display: inline-block;
}

.sale-btn { background: var(--success); color: white; }
.expense-btn { background: var(--warning); color: white; }
.stock-btn { background: var(--primary); color: white; }

.quick-btn:active {
    transform: scale(0.97);
}

.alert-card {
    background: rgba(239, 68, 68, 0.1);
    margin: 0 0 20px 0;
    padding: 12px 16px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.alert-card i {
    font-size: 1.2rem;
    color: var(--danger);
}

.alert-content {
    flex: 1;
}

.alert-card p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--danger);
    font-weight: 500;
}

.alert-card a {
    color: var(--danger);
    font-size: 0.7rem;
    text-decoration: none;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(239, 68, 68, 0.15);
}

.two-column-layout {
    display: flex;
    gap: 16px;
    margin-top: 8px;
}

.column {
    flex: 1;
    min-width: 0;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.section-header h2 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
}

.section-header h2 i {
    color: var(--primary);
    margin-right: 6px;
}

.section-header a {
    font-size: 0.7rem;
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
}

.trending-list {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.trending-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}

.trending-row:last-child {
    border-bottom: none;
}

.trending-rank {
    width: 36px;
    height: 36px;
    background: var(--bg-secondary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--primary);
}

.trending-name {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
}

.trending-amount {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--primary);
}

.activity-list {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.activity-icon.sale {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.activity-icon.expense {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.activity-details {
    flex: 1;
}

.activity-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.activity-date {
    font-size: 0.65rem;
    color: var(--text-secondary);
}

.activity-amount {
    font-size: 0.85rem;
    font-weight: 700;
}

.activity-amount.positive {
    color: var(--success);
}

.activity-amount.negative {
    color: var(--danger);
}

.empty-placeholder {
    text-align: center;
    padding: 32px 16px;
    color: var(--text-secondary);
}

.empty-placeholder i {
    font-size: 2rem;
    margin-bottom: 8px;
    opacity: 0.5;
}

.empty-placeholder p {
    font-size: 0.8rem;
    margin: 0;
}

.btn-sm {
    display: inline-block;
    margin-top: 12px;
    padding: 8px 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 30px;
    font-size: 0.75rem;
    cursor: pointer;
    text-decoration: none;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
    
    .two-column-layout {
        flex-direction: column;
        gap: 20px;
    }
    
    .stat-card {
        padding: 12px 10px;
    }
    
    .stat-icon {
        width: 36px;
        height: 36px;
        font-size: 1rem;
    }
    
    .stat-value {
        font-size: 1rem;
    }
    
    .period-tab {
        padding: 6px 16px;
        font-size: 0.75rem;
    }
}

@media (max-width: 480px) {
    .quick-actions {
        flex-direction: column;
        gap: 8px;
    }
    
    .quick-btn {
        padding: 12px;
    }
}
</style>

<script>
// Period tab switching - FIXED and working
document.addEventListener('DOMContentLoaded', function() {
    var tabs = document.querySelectorAll('.period-tab');
    
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var period = this.getAttribute('data-period');
            
            // Update active tab
            tabs.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update visible stats
            var periods = document.querySelectorAll('.stats-period');
            periods.forEach(function(periodDiv) {
                periodDiv.classList.remove('active');
            });
            
            var activePeriod = document.getElementById('stats-' + period);
            if (activePeriod) {
                activePeriod.classList.add('active');
            }
        });
    });
});
</script>

<?php include 'app_footer.php'; ?>