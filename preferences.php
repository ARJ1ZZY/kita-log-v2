<?php
$current_page = 'preferences';
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

$stmt = $pdo->prepare("SELECT * FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();

if (!$settings) {
    $stmt = $pdo->prepare("INSERT INTO user_settings (user_id, currency_symbol, date_format, first_day_of_week) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, config('currency', '₱'), config('date_format', 'Y-m-d'), 0]);
    $stmt = $pdo->prepare("SELECT * FROM user_settings WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $settings = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $error = 'Invalid request. Please try again.';
    } else {
        $currency = $_POST['currency_symbol'] ?? config('currency', '₱');
        $date_format = $_POST['date_format'] ?? config('date_format', 'Y-m-d');
        $first_day = $_POST['first_day_of_week'] ?? 0;

        $stmt = $pdo->prepare("UPDATE user_settings SET currency_symbol = ?, date_format = ?, first_day_of_week = ? WHERE user_id = ?");
        if ($stmt->execute([$currency, $date_format, $first_day, $user_id])) {
            $message = 'Preferences saved successfully.';
            $settings['currency_symbol'] = $currency;
            $settings['date_format'] = $date_format;
            $settings['first_day_of_week'] = $first_day;
        } else {
            $error = 'Failed to save preferences.';
        }
    }
}

$currency = $settings['currency_symbol'] ?? config('currency', '₱');
$date_format = $settings['date_format'] ?? config('date_format', 'Y-m-d');
$first_day = $settings['first_day_of_week'] ?? 0;

include 'includes/header_new.php';
?>

<style>
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

.form-select {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    font-size: 0.9rem;
    background: var(--bg-input);
    color: var(--text-primary);
    transition: all 0.2s;
}

.form-select:focus {
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

.preview-card {
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid var(--border-color);
}

.preview-card p {
    margin-bottom: 8px;
    color: var(--text-primary);
}

.preview-card p strong {
    color: var(--text-secondary);
}

@media (max-width: 768px) {
    .app-card-body {
        padding: 12px;
    }
}
</style>

<div class="page-content">
    <div class="app-card">
        <div class="app-card-header">
            <h5><i class="fas fa-cog"></i> Preferences</h5>
        </div>
        <div class="app-card-body">
            <?php if ($message): ?>
                <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <form method="post">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                
                <div class="form-group">
                    <label class="form-label">Currency Symbol</label>
                    <select name="currency_symbol" class="form-select">
                        <option value="$" <?php echo $currency == '$' ? 'selected' : ''; ?>>$ (USD)</option>
                        <option value="₱" <?php echo $currency == '₱' ? 'selected' : ''; ?>>₱ (PHP)</option>
                        <option value="€" <?php echo $currency == '€' ? 'selected' : ''; ?>>€ (Euro)</option>
                        <option value="£" <?php echo $currency == '£' ? 'selected' : ''; ?>>£ (GBP)</option>
                        <option value="¥" <?php echo $currency == '¥' ? 'selected' : ''; ?>>¥ (JPY)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Date Format</label>
                    <select name="date_format" class="form-select">
                        <option value="Y-m-d" <?php echo $date_format == 'Y-m-d' ? 'selected' : ''; ?>>YYYY-MM-DD (2026-03-26)</option>
                        <option value="d-m-Y" <?php echo $date_format == 'd-m-Y' ? 'selected' : ''; ?>>DD-MM-YYYY (26-03-2026)</option>
                        <option value="m/d/Y" <?php echo $date_format == 'm/d/Y' ? 'selected' : ''; ?>>MM/DD/YYYY (03/26/2026)</option>
                        <option value="d/m/Y" <?php echo $date_format == 'd/m/Y' ? 'selected' : ''; ?>>DD/MM/YYYY (26/03/2026)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">First Day of Week</label>
                    <select name="first_day_of_week" class="form-select">
                        <option value="0" <?php echo $first_day == 0 ? 'selected' : ''; ?>>Sunday</option>
                        <option value="1" <?php echo $first_day == 1 ? 'selected' : ''; ?>>Monday</option>
                    </select>
                </div>

                <div class="preview-card">
                    <p><strong>Preview</strong></p>
                    <p>Current date: 
                        <?php 
                        $today = date('Y-m-d');
                        switch ($date_format) {
                            case 'd-m-Y': echo date('d-m-Y'); break;
                            case 'm/d/Y': echo date('m/d/Y'); break;
                            case 'd/m/Y': echo date('d/m/Y'); break;
                            default: echo date('Y-m-d');
                        }
                        ?>
                    </p>
                    <p>Current time: <?php echo date('h:i A'); ?></p>
                    <p>Currency: <?php echo $currency; ?> 1,234.56</p>
                    <p>First day: <?php echo $first_day == 0 ? 'Sunday' : 'Monday'; ?></p>
                </div>

                <button type="submit" class="btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-save me-2"></i>Save Preferences
                </button>
            </form>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>