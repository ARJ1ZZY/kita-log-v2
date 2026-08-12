<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];

// Get data from POST
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$type = isset($_POST['type']) ? $_POST['type'] : '';

if (!$id || !$type) {
    echo json_encode(['success' => false, 'error' => 'Missing ID or type. Received ID: ' . $id . ', Type: ' . $type]);
    exit;
}

try {
    $pdo->beginTransaction();
    
    if ($type == 'sale') {
        // Get sale details
        $stmt = $pdo->prepare("SELECT amount, description FROM sales WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        $sale = $stmt->fetch();
        
        if (!$sale) {
            echo json_encode(['success' => false, 'error' => 'Sale not found']);
            exit;
        }
        
        // Find inventory item by exact name match
        $stmt = $pdo->prepare("SELECT id, current_stock, selling_price FROM inventory_items WHERE user_id = ? AND item_name = ?");
        $stmt->execute([$user_id, $sale['description']]);
        $item = $stmt->fetch();
        
        if ($item) {
            // Calculate quantity sold
            $quantity = round($sale['amount'] / $item['selling_price']);
            if ($quantity < 1) $quantity = 1;
            
            // Restore stock
            $new_stock = $item['current_stock'] + $quantity;
            $stmt = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$new_stock, $item['id'], $user_id]);
        }
        
        // Delete the sale
        $stmt = $pdo->prepare("DELETE FROM sales WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        
    } else {
        // Delete expense
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
    }
    
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
    exit;
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>