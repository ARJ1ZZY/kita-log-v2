<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$item_id = intval($_POST['item_id'] ?? 0);
$add_quantity = intval($_POST['add_quantity'] ?? 0);
$supplier = trim($_POST['supplier'] ?? '');

if (!$item_id || $add_quantity <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid request.']);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // Get item details
    $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ? AND user_id = ?");
    $stmt->execute([$item_id, $user_id]);
    $item = $stmt->fetch();
    
    if (!$item) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Item not found.']);
        exit;
    }
    
    $previous = $item['current_stock'];
    $new_stock = $previous + $add_quantity;
    $total_cost = $item['cost_price'] * $add_quantity;
    
    // Update inventory stock
    $stmt = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?");
    $stmt->execute([$new_stock, $item_id, $user_id]);
    
    // Record inventory transaction
    $stmt = $pdo->prepare("INSERT INTO inventory_transactions (user_id, item_id, quantity, previous_stock, new_stock, reference_type, notes) VALUES (?, ?, ?, ?, ?, 'expense', ?)");
    $stmt->execute([$user_id, $item_id, $add_quantity, $previous, $new_stock, "Purchased from $supplier"]);
    
    // Create expense record
    $expense_desc = "Purchase: " . $add_quantity . " " . $item['unit'] . " of " . $item['item_name'];
    $stmt = $pdo->prepare("INSERT INTO expenses (user_id, amount, description, expense_date, transaction_time) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $total_cost, $expense_desc, date('Y-m-d'), date('H:i:s')]);
    
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => "Purchased $add_quantity items for $$total_cost. New stock: $new_stock"]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => 'Failed to process purchase: ' . $e->getMessage()]);
}