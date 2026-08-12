<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

$user_id = $_SESSION['user_id'];
$type = $_GET['type'] ?? 'sale';

$stmt = $pdo->prepare("SELECT currency_symbol FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings['currency_symbol'] ?? '₱';

$cats = $pdo->query("SELECT id, name FROM expense_categories ORDER BY name")->fetchAll();

$stmt = $pdo->prepare("SELECT id, item_name, selling_price FROM inventory_items WHERE user_id = ? GROUP BY item_name");
$stmt->execute([$user_id]);
$items = $stmt->fetchAll();
?>

<div class="modal-container" style="max-width: 400px;">
    <div class="modal-header">
        <h3><i class="fas fa-<?php echo $type == 'sale' ? 'shopping-cart' : 'wallet'; ?>"></i> Quick Add <?php echo ucfirst($type); ?></h3>
        <button class="modal-close" onclick="closeQuickAdd()">&times;</button>
    </div>
    <form method="post" action="transactions.php" onsubmit="closeQuickAdd()">
        <input type="hidden" name="add_transaction" value="1">
        <input type="hidden" name="type" value="<?php echo $type; ?>">
        <div class="modal-body">
            <?php if ($type == 'sale'): ?>
                <div class="form-group">
                    <label class="form-label">Select Item</label>
                    <select name="inventory_item_id" class="app-input" required>
                        <option value="">Choose an item...</option>
                        <?php foreach ($items as $item): ?>
                            <option value="<?php echo $item['id']; ?>">
                                <?php echo htmlspecialchars($item['item_name']); ?> — <?php echo $currency . number_format($item['selling_price'], 2); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Quantity</label>
                    <input type="number" name="quantity" class="app-input" value="1" min="1">
                </div>
            <?php else: ?>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select name="category_id" class="app-input" required>
                        <option value="">Select Category</option>
                        <?php foreach ($cats as $cat): ?>
                            <option value="<?php echo $cat['id']; ?>"><?php echo htmlspecialchars($cat['name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" name="description" class="app-input" placeholder="e.g., Monthly rent">
                </div>
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" step="0.01" name="amount" class="app-input" placeholder="0.00" required>
                </div>
            <?php endif; ?>
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" name="date" class="app-input" value="<?php echo date('Y-m-d'); ?>" required>
            </div>
            <input type="hidden" name="time" value="<?php echo date('H:i:s'); ?>">
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeQuickAdd()">Cancel</button>
            <button type="submit" class="btn-primary">Add <?php echo ucfirst($type); ?></button>
        </div>
    </form>
</div>