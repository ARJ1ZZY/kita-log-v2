<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }

require 'config/db.php';
require_once 'includes/config_helpers.php';

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT username, company_name FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_settings'])) {
    $currency = $_POST['currency_symbol'] ?? '₱';
    $date_format = $_POST['date_format'] ?? 'Y-m-d';
    
    $stmt = $pdo->prepare("UPDATE user_settings SET currency_symbol = ?, date_format = ? WHERE user_id = ?");
    $stmt->execute([$currency, $date_format, $user_id]);
    $success_message = 'Settings saved successfully!';
}

$stmt = $pdo->prepare("SELECT currency_symbol, date_format FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings['currency_symbol'] ?? '₱';
$date_format = $settings['date_format'] ?? 'Y-m-d';

$current_page = 'settings';
include 'app_header.php';
?>

<div class="app-main page-content" id="settingsContent">

    <!-- Account Section -->
    <div class="settings-section">
        <div class="settings-section-header">
            <i class="fas fa-user-circle"></i>
            <span>Account</span>
        </div>
        <div class="settings-section-body">
            <div class="settings-row">
                <div class="settings-label">Username</div>
                <div class="settings-value"><?php echo htmlspecialchars($user['username']); ?></div>
            </div>
            <div class="settings-row">
                <div class="settings-label">Company Name</div>
                <div class="settings-value"><?php echo htmlspecialchars($user['company_name']); ?></div>
            </div>
            <button class="settings-btn" onclick="showEditProfile()">
                <i class="fas fa-edit"></i> Edit Profile
            </button>
        </div>
    </div>

    <!-- Preferences Section -->
    <div class="settings-section">
        <div class="settings-section-header">
            <i class="fas fa-sliders-h"></i>
            <span>Preferences</span>
        </div>
        <div class="settings-section-body">
            <form method="post">
                <input type="hidden" name="update_settings" value="1">
                <div class="settings-row">
                    <div class="settings-label">Currency</div>
                    <select name="currency_symbol" class="settings-select">
                        <option value="$" <?php echo $currency == '$' ? 'selected' : ''; ?>>$ USD</option>
                        <option value="₱" <?php echo $currency == '₱' ? 'selected' : ''; ?>>₱ PHP</option>
                        <option value="€" <?php echo $currency == '€' ? 'selected' : ''; ?>>€ EUR</option>
                        <option value="£" <?php echo $currency == '£' ? 'selected' : ''; ?>>£ GBP</option>
                        <option value="¥" <?php echo $currency == '¥' ? 'selected' : ''; ?>>¥ JPY</option>
                    </select>
                </div>
                <div class="settings-row">
                    <div class="settings-label">Date Format</div>
                    <select name="date_format" class="settings-select">
                        <option value="Y-m-d" <?php echo $date_format == 'Y-m-d' ? 'selected' : ''; ?>>YYYY-MM-DD</option>
                        <option value="d-m-Y" <?php echo $date_format == 'd-m-Y' ? 'selected' : ''; ?>>DD-MM-YYYY</option>
                        <option value="m/d/Y" <?php echo $date_format == 'm/d/Y' ? 'selected' : ''; ?>>MM/DD/YYYY</option>
                        <option value="d/m/Y" <?php echo $date_format == 'd/m/Y' ? 'selected' : ''; ?>>DD/MM/YYYY</option>
                    </select>
                </div>
                <button type="submit" class="settings-save-btn">Save Preferences</button>
            </form>
        </div>
    </div>

    <!-- Data Section -->
    <div class="settings-section">
        <div class="settings-section-header">
            <i class="fas fa-database"></i>
            <span>Data</span>
        </div>
        <div class="settings-section-body">
            <a href="reports.php" class="settings-link">
                <i class="fas fa-chart-line"></i> View Reports
            </a>
            <a href="backup.php" class="settings-link">
                <i class="fas fa-download"></i> Backup & Restore
            </a>
        </div>
    </div>

    <!-- Session Section -->
    <div class="settings-section">
        <div class="settings-section-header">
            <i class="fas fa-sign-out-alt"></i>
            <span>Session</span>
        </div>
        <div class="settings-section-body">
            <a href="logout.php" class="settings-link logout-link">
                <i class="fas fa-sign-out-alt"></i> Sign Out
            </a>
        </div>
    </div>
</div>

<!-- Edit Profile Modal -->
<div id="editProfileModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <h3>Edit Profile</h3>
            <button class="modal-close" onclick="closeEditProfile()">&times;</button>
        </div>
        <form method="post" action="profile.php">
            <div class="modal-body">
                <div class="field">
                    <label class="field-label">Company Name</label>
                    <input type="text" name="company_name" class="field-input" value="<?php echo htmlspecialchars($user['company_name']); ?>" required>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeEditProfile()">Cancel</button>
                <button type="submit" name="update_company" class="btn-save">Save</button>
            </div>
        </form>
    </div>
</div>

<?php if (isset($success_message)): ?>
<div class="toast-success" id="successToast">
    <i class="fas fa-check-circle"></i> <?php echo $success_message; ?>
</div>
<?php endif; ?>

<style>
.settings-section {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    margin-bottom: 16px;
    overflow: hidden;
}

.settings-section-header {
    padding: 14px 16px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-primary);
}

