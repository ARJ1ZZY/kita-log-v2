<?php
require 'includes/auth.php';
require 'config/db.php';

$user_id = $_SESSION['user_id'];
$id = $_GET['id'] ?? 0;

// Fetch the sale to edit
$stmt = $pdo->prepare("SELECT * FROM sales WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user_id]);
$sale = $stmt->fetch();

if (!$sale) {
    header('Location: sales.php?error=Sale not found');
    exit;
}

$message = '';
$error = '';

// Handle update
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $amount = $_POST['amount'];
    $description = $_POST['description'];
    $sale_date = $_POST['sale_date'];

    if (empty($amount) || empty($sale_date)) {
        $error = 'Amount and date are required.';
    } else {
        $stmt = $pdo->prepare("UPDATE sales SET amount = ?, description = ?, sale_date = ? WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$amount, $description, $sale_date, $id, $user_id])) {
            header('Location: sales.php?message=Sale updated successfully');
            exit;
        } else {
            $error = 'Failed to update sale.';
        }
    }
}

include 'includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header bg-light">
                <h5 class="mb-0"><i class="fas fa-edit me-2"></i>Edit Sale</h5>
            </div>
            <div class="card-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>

                <form method="post">
                    <div class="mb-3">
                        <label for="amount" class="form-label">Amount (₱)</label>
                        <input type="number" step="0.01" class="form-control" name="amount" id="amount" value="<?php echo htmlspecialchars($sale['amount']); ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Description</label>
                        <input type="text" class="form-control" name="description" id="description" value="<?php echo htmlspecialchars($sale['description']); ?>">
                    </div>
                    <div class="mb-3">
                        <label for="sale_date" class="form-label">Date</label>
                        <input type="date" class="form-control" name="sale_date" id="sale_date" value="<?php echo htmlspecialchars($sale['sale_date']); ?>" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Sale</button>
                    <a href="sales.php" class="btn btn-secondary">Cancel</a>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>