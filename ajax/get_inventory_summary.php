<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];

// Get inventory stats
$stmt = $pdo->prepare("SELECT COUNT(*) as total_items, SUM(current_stock) as total_stock FROM inventory_items WHERE user_id = ?");
$stmt->execute([$user_id]);
$stats = $stmt->fetch();

$total_items = $stats['total_items'] ?? 0;
$total_stock = $stats['total_stock'] ?? 0;

// Get low stock items count
$stmt = $pdo->prepare("SELECT COUNT(*) as low_stock FROM inventory_items WHERE user_id = ? AND current_stock <= low_stock_threshold AND current_stock > 0");
$stmt->execute([$user_id]);
$low_stock = $stmt->fetch()['low_stock'] ?? 0;

// Get out of stock items
$stmt = $pdo->prepare("SELECT COUNT(*) as out_of_stock FROM inventory_items WHERE user_id = ? AND current_stock = 0");
$stmt->execute([$user_id]);
$out_of_stock = $stmt->fetch()['out_of_stock'] ?? 0;
?>

<div class="row g-3">
    <div class="col-6">
        <div class="text-center p-3 bg-light rounded">
            <h4 class="mb-1 text-primary"><?php echo $total_items; ?></h4>
            <small class="text-muted">Total Items</small>
        </div>
    </div>
    <div class="col-6">
        <div class="text-center p-3 bg-light rounded">
            <h4 class="mb-1 text-success"><?php echo $total_stock; ?></h4>
            <small class="text-muted">Total Stock</small>
        </div>
    </div>
    <div class="col-6">
        <div class="text-center p-3 bg-light rounded">
            <h4 class="mb-1 text-warning"><?php echo $low_stock; ?></h4>
            <small class="text-muted">Low Stock</small>
        </div>
    </div>
    <div class="col-6">
        <div class="text-center p-3 bg-light rounded">
            <h4 class="mb-1 text-danger"><?php echo $out_of_stock; ?></h4>
            <small class="text-muted">Out of Stock</small>
        </div>
    </div>
</div>