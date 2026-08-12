<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$id = $_POST['id'] ?? 0;
$type = $_POST['type'] ?? '';

if (!$id || !$type) {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

try {
    if ($type == 'sale') {
        $stmt = $pdo->prepare("SELECT id, 'sale' as type, amount, description, sale_date as trans_date FROM sales WHERE id = ? AND user_id = ?");
    } else {
        $stmt = $pdo->prepare("SELECT e.id, 'expense' as type, e.amount, e.description, e.expense_date as trans_date, e.category_id, c.name as category_name FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id WHERE e.id = ? AND e.user_id = ?");
    }
    
    $stmt->execute([$id, $user_id]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($transaction) {
        echo json_encode(['success' => true, 'transaction' => $transaction]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Transaction not found']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>