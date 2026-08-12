<?php
/**
 * Format date according to user settings
 * 
 * @param string $date The date string (Y-m-d format)
 * @param array $settings User settings containing date_format
 * @return string Formatted date
 */
function formatDate($date, $settings = null) {
    if (empty($date)) return '-';
    
    // If settings not provided, try to get from session or use default
    if (!$settings && isset($_SESSION['user_id'])) {
        // This would need database access - we'll pass settings from calling code
        return date('Y-m-d', strtotime($date));
    }
    
    $format = $settings['date_format'] ?? 'Y-m-d';
    
    $timestamp = strtotime($date);
    
    switch ($format) {
        case 'd-m-Y':
            return date('d-m-Y', $timestamp);
        case 'm/d/Y':
            return date('m/d/Y', $timestamp);
        case 'd/m/Y':
            return date('d/m/Y', $timestamp);
        case 'Y-m-d':
        default:
            return date('Y-m-d', $timestamp);
    }
}

/**
 * Format datetime according to user settings
 * 
 * @param string $datetime The datetime string
 * @param array $settings User settings containing date_format
 * @return string Formatted datetime
 */
function formatDateTime($datetime, $settings = null) {
    if (empty($datetime)) return '-';
    
    $format = $settings['date_format'] ?? 'Y-m-d';
    $timestamp = strtotime($datetime);
    
    $date_part = formatDate($datetime, $settings);
    $time_part = date('h:i A', $timestamp);
    
    return $date_part . ' ' . $time_part;
}

/**
 * Get month name from date
 * 
 * @param string $date The date string
 * @return string Month name
 */
function getMonthName($date) {
    return date('F', strtotime($date));
}

/**
 * Get day name from date
 * 
 * @param string $date The date string
 * @return string Day name
 */
function getDayName($date) {
    return date('l', strtotime($date));
}