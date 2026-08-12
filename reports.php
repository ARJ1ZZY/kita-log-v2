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
    if (empty($date)) return '-';
    $timestamp = strtotime($date);
    switch ($format) {
        case 'd-m-Y': return date('d-m-Y', $timestamp);
        case 'm/d/Y': return date('m/d/Y', $timestamp);
        case 'd/m/Y': return date('d/m/Y', $timestamp);
        default: return date('Y-m-d', $timestamp);
    }
}

$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-t');

if (strtotime($start_date) > strtotime($end_date)) {
    $temp = $start_date;
    $start_date = $end_date;
    $end_date = $temp;
}

$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $start_date, $end_date]);
$total_sales = $stmt->fetch()['total'];

$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $start_date, $end_date]);
$total_expenses = $stmt->fetch()['total'];
$profit = $total_sales - $total_expenses;
$profit_margin = $total_sales > 0 ? round(($profit / $total_sales) * 100, 1) : 0;

$stmt = $pdo->prepare("SELECT * FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ? ORDER BY sale_date DESC");
$stmt->execute([$user_id, $start_date, $end_date]);
$sales = $stmt->fetchAll();

$stmt = $pdo->prepare("
    SELECT e.*, c.name as category_name 
    FROM expenses e 
    LEFT JOIN expense_categories c ON e.category_id = c.id 
    WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
    ORDER BY e.expense_date DESC
");
$stmt->execute([$user_id, $start_date, $end_date]);
$expenses = $stmt->fetchAll();

// Daily data for chart
$daily_data = [];
$current = new DateTime($start_date);
$end = new DateTime($end_date);
$end->modify('+1 day');

$stmt = $pdo->prepare("
    SELECT sale_date, COALESCE(SUM(amount), 0) as total 
    FROM sales 
    WHERE user_id = ? AND sale_date BETWEEN ? AND ? 
    GROUP BY sale_date
");
$stmt->execute([$user_id, $start_date, $end_date]);
$daily_sales = [];
foreach ($stmt->fetchAll() as $row) {
    $daily_sales[$row['sale_date']] = floatval($row['total']);
}

$stmt = $pdo->prepare("
    SELECT expense_date, COALESCE(SUM(amount), 0) as total 
    FROM expenses 
    WHERE user_id = ? AND expense_date BETWEEN ? AND ? 
    GROUP BY expense_date
");
$stmt->execute([$user_id, $start_date, $end_date]);
$daily_expenses = [];
foreach ($stmt->fetchAll() as $row) {
    $daily_expenses[$row['expense_date']] = floatval($row['total']);
}

while ($current < $end) {
    $date_str = $current->format('Y-m-d');
    $daily_data[] = [
        'date' => $date_str,
        'sales' => $daily_sales[$date_str] ?? 0,
        'expenses' => $daily_expenses[$date_str] ?? 0
    ];
    $current->modify('+1 day');
}

$current_page = 'reports';
include 'app_header.php';
?>

<div class="reports-page">

    <!-- Date Range Card -->
    <div class="report-card">
        <div class="card-header">
            <i class="fas fa-calendar-alt"></i>
            <span>Date Range</span>
        </div>
        <div class="card-body">
            <form method="get" class="date-form">
                <div class="date-form-row">
                    <div class="date-form-group">
                        <label>From</label>
                        <input type="date" name="start_date" class="form-input" value="<?php echo $start_date; ?>" required>
                    </div>
                    <div class="date-form-group">
                        <label>To</label>
                        <input type="date" name="end_date" class="form-input" value="<?php echo $end_date; ?>" required>
                    </div>
                    <div class="date-form-group">
                        <button type="submit" class="btn-generate">
                            <i class="fas fa-chart-line"></i> Generate
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-item">
            <div class="stat-icon revenue">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">Total Revenue</span>
                <span class="stat-value"><?php echo $currency . number_format($total_sales, 2); ?></span>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-icon expense">
                <i class="fas fa-wallet"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">Total Expenses</span>
                <span class="stat-value"><?php echo $currency . number_format($total_expenses, 2); ?></span>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-icon profit">
                <i class="fas fa-piggy-bank"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">Net Profit</span>
                <span class="stat-value <?php echo $profit >= 0 ? 'positive' : 'negative'; ?>">
                    <?php echo $profit >= 0 ? '+' : ''; ?><?php echo $currency . number_format($profit, 2); ?>
                </span>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-icon margin">
                <i class="fas fa-percent"></i>
            </div>
            <div class="stat-info">
                <span class="stat-label">Profit Margin</span>
                <span class="stat-value"><?php echo $profit_margin; ?>%</span>
            </div>
        </div>
    </div>

    <!-- Chart Card -->
    <div class="report-card">
        <div class="card-header">
            <i class="fas fa-chart-line"></i>
            <span>Sales vs Expenses</span>
        </div>
        <div class="card-body">
            <?php if (count($daily_data) > 0): ?>
                <canvas id="lineChart" style="height: 250px; width: 100%;"></canvas>
            <?php else: ?>
                <div class="empty-chart">
                    <i class="fas fa-chart-line"></i>
                    <p>No data available for this period</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Export Section -->
    <div class="report-card">
        <div class="card-header">
            <i class="fas fa-download"></i>
            <span>Export Report</span>
        </div>
        <div class="card-body">
            <div class="export-buttons">
                <a href="export_report.php?start_date=<?php echo urlencode($start_date); ?>&end_date=<?php echo urlencode($end_date); ?>" class="export-btn csv">
                    <i class="fas fa-file-csv"></i> CSV
                </a>
                <a href="export_excel.php?start_date=<?php echo urlencode($start_date); ?>&end_date=<?php echo urlencode($end_date); ?>" class="export-btn excel">
                    <i class="fas fa-file-excel"></i> Excel
                </a>
                <a href="export_pdf.php?start_date=<?php echo urlencode($start_date); ?>&end_date=<?php echo urlencode($end_date); ?>" class="export-btn pdf" target="_blank">
                    <i class="fas fa-file-pdf"></i> PDF
                </a>
            </div>
        </div>
    </div>

    <!-- Sales List -->
    <div class="report-card">
        <div class="card-header">
            <i class="fas fa-shopping-cart"></i>
            <span>Sales</span>
            <span class="badge"><?php echo count($sales); ?> transactions</span>
        </div>
        <div class="card-body p-0">
            <?php if (count($sales) > 0): ?>
                <div class="list-view">
                    <?php foreach ($sales as $sale): ?>
                    <div class="list-item">
                        <div class="item-icon sale">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="item-details">
                            <div class="item-title"><?php echo htmlspecialchars($sale['description'] ?: 'Sale'); ?></div>
                            <div class="item-date"><?php echo formatDate($sale['sale_date'], $date_format); ?></div>
                        </div>
                        <div class="item-amount positive">
                            +<?php echo $currency . number_format($sale['amount'], 2); ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="empty-list">
                    <i class="fas fa-receipt"></i>
                    <p>No sales in this period</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Expenses List -->
    <div class="report-card">
        <div class="card-header">
            <i class="fas fa-receipt"></i>
            <span>Expenses</span>
            <span class="badge"><?php echo count($expenses); ?> transactions</span>
        </div>
        <div class="card-body p-0">
            <?php if (count($expenses) > 0): ?>
                <div class="list-view">
                    <?php foreach ($expenses as $expense): ?>
                    <div class="list-item">
                        <div class="item-icon expense">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div class="item-details">
                            <div class="item-title"><?php echo htmlspecialchars($expense['description'] ?: ($expense['category_name'] ?? 'Expense')); ?></div>
                            <div class="item-date">
                                <?php echo formatDate($expense['expense_date'], $date_format); ?>
                                <?php if ($expense['category_name']): ?>
                                    <span class="item-tag"><?php echo htmlspecialchars($expense['category_name']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                        <div class="item-amount negative">
                            -<?php echo $currency . number_format($expense['amount'], 2); ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="empty-list">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses in this period</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const dailyData = <?php echo json_encode($daily_data); ?>;
const labels = dailyData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});
const salesData = dailyData.map(item => item.sales);
const expensesData = dailyData.map(item => item.expenses);

const ctx = document.getElementById('lineChart')?.getContext('2d');
if (ctx && dailyData.length > 0) {
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sales',
                    data: salesData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#10B981'
                },
                {
                    label: 'Expenses',
                    data: expensesData,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#EF4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 11, family: 'Inter' },
                        color: '#4A5568'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': <?php echo $currency; ?>' + context.raw.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#E2E8F0' },
                    ticks: {
                        callback: function(value) {
                            return '<?php echo $currency; ?>' + value.toLocaleString();
                        },
                        font: { size: 10, color: '#4A5568' }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 6,
                        font: { size: 9, color: '#4A5568' }
                    }
                }
            }
        }
    });
}
</script>

