<?php
/**
 * Get configuration value
 * 
 * @param string $key Configuration key
 * @param mixed $default Default value if not found
 * @return mixed Configuration value
 */
function config($key, $default = null) {
    static $config;
    
    if (!$config) {
        $config = $GLOBALS['app_config'] ?? [];
        
        // Also load from environment
        $env = [
            'app_name' => getenv('APP_NAME'),
            'app_version' => getenv('APP_VERSION'),
            'app_env' => getenv('APP_ENV'),
            'app_debug' => getenv('APP_DEBUG'),
            'app_url' => getenv('APP_URL'),
            'currency' => getenv('DEFAULT_CURRENCY'),
            'date_format' => getenv('DEFAULT_DATE_FORMAT'),
            'page_size' => getenv('PAGE_SIZE')
        ];
        
        $config = array_merge($config, array_filter($env));
    }
    
    return $config[$key] ?? $default;
}

/**
 * Get user setting
 * 
 * @param string $key Setting key
 * @return mixed Setting value
 */
function setting($key) {
    static $settings = null;
    
    if ($settings === null && isset($GLOBALS['pdo']) && isset($_SESSION['user_id'])) {
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM user_settings WHERE user_id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $settings = $stmt->fetch() ?: [];
    }
    
    return $settings[$key] ?? config($key);
}