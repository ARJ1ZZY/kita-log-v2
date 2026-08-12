<?php
require '../includes/auth.php';
require '../config/db.php';

$user_id = $_SESSION['user_id'];
$message = '';
$error = '';

// Handle add/edit/delete
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['add_account'])) {
        $account_code = $_POST['account_code'];
        $account_name = $_POST['account_name'];
        $account_type = $_POST['account_type'];
        $parent_id = !empty($_POST['parent_id']) ? $_POST['parent_id'] : null;
        $opening_balance = $_POST['opening_balance'] ?? 0;

        $stmt = $pdo->prepare("INSERT INTO chart_of_accounts (user_id, account_code, account_name, account_type, parent_id, opening_balance, current_balance) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$user_id, $account_code, $account_name, $account_type, $parent_id, $opening_balance, $opening_balance])) {
            $message = 'Account added successfully.';
        } else {
            $error = 'Failed to add account.';
        }
    } elseif (isset($_POST['edit_account'])) {
        $id = $_POST['id'];
        $account_code = $_POST['account_code'];
        $account_name = $_POST['account_name'];
        $account_type = $_POST['account_type'];
        $parent_id = !empty($_POST['parent_id']) ? $_POST['parent_id'] : null;
        $is_active = isset($_POST['is_active']) ? 1 : 0;

        $stmt = $pdo->prepare("UPDATE chart_of_accounts SET account_code=?, account_name=?, account_type=?, parent_id=?, is_active=? WHERE id=? AND user_id=?");
        if ($stmt->execute([$account_code, $account_name, $account_type, $parent_id, $is_active, $id, $user_id])) {
            $message = 'Account updated successfully.';
        } else {
            $error = 'Failed to update account.';
        }
    } elseif (isset($_POST['delete_account'])) {
        $id = $_POST['id'];
        $stmt = $pdo->prepare("DELETE FROM chart_of_accounts WHERE id=? AND user_id=?");
        if ($stmt->execute([$id, $user_id])) {
            $message = 'Account deleted successfully.';
        } else {
            $error = 'Failed to delete account.';
        }
    }
}

// Fetch all accounts for this user
$stmt = $pdo->prepare("SELECT * FROM chart_of_accounts WHERE user_id = ? ORDER BY account_code");
$stmt->execute([$user_id]);
$accounts = $stmt->fetchAll();

// Fetch accounts for parent dropdown
$stmt = $pdo->prepare("SELECT id, account_code, account_name FROM chart_of_accounts WHERE user_id = ? ORDER BY account_code");
$stmt->execute([$user_id]);
$parent_options = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0"><i class="fas fa-book me-2 text-primary"></i>Chart of Accounts</h2>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addAccountModal">
        <i class="fas fa-plus me-1"></i>Add Account
    </button>
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
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Parent</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($accounts as $acc): ?>
                    <?php
                        // Get parent name if exists
                        $parent_name = '-';
                        if ($acc['parent_id']) {
                            foreach ($accounts as $p) {
                                if ($p['id'] == $acc['parent_id']) {
                                    $parent_name = $p['account_name'];
                                    break;
                                }
                            }
                        }
                        $balance_class = $acc['current_balance'] >= 0 ? 'text-success' : 'text-danger';
                    ?>
                    <tr>
                        <td><?php echo htmlspecialchars($acc['account_code']); ?></td>
                        <td><?php echo htmlspecialchars($acc['account_name']); ?></td>
                        <td><span class="badge bg-<?php echo $acc['account_type'] == 'asset' ? 'info' : ($acc['account_type'] == 'liability' ? 'warning' : ($acc['account_type'] == 'equity' ? 'success' : ($acc['account_type'] == 'income' ? 'primary' : 'secondary'))); ?>">
                            <?php echo ucfirst($acc['account_type']); ?>
                        </span></td>
                        <td><?php echo $parent_name; ?></td>
                        <td class="<?php echo $balance_class; ?>"><?php echo number_format($acc['current_balance'], 2); ?></td>
                        <td>
                            <span class="badge bg-<?php echo $acc['is_active'] ? 'success' : 'danger'; ?>">
                                <?php echo $acc['is_active'] ? 'Active' : 'Inactive'; ?>
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editAccount(<?php echo htmlspecialchars(json_encode($acc)); ?>)">
                                <i class="fas fa-edit"></i>
                            </button>
                            <form method="post" style="display:inline;" onsubmit="return confirm('Delete this account?');">
                                <input type="hidden" name="id" value="<?php echo $acc['id']; ?>">
                                <button type="submit" name="delete_account" class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add Account Modal -->
<div class="modal fade" id="addAccountModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="post">
                <div class="modal-header">
                    <h5 class="modal-title">Add Account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Account Code</label>
                        <input type="text" name="account_code" class="form-control" required pattern="[0-9]{4}" title="4-digit code">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Account Name</label>
                        <input type="text" name="account_name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Account Type</label>
                        <select name="account_type" class="form-select" required>
                            <option value="asset">Asset</option>
                            <option value="liability">Liability</option>
                            <option value="equity">Equity</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent Account (optional)</label>
                        <select name="parent_id" class="form-select">
                            <option value="">None</option>
                            <?php foreach ($parent_options as $p): ?>
                                <option value="<?php echo $p['id']; ?>"><?php echo htmlspecialchars($p['account_code'] . ' - ' . $p['account_name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Opening Balance</label>
                        <input type="number" step="0.01" name="opening_balance" class="form-control" value="0.00">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" name="add_account" class="btn btn-primary">Add Account</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Account Modal -->
<div class="modal fade" id="editAccountModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="post">
                <input type="hidden" name="id" id="edit_id">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Account Code</label>
                        <input type="text" name="account_code" id="edit_code" class="form-control" required pattern="[0-9]{4}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Account Name</label>
                        <input type="text" name="account_name" id="edit_name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Account Type</label>
                        <select name="account_type" id="edit_type" class="form-select" required>
                            <option value="asset">Asset</option>
                            <option value="liability">Liability</option>
                            <option value="equity">Equity</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent Account</label>
                        <select name="parent_id" id="edit_parent" class="form-select">
                            <option value="">None</option>
                            <?php foreach ($parent_options as $p): ?>
                                <option value="<?php echo $p['id']; ?>"><?php echo htmlspecialchars($p['account_code'] . ' - ' . $p['account_name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" name="is_active" id="edit_active" checked>
                        <label class="form-check-label">Active</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" name="edit_account" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function editAccount(account) {
    document.getElementById('edit_id').value = account.id;
    document.getElementById('edit_code').value = account.account_code;
    document.getElementById('edit_name').value = account.account_name;
    document.getElementById('edit_type').value = account.account_type;
    document.getElementById('edit_parent').value = account.parent_id || '';
    document.getElementById('edit_active').checked = account.is_active == 1;
    
    var editModal = new bootstrap.Modal(document.getElementById('editAccountModal'));
    editModal.show();
}
</script>

<?php include '../includes/footer.php'; ?>