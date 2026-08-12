<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$type = isset($_POST['type']) ? $_POST['type'] : '';

// Log for debugging
error_log("Delete request - ID: $id, Type: $type, User: $user_id");

if (!$id || !$type) {
    echo json_encode(['success' => false, 'error' => 'Invalid request. Missing ID or type.']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    if ($type == 'sale') {
        // Get sale details first
        $stmt = $pdo->prepare("SELECT amount, description FROM sales WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        $sale = $stmt->fetch();
        
        error_log("Sale found: " . print_r($sale, true));
        
        if ($sale) {
            // Find matching inventory item by exact name
            $stmt = $pdo->prepare("SELECT id, current_stock, selling_price, item_name FROM inventory_items WHERE user_id = ? AND item_name = ?");
            $stmt->execute([$user_id, $sale['description']]);
            $item = $stmt->fetch();
            
            error_log("Inventory item found: " . print_r($item, true));
            
            if ($item) {
                // Calculate quantity sold
                $quantity = round($sale['amount'] / $item['selling_price']);
                if ($quantity < 1) $quantity = 1;
                
                // Restore stock
                $new_stock = $item['current_stock'] + $quantity;
                $updateStmt = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?");
                $updateStmt->execute([$new_stock, $item['id'], $user_id]);
                
                error_log("Stock restored - Item: {$item['item_name']}, Old: {$item['current_stock']}, New: $new_stock, Quantity added: $quantity");
            }
        }
        
        // Delete the sale
        $deleteStmt = $pdo->prepare("DELETE FROM sales WHERE id = ? AND user_id = ?");
        $success = $deleteStmt->execute([$id, $user_id]);
        error_log("Sale deleted: " . ($success ? 'Yes' : 'No'));
        
    } else {
        // Delete expense
        $deleteStmt = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
        $success = $deleteStmt->execute([$id, $user_id]);
        error_log("Expense deleted: " . ($success ? 'Yes' : 'No'));
    }
    
    if ($success) {
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Transaction deleted and stock restored.']);
        exit;
    } else {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Failed to delete transaction from database.']);
        exit;
    }
    
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Delete error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    exit;
}
?>