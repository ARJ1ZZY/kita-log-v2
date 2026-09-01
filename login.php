<?php
require_once 'config/db.php';
require_once 'includes/config_helpers.php';

if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (empty($_SESSION['csrf_token'])) { $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); }

if (isset($_SESSION['user_id'])) {
    header('Location: app_dashboard.php');
    exit;
}

$login_error = '';
$register_errors = [];
$login_success = '';
$form_type = 'login';
$custom_business = '';

if (isset($_POST['login_submit'])) {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $login_error = 'Invalid request. Please try again.';
    } else {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        if (!empty($username) && !empty($password)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                header('Location: app_dashboard.php');
                exit;
            } else { $login_error = 'Invalid username or password.'; }
        } else { $login_error = 'Please fill in both fields.'; }
    }
}

if (isset($_POST['register_submit'])) {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $register_errors[] = 'Invalid request. Please try again.';
    } else {
        $company_name = trim($_POST['company_name']);
        $business_type = $_POST['business_type'] ?? 'sari_sari';
        if ($business_type === 'custom' && !empty($_POST['custom_business'])) {
            $business_type = trim($_POST['custom_business']);
            $custom_business = $business_type;
        }
        $username = trim($_POST['username']);
        $password = $_POST['password'];
        $confirm = $_POST['confirm_password'];

        if (empty($company_name) || empty($username) || empty($password) || empty($confirm)) { $register_errors[] = 'All fields are required.'; }
        if ($password !== $confirm) { $register_errors[] = 'Passwords do not match.'; }
        if (strlen($password) < 6) { $register_errors[] = 'Password must be at least 6 characters.'; }
        if ($business_type === 'custom' && empty($_POST['custom_business'])) { $register_errors[] = 'Please specify your business type.'; }

        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) { $register_errors[] = 'Username already taken.'; }

        if (empty($register_errors)) {
            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (company_name, business_type, username, password) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$company_name, $business_type, $username, $hashed])) {
                $user_id = $pdo->lastInsertId();
                $stmt = $pdo->prepare("INSERT INTO user_settings (user_id, currency_symbol, date_format) VALUES (?, ?, ?)");
                $stmt->execute([$user_id, config('currency', '₱'), config('date_format', 'Y-m-d')]);
                $form_type = 'login';
                $login_success = 'Registration successful! Please log in.';
            } else { $register_errors[] = 'Registration failed.'; }
        } else { $form_type = 'register'; }
    }
}

