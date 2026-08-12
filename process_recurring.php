// Process recurring transactions (silently)
include 'process_recurring.php';

<?php
// process_recurring.php - silent processor
if (!isset($pdo)) {
    require 'config/db.php';
}
if (!isset($user_id)) {
    // If called standalone, we need user_id – but we'll process all users
    // For simplicity, we'll process all active recurring transactions for any user
    $stmt = $pdo->query("SELECT * FROM recurring_transactions WHERE active = 1 AND next_date <= CURDATE()");
} else {
    // Called from dashboard, process only this user
    $stmt = $pdo->prepare("SELECT * FROM recurring_transactions WHERE user_id = ? AND active = 1 AND next_date <= ?");
    $stmt->execute([$user_id, date('Y-m-d')]);
}
$recurrings = $stmt->fetchAll();

foreach ($recurrings as $r) {
    $uid = $r['user_id'];
    $type = $r['type'];
    $amount = $r['amount'];
    $description = $r['description'];
    $cat_id = $r['category_id'];
    $next_date = $r['next_date'];
    $freq = $r['frequency'];
    $end_date = $r['end_date'];

    // Create transaction
    if ($type == 'sale') {
        $stmt2 = $pdo->prepare("INSERT INTO sales (user_id, amount, description, sale_date) VALUES (?, ?, ?, ?)");
        $stmt2->execute([$uid, $amount, $description, $next_date]);
    } else {
        $stmt2 = $pdo->prepare("INSERT INTO expenses (user_id, amount, description, expense_date, category_id) VALUES (?, ?, ?, ?, ?)");
        $stmt2->execute([$uid, $amount, $description, $next_date, $cat_id]);
    }

    // Calculate next date
    $new_next = null;
    switch ($freq) {
        case 'daily': $new_next = date('Y-m-d', strtotime($next_date . ' +1 day')); break;
        case 'weekly': $new_next = date('Y-m-d', strtotime($next_date . ' +1 week')); break;
        case 'monthly': $new_next = date('Y-m-d', strtotime($next_date . ' +1 month')); break;
        case 'yearly': $new_next = date('Y-m-d', strtotime($next_date . ' +1 year')); break;
    }

    if ($end_date && $new_next > $end_date) {
        $pdo->prepare("UPDATE recurring_transactions SET active = 0 WHERE id = ?")->execute([$r['id']]);
    } else {
        $pdo->prepare("UPDATE recurring_transactions SET next_date = ? WHERE id = ?")->execute([$new_next, $r['id']]);
    }
}