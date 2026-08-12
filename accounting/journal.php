<?php
require '../includes/auth.php';
require '../config/db.php';

$user_id = $_SESSION['user_id'];
$message = '';
$error = '';

// Get accounts for dropdown
$stmt = $pdo->prepare("SELECT id, account_code, account_name FROM chart_of_accounts WHERE user_id = ? AND is_active = 1 ORDER BY account_code");
$stmt->execute([$user_id]);
$accounts = $stmt->fetchAll();

// Handle journal entry submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_journal'])) {
    $entry_date = $_POST['entry_date'];
    $description = $_POST['description'];
    $lines = $_POST['lines'];
    
    // Calculate totals
    $total_debit = 0;
    $total_credit = 0;
    $valid = true;
    
    foreach ($lines as $line) {
        if (!empty($line['account_id']) && (!empty($line['debit']) || !empty($line['credit']))) {
            $debit = floatval($line['debit'] ?? 0);
            $credit = floatval($line['credit'] ?? 0);
            $total_debit += $debit;
            $total_credit += $credit;
            
            if ($debit > 0 && $credit > 0) {
                $error = 'A line cannot have both debit and credit.';
                $valid = false;
                break;
            }
        }
    }
    
    if ($total_debit != $total_credit) {
        $error = 'Total debits must equal total credits.';
        $valid = false;
    }
    
    if ($valid) {
        // Generate entry number
        $year = date('Y', strtotime($entry_date));
        $month = date('m', strtotime($entry_date));
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM journal_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ?");
        $stmt->execute([$user_id, "$year-$month-01", "$year-$month-31"]);
        $count = $stmt->fetchColumn() + 1;
        $entry_number = "JE-$year$month-" . str_pad($count, 4, '0', STR_PAD_LEFT);
        
        // Begin transaction
        $pdo->beginTransaction();
        try {
            // Insert journal entry
            $stmt = $pdo->prepare("INSERT INTO journal_entries (user_id, entry_number, entry_date, description, reference_type) VALUES (?, ?, ?, ?, 'manual')");
            $stmt->execute([$user_id, $entry_number, $entry_date, $description]);
            $journal_id = $pdo->lastInsertId();
            
            // Insert lines
            $stmt = $pdo->prepare("INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description) VALUES (?, ?, ?, ?, ?)");
            foreach ($lines as $line) {
                if (!empty($line['account_id']) && (!empty($line['debit']) || !empty($line['credit']))) {
                    $debit = floatval($line['debit'] ?? 0);
                    $credit = floatval($line['credit'] ?? 0);
                    $line_desc = $line['description'] ?? '';
                    
                    $stmt->execute([$journal_id, $line['account_id'], $debit, $credit, $line_desc]);
                    
                    // Update account balance (simple running total - in production use proper ledger)
                    $balance_change = $debit - $credit;
                    $update = $pdo->prepare("UPDATE chart_of_accounts SET current_balance = current_balance + ? WHERE id = ? AND user_id = ?");
                    $update->execute([$balance_change, $line['account_id'], $user_id]);
                }
            }
            
            $pdo->commit();
            $message = 'Journal entry saved successfully. Entry #: ' . $entry_number;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = 'Failed to save journal entry: ' . $e->getMessage();
        }
    }
}

include '../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0"><i class="fas fa-journal-whills me-2 text-primary"></i>Journal Entry</h2>
    <a href="trial_balance.php" class="btn btn-outline-primary">
        <i class="fas fa-balance-scale me-1"></i>Trial Balance
    </a>
</div>

<?php if ($message): ?>
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        <?php echo htmlspecialchars($message); ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>
<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <?php echo htmlspecialchars($error); ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>

