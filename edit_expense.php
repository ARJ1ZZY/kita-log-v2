<?php
require 'includes/auth.php';
require 'config/db.php';

$user_id = $_SESSION['user_id'];
$id = $_GET['id'] ?? 0;

// Fetch the expense to edit
$stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user_id]);
$expense = $stmt->fetch();

if (!$expense) {
    header('Location: expenses.php?error=Expense not found');
    exit;
}

// Fetch all categories for dropdown
$categories = $pdo->query("SELECT * FROM expense_categories ORDER BY name")->fetchAll();

$message = '';
$error = '';

// Handle update
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $amount = $_POST['amount'];
    $description = $_POST['description'];
    $expense_date = $_POST['expense_date'];
    $category_id = $_POST['category_id'] ?: null;

    if (empty($amount) || empty($expense_date)) {
        $error = 'Amount and date are required.';
    } else {
        $stmt = $pdo->prepare("UPDATE expenses SET amount = ?, description = ?, expense_date = ?, category_id = ? WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$amount, $description, $expense_date, $category_id, $id, $user_id])) {
            header('Location: expenses.php?message=Expense updated successfully');
            exit;
        } else {
            $error = 'Failed to update expense.';
        }
    }
}

include 'includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header bg-light">
                <h5 class="mb-0"><i class="fas fa-edit me-2"></i>Edit Expense</h5>
            </div>
            <div class="card-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>

                <form method="post">
                    <div class="mb-3">
                        <label for="amount" class="form-label">Amount (₱)</label>
                        <input type="number" step="0.01" class="form-control" name="amount" id="amount" value="<?php echo htmlspecialchars($expense['amount']); ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="category_id" class="form-label">Category</label>
                        <select name="category_id" id="category_id" class="form-select">
                            <option value="">-- Select Category --</option>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo $cat['id']; ?>" <?php echo ($cat['id'] == $expense['category_id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($cat['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Description</label>
                        <input type="text" class="form-control" name="description" id="description" value="<?php echo htmlspecialchars($expense['description']); ?>">
                    </div>
                    <div class="mb-3">
                        <label for="expense_date" class="form-label">Date</label>
                        <input type="date" class="form-control" name="expense_date" id="expense_date" value="<?php echo htmlspecialchars($expense['expense_date']); ?>" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Expense</button>
                    <a href="expenses.php" class="btn btn-secondary">Cancel</a>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>