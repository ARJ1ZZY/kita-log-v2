<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (!isset($_SESSION['user_id'])) { 
    echo json_encode(['success' => false, 'error' => 'Unauthorized']); 
    exit; 
}

require_once '../config/db.php';
require_once '../includes/config_helpers.php';

$user_id = $_SESSION['user_id'];

// Get currency
$stmt = $pdo->prepare("SELECT currency_symbol FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : '₱';

// Get all inventory items with stock > 0
$stmt = $pdo->prepare("
    SELECT id, item_name, selling_price, current_stock, unit, category 
    FROM inventory_items 
    WHERE user_id = ? AND current_stock > 0 
    ORDER BY category, item_name
");
$stmt->execute([$user_id]);
$items = $stmt->fetchAll();

echo json_encode([
    'success' => true, 
    'items' => $items, 
    'currency' => $currency
]);
?>