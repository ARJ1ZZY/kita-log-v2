<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$id = $_POST['id'] ?? 0;
$type = $_POST['type'] ?? '';
$amount = $_POST['amount'] ?? 0;
$description = $_POST['description'] ?? '';
$date = $_POST['date'] ?? '';
$category_id = $_POST['category_id'] ?? null;

if (!$id || !$type || !$amount || !$date) {
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
    exit;
}

try {
    if ($type == 'sale') {
        $stmt = $pdo->prepare("UPDATE sales SET amount = ?, description = ?, sale_date = ? WHERE id = ? AND user_id = ?");
        $success = $stmt->execute([$amount, $description, $date, $id, $user_id]);
    } else {
        $stmt = $pdo->prepare("UPDATE expenses SET amount = ?, description = ?, expense_date = ?, category_id = ? WHERE id = ? AND user_id = ?");
        $success = $stmt->execute([$amount, $description, $date, $category_id, $id, $user_id]);
    }
    
    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Transaction updated successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update transaction']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>