<div class="card">
    <div class="card-body">
        <form method="post" id="journalForm">
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">Entry Date</label>
                    <input type="date" name="entry_date" class="form-control" value="<?php echo date('Y-m-d'); ?>" required>
                </div>
                <div class="col-md-8">
                    <label class="form-label">Description</label>
                    <input type="text" name="description" class="form-control" placeholder="Journal entry description">
                </div>
            </div>
            
            <table class="table table-bordered" id="journalLines">
                <thead>
                    <tr>
                        <th>Account</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Description</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="line-row">
                        <td>
                            <select name="lines[0][account_id]" class="form-select form-select-sm">
                                <option value="">Select Account</option>
                                <?php foreach ($accounts as $acc): ?>
                                    <option value="<?php echo $acc['id']; ?>"><?php echo htmlspecialchars($acc['account_code'] . ' - ' . $acc['account_name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                        <td>
                            <input type="number" step="0.01" name="lines[0][debit]" class="form-control form-control-sm debit-input" placeholder="0.00">
                        </td>
                        <td>
                            <input type="number" step="0.01" name="lines[0][credit]" class="form-control form-control-sm credit-input" placeholder="0.00">
                        </td>
                        <td>
                            <input type="text" name="lines[0][description]" class="form-control form-control-sm" placeholder="Line description">
                        </td>
                        <td>
                            <button type="button" class="btn btn-sm btn-outline-danger remove-line" style="display:none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <th class="text-end">Totals:</th>
                        <th id="totalDebit">0.00</th>
                        <th id="totalCredit">0.00</th>
                        <th colspan="2"></th>
                    </tr>
                </tfoot>
            </table>
            
            <div class="mb-3">
                <button type="button" class="btn btn-sm btn-outline-primary" id="addLine">
                    <i class="fas fa-plus me-1"></i>Add Line
                </button>
            </div>
            
            <div class="alert alert-warning d-none" id="balanceWarning">
                <i class="fas fa-exclamation-triangle me-2"></i>Debits and credits must balance.
            </div>
            
            <button type="submit" name="save_journal" class="btn btn-primary" id="saveBtn" disabled>
                <i class="fas fa-save me-1"></i>Save Journal Entry
            </button>
        </form>
    </div>
</div>

<script>
let lineCount = 1;

document.getElementById('addLine').addEventListener('click', function() {
    const tbody = document.querySelector('#journalLines tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'line-row';
    newRow.innerHTML = `
        <td>
            <select name="lines[${lineCount}][account_id]" class="form-select form-select-sm">
                <option value="">Select Account</option>
                <?php foreach ($accounts as $acc): ?>
                    <option value="<?php echo $acc['id']; ?>"><?php echo htmlspecialchars($acc['account_code'] . ' - ' . $acc['account_name']); ?></option>
                <?php endforeach; ?>
            </select>
        </td>
        <td>
            <input type="number" step="0.01" name="lines[${lineCount}][debit]" class="form-control form-control-sm debit-input" placeholder="0.00">
        </td>
        <td>
            <input type="number" step="0.01" name="lines[${lineCount}][credit]" class="form-control form-control-sm credit-input" placeholder="0.00">
        </td>
        <td>
            <input type="text" name="lines[${lineCount}][description]" class="form-control form-control-sm" placeholder="Line description">
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-outline-danger remove-line">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(newRow);
    
    // Show remove button on all rows except first
    document.querySelectorAll('.remove-line').forEach(btn => btn.style.display = 'inline-block');
    lineCount++;
    
    attachLineEvents();
});

function attachLineEvents() {
    document.querySelectorAll('.debit-input, .credit-input').forEach(input => {
        input.removeEventListener('input', calculateTotals);
        input.addEventListener('input', calculateTotals);
    });
    
    document.querySelectorAll('.remove-line').forEach(btn => {
        btn.removeEventListener('click', removeLine);
        btn.addEventListener('click', removeLine);
    });
}

function removeLine(e) {
    const row = e.target.closest('tr');
    row.remove();
    calculateTotals();
    
    if (document.querySelectorAll('.line-row').length === 1) {
        document.querySelector('.remove-line').style.display = 'none';
    }
}

function calculateTotals() {
    let totalDebit = 0;
    let totalCredit = 0;
    
    document.querySelectorAll('.line-row').forEach(row => {
        const debit = parseFloat(row.querySelector('.debit-input').value) || 0;
        const credit = parseFloat(row.querySelector('.credit-input').value) || 0;
        totalDebit += debit;
        totalCredit += credit;
    });
    
    document.getElementById('totalDebit').textContent = totalDebit.toFixed(2);
    document.getElementById('totalCredit').textContent = totalCredit.toFixed(2);
    
    const saveBtn = document.getElementById('saveBtn');
    const warning = document.getElementById('balanceWarning');
    
    if (Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0) {
        saveBtn.disabled = false;
        warning.classList.add('d-none');
    } else {
        saveBtn.disabled = true;
        warning.classList.remove('d-none');
    }
}

// Initialize
attachLineEvents();
calculateTotals();
</script>

<?php include '../includes/footer.php'; ?>