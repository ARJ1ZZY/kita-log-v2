<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$item_id = intval($_POST['item_id'] ?? 0);

if (!$item_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid request.']);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM inventory_items WHERE id = ? AND user_id = ?");
if ($stmt->execute([$item_id, $user_id])) {
    echo json_encode(['success' => true, 'message' => 'Item deleted successfully.']);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to delete item.']);
}