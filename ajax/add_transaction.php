<?php
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/includes/config_helpers.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$type = $_POST['type'] ?? '';
$amount = $_POST['amount'] ?? '';
$description = $_POST['description'] ?? '';
$date = $_POST['date'] ?? '';
$time = $_POST['time'] ?? date('H:i:s');
$category_id = null;
$inventory_item_id = null;
$quantity = 1;
$error = null;

// Log the incoming data for debugging
error_log("Add Transaction - Type: $type, Amount: $amount, Date: $date, Time: $time");

if ($type == 'expense' && isset($_POST['category_id']) && !empty($_POST['category_id'])) {
    $category_id = intval($_POST['category_id']);
    error_log("Expense Category ID: $category_id");
}

if ($type == 'sale') {
    $inventory_item_id = isset($_POST['inventory_item_id']) ? intval($_POST['inventory_item_id']) : null;
    $quantity = isset($_POST['quantity']) ? intval($_POST['quantity']) : 1;
    error_log("Sale - Item ID: $inventory_item_id, Quantity: $quantity");
}

if (empty($date) || empty($type)) {
    echo json_encode(['success' => false, 'error' => 'Date and type are required.']);
    exit;
}

if ($type == 'expense') {
    if (!$category_id) {
        echo json_encode(['success' => false, 'error' => 'Please select a category for expense.']);
        exit;
    }
    if (empty($amount) || $amount <= 0) {
        echo json_encode(['success' => false, 'error' => 'Please enter a valid amount for expense.']);
        exit;
    }
} else {
    if (!$inventory_item_id) {
        echo json_encode(['success' => false, 'error' => 'Please select an item for sale.']);
        exit;
    }
    if ($quantity < 1) {
        echo json_encode(['success' => false, 'error' => 'Quantity must be at least 1.']);
        exit;
    }
}

try {
    $pdo->beginTransaction();
    
    if ($type == 'sale') {
        // Get item details
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE id = ? AND user_id = ?");
        $stmt->execute([$inventory_item_id, $user_id]);
        $item = $stmt->fetch();
        
        if (!$item) {
            echo json_encode(['success' => false, 'error' => 'Item not found.']);
            exit;
        }
        
        error_log("Item found - Name: {$item['item_name']}, Stock: {$item['current_stock']}, Price: {$item['selling_price']}");
        
        if ($item['current_stock'] < $quantity) {
            echo json_encode(['success' => false, 'error' => 'Not enough stock! Only ' . $item['current_stock'] . ' available.']);
            exit;
        }
        
        $amount = $item['selling_price'] * $quantity;
        $description = $item['item_name'];
        
        $stmt = $pdo->prepare("INSERT INTO sales (user_id, amount, description, sale_date, transaction_time) VALUES (?, ?, ?, ?, ?)");
        $result = $stmt->execute([$user_id, $amount, $description, $date, $time]);
        
        if (!$result) {
            echo json_encode(['success' => false, 'error' => 'Failed to insert sale record.']);
            exit;
        }
        
        $sale_id = $pdo->lastInsertId();
        error_log("Sale inserted - ID: $sale_id, Amount: $amount");
        
        // Update stock
        $new_stock = $item['current_stock'] - $quantity;
        $stmt = $pdo->prepare("UPDATE inventory_items SET current_stock = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$new_stock, $inventory_item_id, $user_id]);
        error_log("Stock updated - New stock: $new_stock");
        
    } else {
        // Expense
        $stmt = $pdo->prepare("INSERT INTO expenses (user_id, amount, description, expense_date, transaction_time, category_id) VALUES (?, ?, ?, ?, ?, ?)");
        $result = $stmt->execute([$user_id, $amount, $description, $date, $time, $category_id]);
        
        if (!$result) {
            echo json_encode(['success' => false, 'error' => 'Failed to insert expense record.']);
            exit;
        }
        
        $expense_id = $pdo->lastInsertId();
        error_log("Expense inserted - ID: $expense_id, Amount: $amount, Category: $category_id");
    }
    
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Transaction added successfully.']);
    
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Transaction Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>