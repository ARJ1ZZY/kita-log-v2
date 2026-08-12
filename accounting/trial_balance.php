<?php
require '../includes/auth.php';
require '../config/db.php';

$user_id = $_SESSION['user_id'];
$as_of_date = $_GET['as_of_date'] ?? date('Y-m-d');

// Get all accounts with balances as of date
$stmt = $pdo->prepare("
    SELECT 
        ca.*,
        COALESCE((
            SELECT SUM(
                CASE 
                    WHEN ca.account_type IN ('asset', 'expense') 
                    THEN jel.debit_amount - jel.credit_amount
                    ELSE jel.credit_amount - jel.debit_amount
                END
            )
            FROM journal_entries je
            JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            WHERE jel.account_id = ca.id 
                AND je.user_id = ca.user_id
                AND je.entry_date <= ?
        ), 0) + ca.opening_balance as balance
    FROM chart_of_accounts ca
    WHERE ca.user_id = ?
    ORDER BY ca.account_code
");
$stmt->execute([$as_of_date, $user_id]);
$accounts = $stmt->fetchAll();

// Calculate totals
$total_debits = 0;
$total_credits = 0;
foreach ($accounts as $acc) {
    if (in_array($acc['account_type'], ['asset', 'expense'])) {
        $total_debits += $acc['balance'];
    } else {
        $total_credits += $acc['balance'];
    }
}

include '../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0"><i class="fas fa-balance-scale me-2 text-primary"></i>Trial Balance</h2>
</div>

<div class="card mb-4">
    <div class="card-body">
        <form method="get" class="row g-3">
            <div class="col-md-4">
                <label class="form-label">As of Date</label>
                <input type="date" name="as_of_date" class="form-control" value="<?php echo $as_of_date; ?>" required>
            </div>
            <div class="col-md-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary">Run Report</button>
            </div>
        </form>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h5 class="mb-0">Trial Balance as of <?php echo date('F j, Y', strtotime($as_of_date)); ?></h5>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Account Code</th>
                        <th>Account Name</th>
                        <th>Type</th>
                        <th class="text-end">Debit</th>
                        <th class="text-end">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($accounts as $acc): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($acc['account_code']); ?></td>
                        <td><?php echo htmlspecialchars($acc['account_name']); ?></td>
                        <td><span class="badge bg-<?php echo $acc['account_type'] == 'asset' ? 'info' : ($acc['account_type'] == 'liability' ? 'warning' : ($acc['account_type'] == 'equity' ? 'success' : ($acc['account_type'] == 'income' ? 'primary' : 'secondary'))); ?>">
                            <?php echo ucfirst($acc['account_type']); ?>
                        </span></td>
                        <td class="text-end">
                            <?php echo in_array($acc['account_type'], ['asset', 'expense']) ? number_format($acc['balance'], 2) : '-'; ?>
                        </td>
                        <td class="text-end">
                            <?php echo in_array($acc['account_type'], ['liability', 'equity', 'income']) ? number_format($acc['balance'], 2) : '-'; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot>
                    <tr class="table-secondary">
                        <th colspan="3" class="text-end">Totals:</th>
                        <th class="text-end"><?php echo number_format($total_debits, 2); ?></th>
                        <th class="text-end"><?php echo number_format($total_credits, 2); ?></th>
                    </tr>
                    <?php if (abs($total_debits - $total_credits) > 0.01): ?>
                    <tr class="table-danger">
                        <td colspan="5" class="text-center text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Trial balance is out of balance by <?php echo number_format(abs($total_debits - $total_credits), 2); ?>
                        </td>
                    </tr>
                    <?php else: ?>
                    <tr class="table-success">
                        <td colspan="5" class="text-center text-success">
                            <i class="fas fa-check-circle me-2"></i>
                            Trial balance is in balance
                        </td>
                    </tr>
                    <?php endif; ?>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>