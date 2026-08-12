<?php
// Conditional session start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

require_once 'config/db.php';
require_once 'includes/config_helpers.php';

// Generate CSRF token if not exists
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$user_id = $_SESSION['user_id'];

// Get user settings for theme preference
$stmt = $pdo->prepare("SELECT interface_preference FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();

// Check if user already has a saved preference
if ($settings && !empty($settings['interface_preference'])) {
    // Auto-redirect based on saved preference
    if ($settings['interface_preference'] === 'web') {
        header('Location: web_dashboard.php');
        exit;
    } elseif ($settings['interface_preference'] === 'app') {
        header('Location: app_dashboard.php');
        exit;
    }
}

// Handle interface selection
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['select_interface'])) {
    // Validate CSRF token
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $error = 'Invalid request. Please try again.';
    } else {
        $interface = $_POST['interface'] ?? '';
        $remember = isset($_POST['remember_choice']) ? 1 : 0;
        
        if ($interface === 'web') {
            if ($remember) {
                $stmt = $pdo->prepare("UPDATE user_settings SET interface_preference = 'web' WHERE user_id = ?");
                $stmt->execute([$user_id]);
            }
            $_SESSION['preferred_interface'] = 'web';
            header('Location: web_dashboard.php');
            exit;
        } elseif ($interface === 'app') {
            if ($remember) {
                $stmt = $pdo->prepare("UPDATE user_settings SET interface_preference = 'app' WHERE user_id = ?");
                $stmt->execute([$user_id]);
            }
            $_SESSION['preferred_interface'] = 'app';
            header('Location: app_dashboard.php');
            exit;
        } else {
            $error = 'Please select an interface.';
        }
    }
}

// Get user info
$stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Choose Interface | KITA-LOG</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0f1219;
            --bg-secondary: #1a1f2e;
            --bg-card: #252b3b;
            --bg-hover: #2d3445;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --border-color: #334155;
            --primary: #1a4d6b;
            --primary-light: #2d6f94;
            --accent: #b85c1a;
            --accent-light: #d47a34;
            --success: #2e7d64;
            --danger: #b13e3e;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .gateway-container {
            max-width: 1000px;
            width: 100%;
            padding: 2rem;
        }
        
        .gateway-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .gateway-logo {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .gateway-logo span:first-child {
            color: var(--primary-light);
        }
        
        .gateway-logo span:last-child {
            color: var(--accent);
        }
        
        .gateway-header h1 {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        .gateway-header p {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .interface-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .interface-card {
            background: var(--bg-card);
            border-radius: 1.5rem;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
        }
        
        .interface-card:hover {
            transform: translateY(-4px);
            background: var(--bg-hover);
        }
        
        .interface-card.selected {
            border-color: var(--primary);
            background: var(--bg-hover);
        }
        
        .interface-card.selected::after {
            content: '✓';
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            color: white;
        }
        
        .interface-icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            border-radius: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }
        
        .interface-icon i {
            font-size: 3rem;
            color: white;
        }
        
        .interface-card h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: var(--text-primary);
        }
        
        .interface-card p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            line-height: 1.5;
            margin-bottom: 1rem;
        }
        
        .interface-features {
            text-align: left;
            font-size: 0.75rem;
            color: var(--text-secondary);
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .interface-features li {
            padding: 0.4rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .interface-features li i {
            font-size: 0.7rem;
            color: var(--primary-light);
            width: 20px;
        }
        
        .gateway-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .btn-gateway {
            padding: 0.9rem 2.5rem;
            border-radius: 2rem;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-family: 'Inter', sans-serif;
        }
        
        .btn-primary-gateway {
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            color: white;
        }
        
        .btn-primary-gateway:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(26, 77, 107, 0.3);
        }
        
        .btn-secondary-gateway {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
        }
        
        .btn-secondary-gateway:hover {
            border-color: var(--primary-light);
            color: var(--text-primary);
        }
        
        .remember-option {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.85rem;
        }
        
        .remember-option label {
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
        }
        
        .remember-option input {
            width: 18px;
            height: 18px;
            accent-color: var(--primary);
            cursor: pointer;
        }
        
        .alert {
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            margin-bottom: 1rem;
            font-size: 0.8rem;
            background: rgba(177, 62, 62, 0.15);
            border: 1px solid rgba(177, 62, 62, 0.3);
            color: #f87171;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .gateway-container {
                padding: 1rem;
            }
            
            .interface-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .interface-card {
                padding: 1.5rem;
            }
            
            .interface-icon {
                width: 80px;
                height: 80px;
            }
            
            .interface-icon i {
                font-size: 2.5rem;
            }
            
            .interface-card h3 {
                font-size: 1.25rem;
            }
            
            .gateway-header h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="gateway-container">
        <div class="gateway-header">
            <div class="gateway-logo">
                <span>KITA</span><span>-LOG</span>
            </div>
            <h1>Welcome, <?php echo htmlspecialchars($user['username'] ?? 'User'); ?>!</h1>
            <p>Choose your preferred interface to continue</p>
        </div>
        
        <?php if (isset($error)): ?>
            <div class="alert"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <form method="post" id="interfaceForm">
            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
            <input type="hidden" name="interface" id="selectedInterface" value="">
            
            <div class="interface-grid">
                <div class="interface-card" data-interface="web">
                    <div class="interface-icon">
                        <i class="fas fa-desktop"></i>
                    </div>
                    <h3>Web Dashboard</h3>
                    <p>Full-featured desktop experience optimized for productivity</p>
                    <ul class="interface-features">
                        <li><i class="fas fa-check"></i> Sidebar navigation with all menus</li>
                        <li><i class="fas fa-check"></i> Advanced reporting and analytics</li>
                        <li><i class="fas fa-check"></i> Multi-window workflow support</li>
                        <li><i class="fas fa-check"></i> Keyboard shortcuts for power users</li>
                        <li><i class="fas fa-check"></i> Full screen data visualization</li>
                    </ul>
                </div>
                
                <div class="interface-card" data-interface="app">
                    <div class="interface-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3>Mobile App</h3>
                    <p>Touch-optimized experience for on-the-go management</p>
                    <ul class="interface-features">
                        <li><i class="fas fa-check"></i> Bottom navigation for thumb-friendly access</li>
                        <li><i class="fas fa-check"></i> Floating action button for quick transactions</li>
                        <li><i class="fas fa-check"></i> Scroll position memory for seamless browsing</li>
                        <li><i class="fas fa-check"></i> Touch-optimized controls and gestures</li>
                        <li><i class="fas fa-check"></i> Mobile-optimized charts and layouts</li>
                    </ul>
                </div>
            </div>
            
            <div class="remember-option">
                <label>
                    <input type="checkbox" name="remember_choice" id="rememberChoice" checked> Remember my choice for future sessions
                </label>
            </div>
            
            <div class="gateway-actions">
                <button type="button" class="btn-gateway btn-secondary-gateway" onclick="window.location.href='logout.php'">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
                <button type="submit" name="select_interface" class="btn-gateway btn-primary-gateway">
                    Continue <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </form>
    </div>
    
    <script>
        let selectedInterface = null;
        
        document.querySelectorAll('.interface-card').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.interface-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                selectedInterface = this.dataset.interface;
                document.getElementById('selectedInterface').value = selectedInterface;
            });
        });
        
        document.getElementById('interfaceForm').addEventListener('submit', function(e) {
            if (!selectedInterface) {
                e.preventDefault();
                alert('Please select an interface to continue');
            }
        });
    </script>
</body>
</html>