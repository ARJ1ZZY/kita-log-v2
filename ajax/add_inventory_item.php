<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];

// Get user's business type
$stmt = $pdo->prepare("SELECT business_type FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();
$business_type = $user['business_type'] ?? 'sari_sari';

$item_name = $_POST['item_name'] ?? '';
$category = $_POST['category'] ?? '';
$unit = $_POST['unit'] ?? 'pcs';
$cost_price = intval($_POST['cost_price'] ?? 0);
$selling_price = intval($_POST['selling_price'] ?? 0);
$quantity = intval($_POST['quantity'] ?? 5);

if (empty($item_name)) {
    echo json_encode(['success' => false, 'error' => 'Item name is required.']);
    exit;
}

try {
    // Check if item already exists
    $check = $pdo->prepare("SELECT id, current_stock FROM inventory_items WHERE user_id = ? AND item_name = ?");
    $check->execute([$user_id, $item_name]);
    $existing = $check->fetch();
    
    if ($existing) {
        // Item exists - update stock
        $new_stock = $existing['current_stock'] + $quantity;
        $update = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ?");
        if ($update->execute([$new_stock, $existing['id']])) {
            echo json_encode(['success' => true, 'message' => "Item already exists. Added $quantity to existing stock. New total: $new_stock"]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update existing item.']);
        }
    } else {
        // New item
        $insert = $pdo->prepare("INSERT INTO inventory_items (user_id, business_type, item_name, category, unit, unit_qty, cost_price, selling_price, current_stock) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)");
        if ($insert->execute([$user_id, $business_type, $item_name, $category, $unit, $cost_price, $selling_price, $quantity])) {
            echo json_encode(['success' => true, 'message' => 'New item added successfully with ' . $quantity . ' stock.']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to add item.']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}