if ((isset($_POST['register_submit']) && !empty($register_errors)) || isset($_GET['register'])) { $form_type = 'register'; }
else { $form_type = 'login'; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes">
    <title>KITA-LOG | Smart Business Management</title>
    <!-- Favicon - KITA-LOG logo only -->
<link rel="icon" type="image/png" href="assets/images/logo-only.png">
<link rel="apple-touch-icon" href="assets/images/logo-only.png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #E8EDF3;
            --bg-secondary: #F3F6FA;
            --bg-card: #FFFFFF;
            --bg-hover: rgba(0, 56, 109, 0.05);
            --text-primary: #00386D;
            --text-secondary: #4A5568;
            --border-color: #BDBCBD;
            --primary: #6699CC;
            --primary-dark: #4A7BA8;
            --primary-glow: rgba(102, 153, 204, 0.2);
            --success: #10B981;
            --danger: #EF4444;
            --accent: #b85c1a;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .split-container {
            display: flex;
            width: 100vw;
            height: 100vh;
            background: var(--bg-primary);
            overflow: hidden;
        }
        
        .image-side {
            flex: 1;
            background-image: url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80');
            background-size: cover;
            background-position: center;
            position: relative;
            display: none;
        }
        
        .image-side::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(0, 56, 109, 0.85), rgba(74, 123, 168, 0.75));
        }
        
        .image-content {
            position: relative;
            z-index: 1;
            color: white;
            padding: 3rem;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }
        
        .image-content h2 {
            font-weight: 800;
            font-size: 2rem;
            margin-bottom: 0.5rem;
            letter-spacing: -0.3px;
        }
        
        .image-content p {
            font-size: 0.9rem;
            opacity: 0.85;
            line-height: 1.5;
        }
        
        .form-side {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: var(--bg-primary);
        }
        
        .form-container {
            width: 100%;
            max-width: 420px;
            min-height: auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .form-content {
            width: 100%;
            transition: opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        
        .form-hidden { display: none; }
        .form-visible { display: block; animation: formSlideIn 0.4s cubic-bezier(0.4,0,0.2,1); }
        
        @keyframes formSlideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .form-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .form-header h2 {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .form-header p {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .input-group-modern {
            margin-bottom: 1rem;
            position: relative;
        }
        
        .input-group-modern input {
            width: 100%;
            padding: 0.85rem 1rem 0.85rem 2.8rem;
            border: 1.5px solid var(--border-color);
            border-radius: 0.85rem;
            font-size: 0.9rem;
            transition: all 0.2s;
            background: var(--bg-card);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
        }
        
        .input-group-modern input::placeholder {
            color: var(--text-secondary);
            font-size: 0.85rem;
        }
        
        .input-group-modern input:focus {
            border-color: var(--primary);
            background: var(--bg-card);
            box-shadow: 0 0 0 4px var(--primary-glow);
            outline: none;
        }
        
        .input-group-modern i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            font-size: 1rem;
            transition: color 0.2s;
            pointer-events: none;
        }
        
        .input-group-modern input:focus + i {
            color: var(--primary);
        }
        
        .radio-group-modern {
            margin-bottom: 1rem;
        }
        
        .radio-group-modern label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.6rem;
            display: block;
        }
        
        .radio-options-modern {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }
        
        .radio-option-modern {
            flex: 1;
            min-width: 100px;
            position: relative;
        }
        
        .radio-option-modern input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .radio-option-modern span {
            display: block;
            padding: 0.65rem 0.5rem;
            text-align: center;
            background: var(--bg-card);
            border: 1.5px solid var(--border-color);
            border-radius: 2rem;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--text-secondary);
            transition: all 0.2s;
            cursor: pointer;
        }
        
        .radio-option-modern input:checked + span {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border-color: transparent;
            color: white;
        }
        
        .radio-option-modern:hover span {
            border-color: var(--primary);
            background: var(--bg-hover);
        }
        
        .custom-business-input {
            margin-top: 0.75rem;
            display: none;
        }
        
        .custom-business-input.show {
            display: block;
            animation: slideDown 0.2s ease;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-business-input input {
            width: 100%;
            padding: 0.7rem 1rem;
            border: 1.5px solid var(--border-color);
            border-radius: 0.85rem;
            font-size: 0.85rem;
            background: var(--bg-card);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
        }
        
        .custom-business-input input:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px var(--primary-glow);
        }
        
        .btn-modern {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border: none;
            color: white;
            padding: 0.85rem;
            font-weight: 600;
            border-radius: 0.85rem;
            width: 100%;
            transition: all 0.2s;
            margin-top: 0.75rem;
            font-size: 0.9rem;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .btn-modern:active {
            transform: scale(0.97);
            background: linear-gradient(135deg, var(--primary-dark), var(--primary));
        }
        
        .toggle-link-modern {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .toggle-link-modern a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            transition: color 0.2s;
        }
        
        .toggle-link-modern a:hover {
            color: var(--primary-dark);
        }
        
        .alert-modern {
            border-radius: 0.85rem;
            border: none;
            margin-bottom: 1.25rem;
            padding: 0.7rem 1rem;
            font-size: 0.8rem;
            animation: alertSlide 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        @keyframes alertSlide {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .alert-modern.alert-danger {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
            border-left: 3px solid var(--danger);
        }
        
        .alert-modern.alert-success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border-left: 3px solid var(--success);
        }
        
        ul { margin-bottom: 0; padding-left: 1rem; }
        ul li { font-size: 0.75rem; }
        small.text-muted { font-size: 0.65rem; margin-top: 0.25rem; display: block; color: var(--text-secondary) !important; }
        
        @media (min-width: 768px) { .image-side { display: block; } }
        
        @media (max-width: 900px) {
            .split-container { flex-direction: column; }
            .image-side { display: none; }
            .form-side { padding: 2rem; }
            .form-container { max-width: 100%; }
        }
        
        @media (max-width: 480px) {
            .form-side { padding: 1.5rem; }
            .form-header h2 { font-size: 1.5rem; }
            .radio-options-modern { flex-direction: column; }
            .radio-option-modern { min-width: auto; }
        }
    </style>
</head>
<body>
    <div class="split-container">
        <div class="image-side">
            <div class="image-content">
                <h2>KITA-LOG</h2>
                <p>Track your small business finances with ease. Simple, fast, and secure.</p>
            </div>
        </div>
        <div class="form-side">
            <div class="form-container">
                <div id="loginForm" class="form-content <?php echo $form_type == 'login' ? 'form-visible' : 'form-hidden'; ?>">
                    <div class="form-header">
                        <h2>Welcome back</h2>
                        <p>Log in to your account</p>
                    </div>
                    <?php if (!empty($login_error)): ?>
                        <div class="alert-modern alert-danger"><i class="fas fa-exclamation-circle"></i> <?php echo htmlspecialchars($login_error); ?></div>
                    <?php endif; ?>
                    <?php if (!empty($login_success)): ?>
                        <div class="alert-modern alert-success"><i class="fas fa-check-circle"></i> <?php echo htmlspecialchars($login_success); ?></div>
                    <?php endif; ?>
                    <form method="post">
                        <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                        <div class="input-group-modern">
                            <input type="text" id="login_username" name="username" placeholder="Username" required autofocus>
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="input-group-modern">
                            <input type="password" id="login_password" name="password" placeholder="Password" required>
                            <i class="fas fa-lock"></i>
                        </div>
                        <button type="submit" name="login_submit" class="btn-modern"><i class="fas fa-arrow-right-to-bracket"></i> Sign In</button>
                    </form>
                    <div class="toggle-link-modern">Don't have an account? <a onclick="switchForm('register')">Create account</a></div>
                </div>
                <div id="registerForm" class="form-content <?php echo $form_type == 'register' ? 'form-visible' : 'form-hidden'; ?>">
                    <div class="form-header">
                        <h2>Create account</h2>
                        <p>Start managing your business today</p>
                    </div>
                    <?php if (!empty($register_errors)): ?>
                        <div class="alert-modern alert-danger">
                            <i class="fas fa-exclamation-circle"></i>
                            <ul><?php foreach ($register_errors as $err): ?><li><?php echo htmlspecialchars($err); ?></li><?php endforeach; ?></ul>
                        </div>
                    <?php endif; ?>
                    <form method="post">
                        <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                        <div class="input-group-modern">
                            <input type="text" id="register_company" name="company_name" placeholder="Company Name" value="<?php echo htmlspecialchars($_POST['company_name'] ?? ''); ?>" required>
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="radio-group-modern">
                            <label>Business Type</label>
                            <div class="radio-options-modern">
                                <label class="radio-option-modern"><input type="radio" name="business_type" value="sari_sari" <?php echo ($_POST['business_type'] ?? '') == 'sari_sari' ? 'checked' : ''; ?> required><span>Sari-sari Store</span></label>
                                <label class="radio-option-modern"><input type="radio" name="business_type" value="ukay_ukay" <?php echo ($_POST['business_type'] ?? '') == 'ukay_ukay' ? 'checked' : ''; ?>><span>Ukay-ukay</span></label>
                                <label class="radio-option-modern"><input type="radio" name="business_type" value="online" <?php echo ($_POST['business_type'] ?? '') == 'online' ? 'checked' : ''; ?>><span>Online Store</span></label>
                                <label class="radio-option-modern"><input type="radio" name="business_type" value="custom" id="customBusinessRadio" <?php echo ($_POST['business_type'] ?? '') == 'custom' ? 'checked' : ''; ?>><span>Other (Specify)</span></label>
                            </div>
                            <div class="custom-business-input" id="customBusinessInput"><input type="text" name="custom_business" placeholder="Enter your business type" value="<?php echo htmlspecialchars($custom_business); ?>"></div>
                        </div>
                        <div class="input-group-modern">
                            <input type="text" id="register_username" name="username" placeholder="Username" value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>" required>
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="input-group-modern">
                            <input type="password" id="register_password" name="password" placeholder="Password" required>
                            <i class="fas fa-lock"></i>
                        </div>
                        <div class="input-group-modern">
                            <input type="password" id="register_confirm" name="confirm_password" placeholder="Confirm Password" required>
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <small class="text-muted">Password must be at least 6 characters</small>
                        <button type="submit" name="register_submit" class="btn-modern"><i class="fas fa-user-plus"></i> Create Account</button>
                    </form>
                    <div class="toggle-link-modern">Already have an account? <a onclick="switchForm('login')">Sign in</a></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        function switchForm(type) {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (type === 'login') {
                registerForm.classList.remove('form-visible');
                registerForm.classList.add('form-hidden');
                loginForm.classList.remove('form-hidden');
                loginForm.classList.add('form-visible');
            } else {
                loginForm.classList.remove('form-visible');
                loginForm.classList.add('form-hidden');
                registerForm.classList.remove('form-hidden');
                registerForm.classList.add('form-visible');
            }
        }
        
        const customRadio = document.getElementById('customBusinessRadio');
        const customInput = document.getElementById('customBusinessInput');
        function toggleCustomInput() {
            if (customRadio && customInput) {
                if (customRadio.checked) {
                    customInput.classList.add('show');
                } else {
                    customInput.classList.remove('show');
                }
            }
        }
        if (customRadio) {
            const allRadios = document.querySelectorAll('input[name="business_type"]');
            allRadios.forEach(radio => { radio.addEventListener('change', toggleCustomInput); });
            toggleCustomInput();
        }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>