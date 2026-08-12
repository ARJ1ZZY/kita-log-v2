<?php
$current_page = 'profile';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$is_app = strpos($_SERVER['HTTP_USER_AGENT'], 'KITA-LOG-APP') !== false;

require 'includes/auth.php';
require 'config/db.php';
require_once 'includes/config_helpers.php';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$user_id = $_SESSION['user_id'];
$message = '';
$error = '';
$app_version = config('app_version', '1.0.0');

$stmt = $pdo->prepare("SELECT username, company_name, created_at FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM sales WHERE user_id = ?");
$stmt->execute([$user_id]);
$total_sales = $stmt->fetch()['total'];

$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM expenses WHERE user_id = ?");
$stmt->execute([$user_id]);
$total_expenses = $stmt->fetch()['total'];

$stmt = $pdo->prepare("SELECT COUNT(DISTINCT DATE_FORMAT(sale_date, '%Y-%m')) as months FROM sales WHERE user_id = ?");
$stmt->execute([$user_id]);
$active_months = $stmt->fetch()['months'];

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_company'])) {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $error = 'Invalid request. Please try again.';
    } else {
        $company_name = trim($_POST['company_name']);
        if (empty($company_name)) {
            $error = 'Company name cannot be empty.';
        } else {
            $stmt = $pdo->prepare("UPDATE users SET company_name = ? WHERE id = ?");
            if ($stmt->execute([$company_name, $user_id])) {
                $message = 'Company name updated successfully.';
                $user['company_name'] = $company_name;
            } else {
                $error = 'Failed to update company name.';
            }
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['change_password'])) {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $error = 'Invalid request. Please try again.';
    } else {
        $current_password = $_POST['current_password'];
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];

        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $db_password = $stmt->fetch()['password'];

        if (!password_verify($current_password, $db_password)) {
            $error = 'Current password is incorrect.';
        } elseif (strlen($new_password) < 6) {
            $error = 'New password must be at least 6 characters.';
        } elseif ($new_password !== $confirm_password) {
            $error = 'New passwords do not match.';
        } else {
            $hashed = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            if ($stmt->execute([$hashed, $user_id])) {
                $message = 'Password changed successfully.';
            } else {
                $error = 'Failed to update password.';
            }
        }
    }
}

include 'includes/header_new.php';
?>

<style>
.profile-stats {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin: 20px 0;
    padding: 16px 0;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
}

.profile-stat {
    text-align: center;
}

.profile-stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
}

.profile-stat-label {
    font-size: 0.6rem;
    color: var(--text-secondary);
}

.app-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    overflow: hidden;
    margin-bottom: 16px;
}

.app-card-header {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
}

.app-card-header h5 {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
}

.app-card-header h5 i {
    color: var(--primary-light);
    margin-right: 8px;
}

.app-card-body {
    padding: 16px;
}

.form-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.form-control {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    font-size: 0.9rem;
    background: var(--bg-input);
    color: var(--text-primary);
    transition: all 0.2s;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-light);
    background: var(--bg-hover);
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 40px;
    font-weight: 600;
    width: 100%;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:active {
    transform: scale(0.98);
}

.alert {
    padding: 12px 16px;
    border-radius: 16px;
    margin-bottom: 16px;
    font-size: 0.85rem;
}

.alert-success {
    background: rgba(46, 125, 100, 0.2);
    color: var(--success);
}

.alert-danger {
    background: rgba(177, 62, 62, 0.2);
    color: var(--danger);
}

.user-avatar {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}

.user-avatar i {
    font-size: 4rem;
    color: var(--primary-light);
}

.user-name {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--text-primary);
}

.user-joined {
    text-align: center;
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-bottom: 16px;
}

@media (max-width: 768px) {
    .profile-stats {
        gap: 20px;
    }
    .profile-stat-value {
        font-size: 1rem;
    }
}
</style>

<div class="page-content">
    <div class="app-card">
        <div class="app-card-body">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-name"><?php echo htmlspecialchars($user['username']); ?></div>
            <div class="user-joined">Member since <?php echo date('F j, Y', strtotime($user['created_at'])); ?></div>
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value"><?php echo $total_sales; ?></div>
                    <div class="profile-stat-label">Sales</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value"><?php echo $total_expenses; ?></div>
                    <div class="profile-stat-label">Expenses</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value"><?php echo $active_months ?: 0; ?></div>
                    <div class="profile-stat-label">Active Months</div>
                </div>
            </div>
            <div style="text-align: center; font-size: 0.7rem; color: var(--text-secondary);">
                <i class="fas fa-code-branch"></i> Version <?php echo $app_version; ?>
            </div>
        </div>
    </div>

    <?php if ($message): ?>
        <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>

    <div class="app-card">
        <div class="app-card-header">
            <h5><i class="fas fa-building"></i> Company Information</h5>
        </div>
        <div class="app-card-body">
            <form method="post">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" name="company_name" class="form-control" value="<?php echo htmlspecialchars($user['company_name']); ?>" required>
                </div>
                <button type="submit" name="update_company" class="btn-primary">
                    <i class="fas fa-save me-2"></i>Update Company Name
                </button>
            </form>
        </div>
    </div>

    <div class="app-card">
        <div class="app-card-header">
            <h5><i class="fas fa-lock"></i> Security Settings</h5>
        </div>
        <div class="app-card-body">
            <form method="post">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                <div class="form-group">
                    <label class="form-label">Current Password</label>
                    <input type="password" name="current_password" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">New Password (min. 6 characters)</label>
                    <input type="password" name="new_password" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Confirm New Password</label>
                    <input type="password" name="confirm_password" class="form-control" required>
                </div>
                <button type="submit" name="change_password" class="btn-primary">
                    <i class="fas fa-save me-2"></i>Change Password
                </button>
            </form>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>