.settings-section-header i {
    color: var(--primary);
    width: 20px;
}

.settings-section-body {
    padding: 16px;
}

.settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
}

.settings-row:last-child {
    border-bottom: none;
}

.settings-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.settings-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
}

.settings-select {
    padding: 8px 12px;
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 0.8rem;
    cursor: pointer;
}

.settings-select:focus {
    outline: none;
    border-color: var(--primary);
}

.settings-btn {
    width: 100%;
    margin-top: 12px;
    padding: 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 40px;
    color: var(--primary);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.settings-btn:active {
    transform: scale(0.97);
}

.settings-save-btn {
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border: none;
    border-radius: 40px;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
}

.settings-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    text-decoration: none;
    color: var(--text-primary);
    font-size: 0.85rem;
    font-weight: 500;
    border-bottom: 1px solid var(--border-color);
}

.settings-link:last-child {
    border-bottom: none;
}

.settings-link i {
    width: 24px;
    color: var(--primary);
}

.logout-link {
    color: var(--danger);
}

.logout-link i {
    color: var(--danger);
}

.toast-success {
    position: fixed;
    bottom: 90px;
    left: 16px;
    right: 16px;
    background: var(--bg-card);
    border-radius: 60px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 2000;
    animation: slideUp 0.3s ease;
    border-left: 3px solid var(--success);
    font-size: 0.8rem;
    color: var(--success);
}

@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1100;
}

.modal-container {
    background: var(--bg-card);
    border-radius: 24px;
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    border: 1px solid var(--border-color);
}

.modal-header {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
}

.modal-header h3 {
    font-size: 0.9rem;
    margin: 0;
    color: var(--text-primary);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.modal-body {
    padding: 16px;
}

.modal-footer {
    padding: 16px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.field {
    margin-bottom: 16px;
}

.field-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    margin-bottom: 6px;
}

.field-input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--border-color);
    border-radius: 12px;
    font-size: 0.85rem;
    background: var(--bg-input);
    color: var(--text-primary);
}

.btn-cancel {
    padding: 10px 20px;
    border-radius: 40px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
}

.btn-save {
    padding: 10px 20px;
    border-radius: 40px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border: none;
    color: white;
    font-weight: 600;
    cursor: pointer;
}

@media (max-width: 480px) {
    .settings-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }
    
    .settings-select {
        width: 100%;
    }
}
</style>

<script>
function showEditProfile() {
    document.getElementById('editProfileModal').style.display = 'flex';
}

function closeEditProfile() {
    document.getElementById('editProfileModal').style.display = 'none';
}

setTimeout(() => {
    const toast = document.getElementById('successToast');
    if (toast) toast.remove();
}, 3000);

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeEditProfile();
        });
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditProfile();
    }
});
</script>

<?php include 'app_footer.php'; ?>