<style>
.reports-page {
    padding: 16px;
    padding-bottom: 20px;
}

/* Report Card */
.report-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    margin-bottom: 16px;
    overflow: hidden;
}

.card-header {
    padding: 14px 16px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-primary);
}

.card-header i {
    color: var(--primary);
}

.badge {
    margin-left: auto;
    background: var(--bg-card);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.card-body {
    padding: 16px;
}

.p-0 {
    padding: 0;
}

/* Date Form - Fixed to fit container perfectly */
.date-form {
    width: 100%;
}

.date-form-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.date-form-group {
    flex: 1;
    min-width: 0;
}

.date-form-group label {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    margin-bottom: 6px;
}

.date-form-group .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid var(--border-color);
    border-radius: 12px;
    font-size: 0.85rem;
    background: var(--bg-input);
    color: var(--text-primary);
    box-sizing: border-box;
}

.date-form-group .form-input:focus {
    outline: none;
    border-color: var(--primary);
}

.btn-generate {
    width: 100%;
    padding: 10px 12px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
    white-space: nowrap;
}

.btn-generate:active {
    transform: scale(0.97);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.stat-item {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border-color);
}

.stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
}

.stat-icon.revenue {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.stat-icon.expense {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.stat-icon.profit {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.stat-icon.margin {
    background: rgba(102, 153, 204, 0.1);
    color: var(--primary);
}

.stat-info {
    flex: 1;
}

.stat-label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 2px;
}

.stat-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-primary);
}

