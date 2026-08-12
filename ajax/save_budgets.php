<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$month = $_POST['month'] ?? date('Y-m-01');
$overall_budget = floatval($_POST['overall_budget'] ?? 0);

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // Delete existing overall budget for this month
    $stmt = $pdo->prepare("DELETE FROM budgets WHERE user_id = ? AND month = ? AND category_id IS NULL");
    $stmt->execute([$user_id, $month]);
    
    // Insert new overall budget if > 0
    if ($overall_budget > 0) {
        $stmt = $pdo->prepare("INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $month, $overall_budget]);
    }
    
    // Handle category budgets
    foreach ($_POST as $key => $value) {
        if (strpos($key, 'category_') === 0 && !empty($value)) {
            $category_id = intval(substr($key, 9));
            $amount = floatval($value);
            
            // Delete existing for this category and month
            $stmt = $pdo->prepare("DELETE FROM budgets WHERE user_id = ? AND month = ? AND category_id = ?");
            $stmt->execute([$user_id, $month, $category_id]);
            
            // Insert new if amount > 0
            if ($amount > 0) {
                $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month, amount) VALUES (?, ?, ?, ?)");
                $stmt->execute([$user_id, $category_id, $month, $amount]);
            }
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Budgets saved successfully!'
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save budgets: ' . $e->getMessage()
    ]);
}