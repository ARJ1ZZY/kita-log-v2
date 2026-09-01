<?php
require 'includes/auth.php';
require 'config/db.php';

// Dynamic autoloader path - FIXED
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    // Try parent directory if in subfolder
    $autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
}
if (!file_exists($autoloadPath)) {
    die('Autoloader not found. Please run "composer install" in your project root.');
}
require_once $autoloadPath;

use Dompdf\Dompdf;
use Dompdf\Options;

$user_id = $_SESSION['user_id'];
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-t');

// Validate dates
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
    die('Invalid date format.');
}

// Fetch company name and owner
$stmt = $pdo->prepare("SELECT company_name, username FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();
$company_name = $user['company_name'];
$owner = $user['username'];

// Get user settings for currency
$stmt = $pdo->prepare("SELECT currency_symbol FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : '₱';

// Fetch totals
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $start_date, $end_date]);
$total_sales = $stmt->fetch()['total'];

$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $start_date, $end_date]);
$total_expenses = $stmt->fetch()['total'];

$profit = $total_sales - $total_expenses;

// Fetch sales
$stmt = $pdo->prepare("SELECT * FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ? ORDER BY sale_date DESC");
$stmt->execute([$user_id, $start_date, $end_date]);
$sales = $stmt->fetchAll();

// Fetch expenses
$stmt = $pdo->prepare("
    SELECT e.*, c.name as category_name 
    FROM expenses e 
    LEFT JOIN expense_categories c ON e.category_id = c.id 
    WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
    ORDER BY e.expense_date DESC
");
$stmt->execute([$user_id, $start_date, $end_date]);
$expenses = $stmt->fetchAll();

// Build HTML for PDF
$html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KITA-LOG Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
        h2 { color: #2c3e50; font-size: 18px; margin-top: 20px; background: #f5f5f5; padding: 8px; }
        .company { font-size: 20px; font-weight: bold; color: #1e3c72; }
        .owner { font-size: 14px; color: #555; margin-bottom: 10px; }
        .summary { margin: 20px 0; background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .summary div { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #2c3e50; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .profit { color: green; font-weight: bold; }
        .loss { color: red; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 11px; color: #777; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="company">' . htmlspecialchars($company_name) . '</div>
    <div class="owner">Owner: ' . htmlspecialchars($owner) . '</div>
    <h1>KITA-LOG Financial Report</h1>
    <p>Period: ' . htmlspecialchars($start_date) . ' to ' . htmlspecialchars($end_date) . '</p>
    <div class="summary">
        <div><strong>Total Sales:</strong> ' . $currency . number_format($total_sales, 2) . '</div>
        <div><strong>Total Expenses:</strong> ' . $currency . number_format($total_expenses, 2) . '</div>
        <div><strong>Net Profit:</strong> <span class="' . ($profit >= 0 ? 'profit' : 'loss') . '">' . $currency . number_format($profit, 2) . '</span></div>
    </div>
    <h2>Sales</h2>
    ' . (count($sales) ? '
    <table>
        <thead>
            <tr><th>Date</th><th>Amount</th><th>Description</th></tr>
        </thead>
        <tbody>' .
            implode('', array_map(function($s) use ($currency) {
                return '<tr><td>' . $s['sale_date'] . '</td><td>' . $currency . number_format($s['amount'], 2) . '</td><td>' . htmlspecialchars($s['description']) . '</td></tr>';
            }, $sales)) .
        '</tbody>
    </table>' : '<p>No sales.</p>') . '

    <h2>Expenses</h2>
    ' . (count($expenses) ? '
    <table>
        <thead>
            <tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th></tr>
        </thead>
        <tbody>' .
            implode('', array_map(function($e) use ($currency) {
                return '<tr><td>' . $e['expense_date'] . '</td><td>' . htmlspecialchars($e['category_name'] ?? 'Uncategorized') . '</td><td>' . $currency . number_format($e['amount'], 2) . '</td><td>' . htmlspecialchars($e['description']) . '</td></tr>';
            }, $expenses)) .
        '</tbody>
    </table>' : '<p>No expenses.</p>') . '
    
    <div class="footer">
        Generated by KITA-LOG on ' . date('F j, Y, g:i a') . '
    </div>
</body>
</html>';

$options = new Options();
$options->set('defaultFont', 'Arial');
$options->set('isHtml5ParserEnabled', true);
$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$dompdf->stream("kitalog_report_$start_date-$end_date.pdf", ["Attachment" => true]);
exit;