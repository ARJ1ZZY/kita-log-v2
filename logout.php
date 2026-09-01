<?php
session_start();

// Clear session
$_SESSION = array();
session_destroy();

// No output before headers
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logging out - KITA-LOG</title>
    <!-- Favicon - KITA-LOG logo only -->
<link rel="icon" type="image/png" href="assets/images/logo-only.png">
<link rel="apple-touch-icon" href="assets/images/logo-only.png">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts (Inter) -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #E8EDF3;
            --bg-secondary: #F3F6FA;
            --bg-card: #FFFFFF;
            --text-primary: #00386D;
            --text-secondary: #4A5568;
            --border-color: #BDBCBD;
            --primary: #6699CC;
            --primary-light: #4A7BA8;
            --border-radius: 1rem;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        
        .logout-card {
            background: var(--bg-card);
            border-radius: var(--border-radius);
            box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.08);
            padding: 3rem 2rem;
            text-align: center;
            max-width: 400px;
            width: 100%;
            border: 1px solid var(--border-color);
        }
        
        .spinner {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            border: 5px solid rgba(102, 153, 204, 0.2);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        h2 {
            color: var(--text-primary);
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        p {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }
        
        .progress {
            background: var(--bg-secondary);
            border-radius: 1rem;
            overflow: hidden;
        }
        
        .progress-bar {
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
        }
    </style>
</head>
<body>
    <div class="logout-card" id="logoutCard">
        <div class="spinner"></div>
        <h2>See you soon!</h2>
        <p>You are being safely logged out...</p>
        <div class="progress mt-3" style="height: 4px;">
            <div class="progress-bar" id="progressBar" role="progressbar" style="width: 0%;"></div>
        </div>
    </div>
    
    <script>
        let progress = 0;
        const progressBar = document.getElementById('progressBar');
        const card = document.getElementById('logoutCard');
        
        const interval = setInterval(() => {
            progress += 2;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                card.classList.add('fade-out');
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 500);
            }
        }, 30);
    </script>
</body>
</html>