<?php
require_once '../includes/auth.php';
require_once '../config/db.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$message = strtolower(trim($_POST['message'] ?? ''));

if (empty($message)) {
    echo json_encode(['success' => false, 'error' => 'Message is empty']);
    exit;
}

// Get all responses from database
$stmt = $pdo->query("SELECT * FROM chatbot_responses");
$responses = $stmt->fetchAll();

$best_match = null;
$highest_score = 0;

foreach ($responses as $response) {
    $keywords = explode(',', $response['keywords']);
    $score = 0;
    
    foreach ($keywords as $keyword) {
        $keyword = trim($keyword);
        if (strpos($message, $keyword) !== false) {
            $score += 10;
        }
    }
    
    if ($score > $highest_score) {
        $highest_score = $score;
        $best_match = $response['response'];
    }
}

// If no match found
if (!$best_match || $highest_score < 5) {
    // Get some quick stats to help
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM sales WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $sales_count = $stmt->fetch()['count'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM expenses WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $expenses_count = $stmt->fetch()['count'];
    
    $best_match = "I'm not sure about that. But I can tell you have $sales_count sales and $expenses_count expenses recorded. Try asking about 'sales', 'expenses', 'inventory', or 'reports'!";
}

echo json_encode([
    'success' => true,
    'response' => $best_match,
    'timestamp' => date('h:i A')
]);