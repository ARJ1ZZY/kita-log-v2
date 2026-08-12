<?php
require '../includes/auth.php';
require '../config/db.php';

$user_id = $_SESSION['user_id'];
$account_id = isset($_GET['account_id']) ? (int)$_GET['account_id'] : 0;
$start_date = $_GET['start_date'] ?? date('Y-m-01');
$end_date = $_GET['end_date'] ?? date('Y-m-d');

// Get all accounts for dropdown
$stmt = $pdo->prepare("SELECT id, account_code, account_name FROM chart_of_accounts WHERE user_id = ? ORDER BY account_code");
$stmt->execute([$user_id]);
$accounts = $stmt->fetchAll();

$account = null;
$entries = [];

if ($account_id) {
    // Get account details
    $stmt = $pdo->prepare("SELECT * FROM chart_of_accounts WHERE id = ? AND user_id = ?");
    $stmt->execute([$account_id, $user_id]);
    $account = $stmt->fetch();
    
    if ($account) {
        // Get ledger entries
        $stmt = $pdo->prepare("
            SELECT 
                je.entry_date,
                je.entry_number,
                je.description as journal_desc,
                jel.debit_amount,
                jel.credit_amount,
                jel.description as line_desc
            FROM journal_entries je
            JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            WHERE jel.account_id = ? 
                AND je.user_id = ?
                AND je.entry_date BETWEEN ? AND ?
            ORDER BY je.entry_date, je.id
        ");
        $stmt->execute([$account_id, $user_id, $start_date, $end_date]);
        $entries = $stmt->fetchAll();
        
        // Calculate running balance
        $balance = $account['opening_balance'];
        foreach ($entries as &$entry) {
            if ($account['account_type'] == 'asset' || $account['account_type'] == 'expense') {
                $balance += $entry['debit_amount'] - $entry['credit_amount'];
            } else {
                $balance += $entry['credit_amount'] - $entry['debit_amount'];
            }
            $entry['balance'] = $balance;
        }
    }
}

include '../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0"><i class="fas fa-book-open me-2 text-primary"></i>General Ledger</h2>
</div>

<div class="card mb-4">
    <div class="card-body">
        <form method="get" class="row g-3">
            <div class="col-md-4">
                <label class="form-label">Account</label>
                <select name="account_id" class="form-select" required>
                    <option value="">Select Account</option>
                    <?php foreach ($accounts as $acc): ?>
                        <option value="<?php echo $acc['id']; ?>" <?php echo $acc['id'] == $account_id ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($acc['account_code'] . ' - ' . $acc['account_name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">From</label>
                <input type="date" name="start_date" class="form-control" value="<?php echo $start_date; ?>">
            </div>
            <div class="col-md-3">
                <label class="form-label">To</label>
                <input type="date" name="end_date" class="form-control" value="<?php echo $end_date; ?>">
            </div>
            <div class="col-md-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary w-100">View Ledger</button>
            </div>
        </form>
    </div>
</div>

<?php if ($account): ?>
<div class="card">
    <div class="card-header">
        <h5 class="mb-0"><?php echo htmlspecialchars($account['account_code'] . ' - ' . $account['account_name']); ?></h5>
        <small class="text-muted">Type: <?php echo ucfirst($account['account_type']); ?></small>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Entry #</th>
                        <th>Description</th>
                        <th class="text-end">Debit</th>
                        <th class="text-end">Credit</th>
                        <th class="text-end">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="table-secondary">
                        <td colspan="5" class="text-end"><strong>Opening Balance</strong></td>
                        <td class="text-end"><strong><?php echo number_format($account['opening_balance'], 2); ?></strong></td>
                    </tr>
                    <?php foreach ($entries as $entry): ?>
                    <tr>
                        <td><?php echo $entry['entry_date']; ?></td>
                        <td><?php echo htmlspecialchars($entry['entry_number']); ?></td>
                        <td><?php echo htmlspecialchars($entry['line_desc'] ?: $entry['journal_desc']); ?></td>
                        <td class="text-end"><?php echo $entry['debit_amount'] ? number_format($entry['debit_amount'], 2) : '-'; ?></td>
                        <td class="text-end"><?php echo $entry['credit_amount'] ? number_format($entry['credit_amount'], 2) : '-'; ?></td>
                        <td class="text-end"><?php echo number_format($entry['balance'], 2); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<?php elseif ($account_id): ?>
    <div class="alert alert-warning">Account not found.</div>
<?php endif; ?>

<?php include '../includes/footer.php'; ?>