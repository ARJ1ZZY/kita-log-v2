<?php
// Load environment variables
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

// Get database settings from environment
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'kitalog_db';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    // Log error safely in production
    if (getenv('APP_DEBUG') === 'true') {
        die("Connection failed: " . $e->getMessage());
    } else {
        error_log("Database connection failed: " . $e->getMessage());
        die("A database error occurred. Please try again later.");
    }
}

// Store settings in global for easy access
$GLOBALS['app_config'] = [
    'name' => getenv('APP_NAME') ?: 'KITA-LOG',
    'version' => getenv('APP_VERSION') ?: '1.0.0',
    'env' => getenv('APP_ENV') ?: 'development',
    'debug' => getenv('APP_DEBUG') === 'true',
    'url' => getenv('APP_URL') ?: 'http://localhost/KITA-LOG',
    'currency' => getenv('DEFAULT_CURRENCY') ?: '₱',
    'date_format' => getenv('DEFAULT_DATE_FORMAT') ?: 'Y-m-d',
    'page_size' => (int)(getenv('PAGE_SIZE') ?: 10)
];