.stat-value.positive {
    color: var(--success);
}

.stat-value.negative {
    color: var(--danger);
}

/* Export Buttons */
.export-buttons {
    display: flex;
    gap: 12px;
}

.export-btn {
    flex: 1;
    padding: 12px;
    border-radius: 40px;
    text-align: center;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
}

.export-btn.csv {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.export-btn.excel {
    background: rgba(102, 153, 204, 0.1);
    color: var(--primary);
}

.export-btn.pdf {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.export-btn:active {
    transform: scale(0.96);
}

/* List View */
.list-view {
    display: flex;
    flex-direction: column;
}

.list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}

.list-item:last-child {
    border-bottom: none;
}

.item-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.item-icon.sale {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.item-icon.expense {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.item-details {
    flex: 1;
}

.item-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.item-date {
    font-size: 0.65rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.item-tag {
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.6rem;
    color: var(--text-muted);
}

.item-amount {
    font-size: 0.85rem;
    font-weight: 700;
}

.item-amount.positive {
    color: var(--success);
}

.item-amount.negative {
    color: var(--danger);
}

/* Empty states */
.empty-chart, .empty-list {
    text-align: center;
    padding: 48px 20px;
    color: var(--text-secondary);
}

.empty-chart i, .empty-list i {
    font-size: 2.5rem;
    margin-bottom: 12px;
    opacity: 0.4;
}

.empty-chart p, .empty-list p {
    font-size: 0.8rem;
    margin: 0;
}

/* Responsive */
@media (max-width: 680px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
    
    .date-form-row {
        flex-direction: column;
    }
    
    .date-form-group {
        width: 100%;
    }
    
    .btn-generate {
        width: 100%;
    }
    
    .export-buttons {
        flex-direction: column;
        gap: 8px;
    }
    
    .list-item {
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .item-details {
        flex: 1;
        min-width: 120px;
    }
}
</style>

<?php include 'app_footer.php'; ?>