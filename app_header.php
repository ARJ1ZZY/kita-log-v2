<?php
$current_page = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes">
    <title>KITA-LOG</title>
    
    <!-- Favicon - KITA-LOG logo only -->
    <link rel="icon" type="image/png" href="assets/images/logo-only.png">
    <link rel="apple-touch-icon" href="assets/images/logo-only.png">
    
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- BUWAD Typography -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- BUWAD Theme CSS -->
    <link rel="stylesheet" href="assets/css/theme.css">
    
    <!-- Page Animations CSS -->
    <link rel="stylesheet" href="assets/css/animations.css">
    
    <style>
        /* Light mode only */
        html, body {
            background-color: #E8EDF3;
            min-height: 100vh;
        }
        
        :root {
            --bg-canvas: #E8EDF3;
            --bg-card: #FFFFFF;
            --bg-hover: rgba(0, 56, 109, 0.05);
            --bg-input: #FFFFFF;
            --bg-secondary: #F3F6FA;
            --text-primary: #00386D;
            --text-secondary: #4A5568;
            --border-color: #BDBCBD;
            --primary: #6699CC;
            --primary-dark: #4A7BA8;
            --success: #10B981;
            --danger: #EF4444;
            --warning: #F59E0B;
        }
    </style>
</head>
<body>

<!-- Clean Minimal Header -->
<header class="app-header">
    <div class="logo">
        <span class="logo-kita">KITA</span><span class="logo-log">-LOG</span>
    </div>
</header>

<style>
/* Clean Header Styles */
.app-header {
    background: var(--bg-card);
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}

.logo {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    text-align: center;
}

.logo-kita {
    color: var(--primary-light);
}

.logo-log {
    color: var(--warning);
}

.app-header h1 {
    display: none;
}

@media (max-width: 600px) {
    .app-header {
        padding: 12px 16px;
    }
    
    .logo {
        font-size: 1.4rem;
    }
}
</style>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>