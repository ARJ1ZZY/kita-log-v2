<?php
// Conditional session start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    // Detect platform for redirect
    function detectPlatform() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        if (strpos($user_agent, 'KITA-LOG-APP') !== false) {
            return 'app';
        }
        
        return 'web';
    }
    
    $platform = detectPlatform();
    
    if ($platform === 'app') {
        header('Location: app_dashboard.php');
    } else {
        header('Location: web_dashboard.php');
    }
    exit;
}
?>