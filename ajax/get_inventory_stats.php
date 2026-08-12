<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE user_id = ?");
$stmt->execute([$user_id]);
$items = $stmt->fetchAll();

$total_items = count($items);
$total_stock = array_sum(array_column($items, 'current_stock'));
$out_of_stock = count(array_filter($items, fn($i) => $i['current_stock'] == 0));
$total_potential_profit = array_sum(array_map(fn($i) => ($i['selling_price'] - $i['cost_price']) * $i['current_stock'], $items));
$inventory_value = array_sum(array_map(fn($i) => $i['current_stock'] * $i['cost_price'], $items));
?>

<div class="row g-3 mb-4">
    <div class="col-md-2">
        <div class="stat-card">
            <div class="stat-value"><?php echo $total_items; ?></div>
            <div class="stat-label">Total Items</div>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
            <div class="stat-value"><?php echo number_format($total_stock, 0); ?></div>
            <div class="stat-label">Total Stock</div>
        </div>
    </div>
    <div class="col-md-2">
        <div class="stat-card">
            <div class="stat-value text-danger"><?php echo $out_of_stock; ?></div>
            <div class="stat-label">Out of Stock</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card">
            <div class="stat-value">$<?php echo number_format($inventory_value, 0); ?></div>
            <div class="stat-label">Inventory Cost</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card">
            <div class="stat-value text-success">$<?php echo number_format($total_potential_profit, 0); ?></div>
            <div class="stat-label">Potential Profit</div>
        </div>
    </div>
</div>