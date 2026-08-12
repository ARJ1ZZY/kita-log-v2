<?php
require 'includes/auth.php';
require 'config/db.php';

$user_id = $_SESSION['user_id'];

// Fetch company name and owner (username)
$stmt = $pdo->prepare("SELECT company_name, username FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();
$company_name = $user['company_name'];
$owner = $user['username'];

$start_date = $_GET['start_date'] ?? date('Y-m-01');
$end_date = $_GET['end_date'] ?? date('Y-m-t');

// Fetch sales
$stmt = $pdo->prepare("SELECT sale_date as date, 'Sale' as type, amount, description FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
$stmt->execute([$user_id, $start_date, $end_date]);
$sales = $stmt->fetchAll();

// Fetch expenses with category
$stmt = $pdo->prepare("
    SELECT e.expense_date as date, 'Expense' as type, e.amount, 
           CONCAT(e.description, ' (', COALESCE(c.name, 'Uncategorized'), ')') as description 
    FROM expenses e 
    LEFT JOIN expense_categories c ON e.category_id = c.id 
    WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ?
");
$stmt->execute([$user_id, $start_date, $end_date]);
$expenses = $stmt->fetchAll();

// Merge and sort by date
$transactions = array_merge($sales, $expenses);
usort($transactions, function($a, $b) {
    return strtotime($b['date']) - strtotime($a['date']);
});

// Set headers for CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="kitalog_report_' . $start_date . '_to_' . $end_date . '.csv"');

$output = fopen('php://output', 'w');

// Add company and owner info at the top
fputcsv($output, ['Company:', $company_name]);
fputcsv($output, ['Owner:', $owner]);
fputcsv($output, []); // empty line

// Column headers
fputcsv($output, ['Date', 'Type', 'Amount', 'Description']);

foreach ($transactions as $row) {
    fputcsv($output, [$row['date'], $row['type'], $row['amount'], $row['description']]);
}

// Add summary at the end
fputcsv($output, []); // empty line

$total_sales = array_sum(array_column($sales, 'amount'));
$total_expenses = array_sum(array_column($expenses, 'amount'));
$profit = $total_sales - $total_expenses;

fputcsv($output, ['Total Sales', '', number_format($total_sales, 2), '']);
fputcsv($output, ['Total Expenses', '', number_format($total_expenses, 2), '']);
fputcsv($output, ['Net Profit', '', number_format($profit, 2), '']);

fclose($output);
exit;