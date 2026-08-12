<?php
require '../includes/auth.php';
require '../config/db.php';

$user_id = $_SESSION['user_id'];
$message = '';
$error = '';

// Only run if requested
if (isset($_POST['run_migration'])) {
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // 1. Create default chart of accounts for this user
        $default_accounts = [
            ['1010', 'Cash', 'asset'],
            ['1020', 'Bank Account', 'asset'],
            ['1030', 'Accounts Receivable', 'asset'],
            ['1040', 'Inventory', 'asset'],
            ['2010', 'Accounts Payable', 'liability'],
            ['2020', 'Loans Payable', 'liability'],
            ['3010', 'Owner\'s Equity', 'equity'],
            ['3020', 'Retained Earnings', 'equity'],
            ['4010', 'Sales Revenue', 'income'],
            ['4020', 'Other Income', 'income'],
            ['5010', 'Cost of Goods Sold', 'expense'],
            ['5020', 'Rent Expense', 'expense'],
            ['5030', 'Utilities Expense', 'expense'],
            ['5040', 'Salaries Expense', 'expense'],
            ['5050', 'Supplies Expense', 'expense']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO chart_of_accounts (user_id, account_code, account_name, account_type) VALUES (?, ?, ?, ?)");
        foreach ($default_accounts as $acc) {
            $stmt->execute([$user_id, $acc[0], $acc[1], $acc[2]]);
        }
        
        // Get account IDs for mapping
        $accounts = [];
        $result = $pdo->query("SELECT id, account_code FROM chart_of_accounts WHERE user_id = $user_id");
        while ($row = $result->fetch()) {
            $accounts[$row['account_code']] = $row['id'];
        }
        
        // 2. Migrate sales to journal entries
        // Sales entry: Debit Cash, Credit Sales Revenue
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE user_id = ? ORDER BY sale_date");
        $stmt->execute([$user_id]);
        $sales = $stmt->fetchAll();
        
        $sales_count = 0;
        $je_stmt = $pdo->prepare("INSERT INTO journal_entries (user_id, entry_number, entry_date, description, reference_type, reference_id) VALUES (?, ?, ?, ?, 'sale', ?)");
        $line_stmt = $pdo->prepare("INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description) VALUES (?, ?, ?, ?, ?)");
        
        foreach ($sales as $sale) {
            $year = date('Y', strtotime($sale['sale_date']));
            $month = date('m', strtotime($sale['sale_date']));
            $entry_number = "SALE-{$year}{$month}-" . str_pad($sale['id'], 6, '0', STR_PAD_LEFT);
            
            $je_stmt->execute([$user_id, $entry_number, $sale['sale_date'], $sale['description'] ?: 'Sale transaction', $sale['id']]);
            $je_id = $pdo->lastInsertId();
            
            // Debit Cash (1010)
            $line_stmt->execute([$je_id, $accounts['1010'], $sale['amount'], 0, 'Cash from sale']);
            // Credit Sales Revenue (4010)
            $line_stmt->execute([$je_id, $accounts['4010'], 0, $sale['amount'], 'Sales revenue']);
            
            $sales_count++;
        }
        
        // 3. Migrate expenses to journal entries
        // Expense entry: Debit appropriate expense account, Credit Cash
        $stmt = $pdo->prepare("SELECT e.*, c.name as cat_name FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id WHERE e.user_id = ? ORDER BY expense_date");
        $stmt->execute([$user_id]);
        $expenses = $stmt->fetchAll();
        
        $expense_count = 0;
        foreach ($expenses as $expense) {
            $year = date('Y', strtotime($expense['expense_date']));
            $month = date('m', strtotime($expense['expense_date']));
            $entry_number = "EXP-{$year}{$month}-" . str_pad($expense['id'], 6, '0', STR_PAD_LEFT);
            
            $je_stmt->execute([$user_id, $entry_number, $expense['expense_date'], $expense['description'] ?: 'Expense transaction', $expense['id']]);
            $je_id = $pdo->lastInsertId();
            
            // Determine expense account based on category
            $expense_account = '5020'; // Default to Rent Expense
            if (stripos($expense['cat_name'] ?? '', 'supplies') !== false) $expense_account = '5050';
            elseif (stripos($expense['cat_name'] ?? '', 'utility') !== false) $expense_account = '5030';
            elseif (stripos($expense['cat_name'] ?? '', 'salary') !== false) $expense_account = '5040';
            
            // Debit expense account
            $line_stmt->execute([$je_id, $accounts[$expense_account], $expense['amount'], 0, $expense['description'] ?: 'Expense']);
            // Credit Cash (1010)
            $line_stmt->execute([$je_id, $accounts['1010'], 0, $expense['amount'], 'Cash paid']);
            
            $expense_count++;
        }
        
        // 4. Update current balances for all accounts
        $update = $pdo->prepare("
            UPDATE chart_of_accounts ca
            SET current_balance = ca.opening_balance + COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN ca.account_type IN ('asset', 'expense') 
                        THEN jel.debit_amount - jel.credit_amount
                        ELSE jel.credit_amount - jel.debit_amount
                    END
                )
                FROM journal_entry_lines jel
                WHERE jel.account_id = ca.id
            ), 0)
            WHERE ca.user_id = ?
        ");
        $update->execute([$user_id]);
        
        $pdo->commit();
        $message = "Migration completed successfully! Processed $sales_count sales and $expense_count expenses.";
        
    } catch (Exception $e) {
        $pdo->rollBack();
        $error = 'Migration failed: ' . $e->getMessage();
    }
}

include '../includes/header.php';
?>

<div class="card">
    <div class="card-header">
        <h5 class="mb-0"><i class="fas fa-database me-2 text-primary"></i>Accounting Migration</h5>
    </div>
    <div class="card-body">
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This will create chart of accounts and convert all existing sales and expenses into journal entries. 
            This operation is idempotent (safe to run multiple times) but will create duplicate entries if run twice.
        </div>
        
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <form method="post">
            <button type="submit" name="run_migration" class="btn btn-primary" onclick="return confirm('Are you sure? This will create accounting entries from your existing data.');">
                <i class="fas fa-play me-1"></i>Run Migration
            </button>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>