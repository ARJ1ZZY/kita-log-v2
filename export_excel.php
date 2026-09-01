<?php
require 'includes/auth.php';
require 'config/db.php';

require_once 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

$user_id = $_SESSION['user_id'];
$start_date = $_GET['start_date'] ?? date('Y-m-01');
$end_date = $_GET['end_date'] ?? date('Y-m-t');

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

// Fetch sales
$stmt = $pdo->prepare("SELECT * FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ? ORDER BY sale_date DESC");
$stmt->execute([$user_id, $start_date, $end_date]);
$sales = $stmt->fetchAll();

// Fetch expenses with category
$stmt = $pdo->prepare("
    SELECT e.*, c.name as category_name 
    FROM expenses e 
    LEFT JOIN expense_categories c ON e.category_id = c.id 
    WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ? 
    ORDER BY e.expense_date DESC
");
$stmt->execute([$user_id, $start_date, $end_date]);
$expenses = $stmt->fetchAll();

// Calculate totals
$total_sales = array_sum(array_column($sales, 'amount'));
$total_expenses = array_sum(array_column($expenses, 'amount'));
$profit = $total_sales - $total_expenses;

// Create new Spreadsheet
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

// Set document properties
$spreadsheet->getProperties()->setCreator($owner)
    ->setTitle("KITA-LOG Report $start_date to $end_date");

// Add company and owner info at the top
$sheet->setCellValue('A1', $company_name);
$sheet->setCellValue('A2', 'Owner: ' . $owner);
$sheet->setCellValue('A3', 'KITA-LOG Financial Report');
$sheet->setCellValue('A4', "Period: $start_date to $end_date");

// Style the header
$sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
$sheet->getStyle('A3')->getFont()->setBold(true)->setSize(16);
$sheet->getStyle('A4')->getFont()->setItalic(true);

// Summary
$row = 6; // Start after the header (rows 1-4 used, row 5 empty for spacing)
$sheet->setCellValue("A$row", 'Total Sales');
$sheet->setCellValue("B$row", $currency . number_format($total_sales, 2));
$row++;
$sheet->setCellValue("A$row", 'Total Expenses');
$sheet->setCellValue("B$row", $currency . number_format($total_expenses, 2));
$row++;
$sheet->setCellValue("A$row", 'Net Profit');
$sheet->setCellValue("B$row", $currency . number_format($profit, 2));
$sheet->getStyle("A$row")->getFont()->setBold(true);
if ($profit >= 0) {
    $sheet->getStyle("B$row")->getFont()->getColor()->setARGB('FF00FF00'); // green
} else {
    $sheet->getStyle("B$row")->getFont()->getColor()->setARGB('FFFF0000'); // red
}
$row += 2;

// Sales table
$sheet->setCellValue("A$row", 'Sales');
$sheet->getStyle("A$row")->getFont()->setBold(true);
$row++;
$sheet->setCellValue("A$row", 'Date');
$sheet->setCellValue("B$row", 'Amount');
$sheet->setCellValue("C$row", 'Description');
$sheet->getStyle("A$row:C$row")->getFont()->setBold(true);
$sheet->getStyle("A$row:C$row")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFCCCCCC');
$row++;

if (count($sales) > 0) {
    foreach ($sales as $sale) {
        $sheet->setCellValue("A$row", $sale['sale_date']);
        $sheet->setCellValue("B$row", $currency . number_format($sale['amount'], 2));
        $sheet->setCellValue("C$row", $sale['description']);
        $row++;
    }
} else {
    $sheet->setCellValue("A$row", 'No sales');
    $row++;
}
$row += 2;

// Expenses table
$sheet->setCellValue("A$row", 'Expenses');
$sheet->getStyle("A$row")->getFont()->setBold(true);
$row++;
$sheet->setCellValue("A$row", 'Date');
$sheet->setCellValue("B$row", 'Category');
$sheet->setCellValue("C$row", 'Amount');
$sheet->setCellValue("D$row", 'Description');
$sheet->getStyle("A$row:D$row")->getFont()->setBold(true);
$sheet->getStyle("A$row:D$row")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFCCCCCC');
$row++;

if (count($expenses) > 0) {
    foreach ($expenses as $expense) {
        $sheet->setCellValue("A$row", $expense['expense_date']);
        $sheet->setCellValue("B$row", $expense['category_name'] ?? 'Uncategorized');
        $sheet->setCellValue("C$row", $currency . number_format($expense['amount'], 2));
        $sheet->setCellValue("D$row", $expense['description']);
        $row++;
    }
} else {
    $sheet->setCellValue("A$row", 'No expenses');
    $row++;
}

// Auto-size columns
foreach (range('A','D') as $col) {
    $sheet->getColumnDimension($col)->setAutoSize(true);
}

// Create Excel file
$writer = new Xlsx($spreadsheet);
$filename = "kitalog_report_$start_date-$end_date.xlsx";

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0');

$writer->save('php://output');
exit;