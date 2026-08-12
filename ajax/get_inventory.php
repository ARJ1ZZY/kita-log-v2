<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];

// Get all inventory items
$stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE user_id = ? GROUP BY item_name ORDER BY category, item_name");
$stmt->execute([$user_id]);
$items = $stmt->fetchAll();

if (count($items) > 0): ?>
    <div class="bg-white p-4 rounded shadow-sm">
        <div class="section-header">
            <i class="fas fa-list"></i> Current Inventory
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Unit</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Cost</th>
                        <th>Selling</th>
                        <th>Profit/Item</th>
                        <th>Potential Profit</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $grand_total_potential = 0;
                    foreach ($items as $item): 
                        $profit_per_item = $item['selling_price'] - $item['cost_price'];
                        $potential_profit = $profit_per_item * $item['current_stock'];
                        $grand_total_potential += $potential_profit;
                        $margin = $item['selling_price'] > 0 ? round(($profit_per_item / $item['selling_price']) * 100, 1) : 0;
                        
                        if ($item['current_stock'] == 0) {
                            $stock_class = 'stock-critical';
                            $stock_text = 'Out of Stock';
                        } elseif ($item['current_stock'] <= 5) {
                            $stock_class = 'stock-low';
                            $stock_text = 'Low Stock';
                        } else {
                            $stock_class = 'stock-good';
                            $stock_text = 'In Stock';
                        }
                    ?>
                    <tr>
                        <td class="fw-bold"><?php echo htmlspecialchars($item['item_name']); ?></td>
                        <td><?php echo htmlspecialchars($item['category']); ?></td>
                        <td><?php echo htmlspecialchars($item['unit']); ?></td>
                        <td class="fw-bold <?php echo $stock_class; ?>"><?php echo $item['current_stock']; ?></td>
                        <td><span class="stock-badge <?php echo $stock_class; ?>"><?php echo $stock_text; ?></span></td>
                        <td>$<?php echo number_format($item['cost_price'], 0); ?></td>
                        <td>
                            <div class="d-flex align-items-center">
                                <span class="me-2">$<?php echo number_format($item['selling_price'], 0); ?></span>
                                <button class="btn btn-sm btn-outline-primary py-0 edit-price-btn" 
                                        data-id="<?php echo $item['id']; ?>" 
                                        data-name="<?php echo htmlspecialchars($item['item_name']); ?>"
                                        data-category="<?php echo htmlspecialchars($item['category']); ?>"
                                        data-price="<?php echo $item['selling_price']; ?>"
                                        data-cost="<?php echo $item['cost_price']; ?>">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </td>
                        <td>
                            $<?php echo number_format($profit_per_item, 0); ?>
                            <small class="text-muted">(<?php echo $margin; ?>%)</small>
                        </td>
                        <td class="text-success fw-bold">
                            $<?php echo number_format($potential_profit, 0); ?>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-success purchase-btn" 
                                    data-id="<?php echo $item['id']; ?>" 
                                    data-name="<?php echo htmlspecialchars($item['item_name']); ?>"
                                    data-category="<?php echo htmlspecialchars($item['category']); ?>"
                                    data-cost="<?php echo $item['cost_price']; ?>"
                                    data-stock="<?php echo $item['current_stock']; ?>">
                                <i class="fas fa-shopping-cart"></i> Buy
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" 
                                    data-id="<?php echo $item['id']; ?>" 
                                    data-name="<?php echo htmlspecialchars($item['item_name']); ?>">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot class="table-light">
                    <tr>
                        <th colspan="8" class="text-end">Total Potential Profit:</th>
                        <th class="text-success">$<?php echo number_format($grand_total_potential, 0); ?></th>
                        <th></th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
<?php else: ?>
    <div class="bg-white p-4 rounded shadow-sm">
        <div class="section-header">
            <i class="fas fa-list"></i> Current Inventory
        </div>
        <div class="text-center py-5">
            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
            <h5>No inventory items yet</h5>
            <p class="text-muted">Add your first item using the form above.</p>
        </div>
    </div>
<?php endif; ?>