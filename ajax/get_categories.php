<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$stmt = $pdo->query("SELECT id, name FROM expense_categories ORDER BY name");
$categories = $stmt->fetchAll();

echo json_encode(['success' => true, 'categories' => $categories]);
?>