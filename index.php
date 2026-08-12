
<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }

if (isset($_SESSION['user_id'])) {
    header('Location: app_dashboard.php');
} else {
    header('Location: login.php');
}
exit;
?>