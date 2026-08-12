<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$id = $_POST['id'] ?? 0;
$type = $_POST['type'] ?? '';

if (!$id || !$type) {
    echo json_encode(['success' => false, 'error' => 'Invalid request.']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    if ($type == 'sale') {
        // First, get the sale details to restore stock
        $stmt = $pdo->prepare("SELECT amount, description FROM sales WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        $sale = $stmt->fetch();
        
        if ($sale) {
            // Find matching inventory item by name
            $stmt = $pdo->prepare("SELECT id, current_stock, selling_price FROM inventory_items WHERE user_id = ? AND item_name = ?");
            $stmt->execute([$user_id, $sale['description']]);
            $item = $stmt->fetch();
            
            if ($item) {
                // Calculate quantity sold (amount / selling price)
                $quantity = round($sale['amount'] / $item['selling_price']);
                if ($quantity < 1) $quantity = 1;
                
                // Restore stock
                $new_stock = $item['current_stock'] + $quantity;
                $stmt = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$new_stock, $item['id'], $user_id]);
                
                error_log("Stock restored - Item: {$item['id']}, Old: {$item['current_stock']}, New: $new_stock, Quantity returned: $quantity");
            }
        }
        
        // Delete the sale
        $stmt = $pdo->prepare("DELETE FROM sales WHERE id = ? AND user_id = ?");
        $success = $stmt->execute([$id, $user_id]);
        
    } else {
        // Delete expense (no inventory impact)
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
        $success = $stmt->execute([$id, $user_id]);
    }
    
    if ($success) {
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Transaction deleted successfully.']);
    } else {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Failed to delete transaction.']);
    }
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Delete Transaction Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>