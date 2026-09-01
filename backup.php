<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }

require 'includes/auth.php';
require 'config/db.php';
require_once 'includes/config_helpers.php';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$user_id = $_SESSION['user_id'];
$message = '';
$error = '';
$app_name = config('app_name', 'KITA-LOG');

if (isset($_GET['export'])) {
    $data = [];

    $stmt = $pdo->prepare("SELECT username, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $data['user'] = $stmt->fetch();

    $stmt = $pdo->prepare("SELECT * FROM sales WHERE user_id = ? ORDER BY sale_date");
    $stmt->execute([$user_id]);
    $data['sales'] = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT e.*, c.name as category_name FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id WHERE e.user_id = ? ORDER BY expense_date");
    $stmt->execute([$user_id]);
    $data['expenses'] = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT b.*, c.name as category_name FROM budgets b LEFT JOIN expense_categories c ON b.category_id = c.id WHERE b.user_id = ?");
    $stmt->execute([$user_id]);
    $data['budgets'] = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT * FROM user_settings WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $data['settings'] = $stmt->fetch();

    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="' . strtolower($app_name) . '_backup_' . date('Y-m-d') . '.json"');
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['import_file'])) {
    if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        $error = 'Invalid request. Please try again.';
    } else {
        $file = $_FILES['import_file'];
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if ($file['error'] == UPLOAD_ERR_OK) {
            if ($file_ext !== 'json') {
                $error = 'Only JSON files are allowed.';
            } elseif ($file['type'] != 'application/json' && $file['type'] != 'text/plain') {
                $error = 'Invalid file type. Please upload a JSON file.';
            } else {
                $json = file_get_contents($file['tmp_name']);
                $data = json_decode($json, true);

                if (!$data) {
                    $error = 'Invalid JSON file.';
                } else {
                    $pdo->beginTransaction();
                    try {
                        $pdo->prepare("DELETE FROM sales WHERE user_id = ?")->execute([$user_id]);
                        $pdo->prepare("DELETE FROM expenses WHERE user_id = ?")->execute([$user_id]);
                        $pdo->prepare("DELETE FROM budgets WHERE user_id = ?")->execute([$user_id]);

                        if (!empty($data['sales'])) {
                            $stmt = $pdo->prepare("INSERT INTO sales (user_id, amount, description, sale_date, created_at) VALUES (?, ?, ?, ?, ?)");
                            foreach ($data['sales'] as $s) {
                                $stmt->execute([$user_id, $s['amount'], $s['description'], $s['sale_date'], $s['created_at']]);
                            }
                        }

                        if (!empty($data['expenses'])) {
                            $stmt = $pdo->prepare("INSERT INTO expenses (user_id, amount, description, expense_date, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?)");
                            foreach ($data['expenses'] as $e) {
                                $stmt->execute([$user_id, $e['amount'], $e['description'], $e['expense_date'], $e['category_id'], $e['created_at']]);
                            }
                        }

                        if (!empty($data['budgets'])) {
                            $stmt = $pdo->prepare("INSERT INTO budgets (user_id, category_id, month, amount, created_at) VALUES (?, ?, ?, ?, ?)");
                            foreach ($data['budgets'] as $b) {
                                $stmt->execute([$user_id, $b['category_id'], $b['month'], $b['amount'], $b['created_at']]);
                            }
                        }

                        if (!empty($data['settings'])) {
                            $stmt = $pdo->prepare("UPDATE user_settings SET currency_symbol = ?, date_format = ?, first_day_of_week = ? WHERE user_id = ?");
                            $stmt->execute([$data['settings']['currency_symbol'], $data['settings']['date_format'], $data['settings']['first_day_of_week'], $user_id]);
                        }

                        $pdo->commit();
                        $message = 'Data imported successfully.';
                    } catch (Exception $e) {
                        $pdo->rollBack();
                        $error = 'Import failed: ' . $e->getMessage();
                    }
                }
            }
        } else {
            $error = 'Please upload a valid JSON file.';
        }
    }
}

$current_page = 'backup';
include 'app_header.php';
?>

<div class="backup-page">
    <!-- Export Card -->
    <div class="backup-card">
        <div class="card-header">
            <i class="fas fa-download"></i>
            <span>Export Data</span>
        </div>
        <div class="card-body">
            <p>Download all your sales, expenses, budgets, and settings as a JSON file.</p>
            <a href="?export=1" class="btn-export">
                <i class="fas fa-download"></i> Export Backup
            </a>
        </div>
    </div>

    <!-- Import Card -->
    <div class="backup-card">
        <div class="card-header">
            <i class="fas fa-upload"></i>
            <span>Import Data</span>
        </div>
        <div class="card-body">
            <div class="warning-box">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="warning-text">
                    <strong>Warning:</strong> Importing will replace all your current data!
                </div>
            </div>
            
            <?php if ($message): ?>
                <div class="alert-success"><?php echo htmlspecialchars($message); ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
                <div class="alert-error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="post" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                <div class="file-input-wrapper">
                    <label class="file-label">
                        <i class="fas fa-folder-open"></i>
                        Choose JSON file
                        <input type="file" name="import_file" accept=".json,application/json" required>
                    </label>
                </div>
                <button type="submit" class="btn-import" onclick="return confirm('This will overwrite all your existing data. Continue?');">
                    <i class="fas fa-upload"></i> Import Backup
                </button>
            </form>
        </div>
    </div>

    <!-- Info Card -->
    <div class="backup-card info-card">
        <div class="card-header">
            <i class="fas fa-info-circle"></i>
            <span>About Backup</span>
        </div>
        <div class="card-body">
            <div class="info-list">
                <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Backups include all sales, expenses, and budgets</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Exported files are in JSON format</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Store backups in a safe location</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Regular backups recommended</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.backup-page {
    padding: 16px;
    padding-bottom: 20px;
}

.backup-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    margin-bottom: 16px;
    overflow: hidden;
}

.card-header {
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

.card-header i {
    color: var(--primary);
}

.card-body {
    padding: 16px;
}

.card-body p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 16px;
}

.btn-export {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border: none;
    border-radius: 40px;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-export:active {
    transform: scale(0.97);
}

.warning-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(239, 68, 68, 0.1);
    padding: 12px 16px;
    border-radius: 16px;
    margin-bottom: 16px;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.warning-box i {
    font-size: 1.2rem;
    color: var(--danger);
}

.warning-text {
    flex: 1;
    font-size: 0.8rem;
    color: var(--danger);
}

.warning-text strong {
    font-weight: 700;
}

.alert-success, .alert-error {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 0.8rem;
    margin-bottom: 16px;
}

.alert-success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border-left: 3px solid var(--success);
}

.alert-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border-left: 3px solid var(--danger);
}

.file-input-wrapper {
    margin-bottom: 16px;
}

.file-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px dashed var(--border-color);
    border-radius: 16px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text-primary);
    transition: all 0.2s;
}

.file-label:active {
    background: var(--bg-hover);
}

.file-label input {
    display: none;
}

.btn-import {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: var(--warning);
    border: none;
    border-radius: 40px;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-import:active {
    transform: scale(0.97);
}

.info-card {
    background: var(--bg-card);
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.info-item i {
    color: var(--success);
    font-size: 0.9rem;
    width: 20px;
}

@media (max-width: 480px) {
    .backup-page {
        padding: 12px;
        padding-bottom: 20px;
    }
    
    .warning-box {
        flex-direction: column;
        text-align: center;
    }
    
    .info-item {
        font-size: 0.75rem;
    }
}
</style>

<?php include 'app_footer.php'; ?>