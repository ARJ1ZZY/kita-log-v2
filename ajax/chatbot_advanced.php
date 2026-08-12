<?php
require_once '../includes/auth.php';
require_once '../config/db.php';
require_once '../includes/config_helpers.php';

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$message = strtolower(trim($_POST['message'] ?? ''));

if (empty($message)) {
    echo json_encode(['success' => false, 'error' => 'Message is empty']);
    exit;
}

// Get user settings for currency
$stmt = $pdo->prepare("SELECT currency_symbol FROM user_settings WHERE user_id = ?");
$stmt->execute([$user_id]);
$settings = $stmt->fetch();
$currency = $settings ? $settings['currency_symbol'] : config('currency', '₱');

// Analyze the message and determine what data to fetch
$response = analyzeAndFetchData($message, $user_id, $pdo, $currency);

echo json_encode([
    'success' => true,
    'response' => $response,
    'timestamp' => date('h:i A')
]);

function analyzeAndFetchData($message, $user_id, $pdo, $currency) {
    $message = strtolower($message);
    
    // SALES QUERIES
    if (strpos($message, 'sale') !== false || strpos($message, 'sell') !== false || strpos($message, 'income') !== false) {
        return handleSalesQuery($message, $user_id, $pdo, $currency);
    }
    
    // EXPENSE QUERIES
    if (strpos($message, 'expense') !== false || strpos($message, 'spent') !== false || strpos($message, 'cost') !== false || strpos($message, 'purchase') !== false) {
        return handleExpenseQuery($message, $user_id, $pdo, $currency);
    }
    
    // PROFIT QUERIES
    if (strpos($message, 'profit') !== false || strpos($message, 'earn') !== false || strpos($message, 'net') !== false) {
        return handleProfitQuery($message, $user_id, $pdo, $currency);
    }
    
    // INVENTORY QUERIES
    if (strpos($message, 'inventory') !== false || strpos($message, 'stock') !== false || strpos($message, 'item') !== false || strpos($message, 'product') !== false) {
        return handleInventoryQuery($message, $user_id, $pdo, $currency);
    }
    
    // BUDGET QUERIES
    if (strpos($message, 'budget') !== false || strpos($message, 'limit') !== false) {
        return handleBudgetQuery($message, $user_id, $pdo, $currency);
    }
    
    // TIME-BASED QUERIES (yesterday, today, this week, etc.)
    if (strpos($message, 'yesterday') !== false || strpos($message, 'today') !== false || 
        strpos($message, 'week') !== false || strpos($message, 'month') !== false || 
        strpos($message, 'year') !== false) {
        return handleTimeBasedQuery($message, $user_id, $pdo, $currency);
    }
    
    // If no specific pattern matches, return general help
    return "I can help you with:\n" .
           "• Sales: 'What were my sales yesterday?'\n" .
           "• Expenses: 'How much did I spend this month?'\n" .
           "• Profit: 'What's my profit this week?'\n" .
           "• Inventory: 'Which items are low in stock?'\n" .
           "• Budgets: 'How's my budget doing?'\n" .
           "Just ask naturally!";
}

function handleSalesQuery($message, $user_id, $pdo, $currency) {
    // Check for time periods
    if (strpos($message, 'yesterday') !== false) {
        $date = date('Y-m-d', strtotime('yesterday'));
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM sales WHERE user_id = ? AND sale_date = ?");
        $stmt->execute([$user_id, $date]);
        $data = $stmt->fetch();
        
        return "📊 Yesterday's sales: **{$currency}" . number_format($data['total'], 2) . "** from {$data['count']} transaction(s).";
    }
    
    if (strpos($message, 'today') !== false) {
        $date = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM sales WHERE user_id = ? AND sale_date = ?");
        $stmt->execute([$user_id, $date]);
        $data = $stmt->fetch();
        
        return "📊 Today's sales so far: **{$currency}" . number_format($data['total'], 2) . "** from {$data['count']} transaction(s).";
    }
    
    if (strpos($message, 'week') !== false) {
        $start = date('Y-m-d', strtotime('monday this week'));
        $end = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
        $stmt->execute([$user_id, $start, $end]);
        $total = $stmt->fetch()['total'];
        
        return "📊 This week's sales: **{$currency}" . number_format($total, 2) . "**";
    }
    
    if (strpos($message, 'month') !== false) {
        $start = date('Y-m-01');
        $end = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
        $stmt->execute([$user_id, $start, $end]);
        $total = $stmt->fetch()['total'];
        
        return "📊 This month's sales: **{$currency}" . number_format($total, 2) . "**";
    }
    
    // Top selling items
    if (strpos($message, 'top') !== false || strpos($message, 'best') !== false) {
        $stmt = $pdo->prepare("
            SELECT description, COUNT(*) as count, SUM(amount) as total 
            FROM sales 
            WHERE user_id = ? AND description IS NOT NULL AND description != ''
            GROUP BY description 
            ORDER BY total DESC 
            LIMIT 3
        ");
        $stmt->execute([$user_id]);
        $items = $stmt->fetchAll();
        
        if (count($items) > 0) {
            $response = "🏆 Your top selling items:\n";
            foreach ($items as $index => $item) {
                $response .= ($index + 1) . ". {$item['description']}: {$currency}" . number_format($item['total'], 2) . " ({$item['count']} sales)\n";
            }
            return $response;
        }
    }
    
    return null;
}

function handleExpenseQuery($message, $user_id, $pdo, $currency) {
    if (strpos($message, 'yesterday') !== false) {
        $date = date('Y-m-d', strtotime('yesterday'));
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date = ?");
        $stmt->execute([$user_id, $date]);
        $total = $stmt->fetch()['total'];
        
        return "💰 Yesterday's expenses: **{$currency}" . number_format($total, 2) . "**";
    }
    
    if (strpos($message, 'today') !== false) {
        $date = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date = ?");
        $stmt->execute([$user_id, $date]);
        $total = $stmt->fetch()['total'];
        
        return "💰 Today's expenses: **{$currency}" . number_format($total, 2) . "**";
    }
    
    if (strpos($message, 'month') !== false) {
        $start = date('Y-m-01');
        $end = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
        $stmt->execute([$user_id, $start, $end]);
        $total = $stmt->fetch()['total'];
        
        // Get top expense category
        $stmt2 = $pdo->prepare("
            SELECT c.name, SUM(e.amount) as total 
            FROM expenses e 
            LEFT JOIN expense_categories c ON e.category_id = c.id 
            WHERE e.user_id = ? AND e.expense_date BETWEEN ? AND ?
            GROUP BY e.category_id 
            ORDER BY total DESC 
            LIMIT 1
        ");
        $stmt2->execute([$user_id, $start, $end]);
        $top = $stmt2->fetch();
        
        $response = "💰 This month's expenses: **{$currency}" . number_format($total, 2) . "**\n";
        if ($top && $top['name']) {
            $response .= "📌 Top category: {$top['name']} ({$currency}" . number_format($top['total'], 2) . ")";
        }
        return $response;
    }
    
    // Category breakdown
    if (strpos($message, 'category') !== false || strpos($message, 'breakdown') !== false) {
        $start = date('Y-m-01');
        $end = date('Y-m-d');
        $stmt = $pdo->prepare("
            SELECT c.name, COALESCE(SUM(e.amount), 0) as total 
            FROM expense_categories c 
            LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = ? AND e.expense_date BETWEEN ? AND ?
            GROUP BY c.id
            HAVING total > 0
            ORDER BY total DESC
        ");
        $stmt->execute([$user_id, $start, $end]);
        $categories = $stmt->fetchAll();
        
        if (count($categories) > 0) {
            $response = "📊 Expense breakdown this month:\n";
            foreach ($categories as $cat) {
                $response .= "• {$cat['name']}: {$currency}" . number_format($cat['total'], 2) . "\n";
            }
            return $response;
        }
    }
    
    return null;
}

function handleProfitQuery($message, $user_id, $pdo, $currency) {
    // Determine time period
    $period = 'today';
    if (strpos($message, 'yesterday') !== false) $period = 'yesterday';
    elseif (strpos($message, 'week') !== false) $period = 'week';
    elseif (strpos($message, 'month') !== false) $period = 'month';
    
    switch($period) {
        case 'yesterday':
            $date = date('Y-m-d', strtotime('yesterday'));
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date = ?");
            $stmt->execute([$user_id, $date]);
            $sales = $stmt->fetch()['total'];
            
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date = ?");
            $stmt->execute([$user_id, $date]);
            $expenses = $stmt->fetch()['total'];
            
            $profit = $sales - $expenses;
            $margin = $sales > 0 ? round(($profit / $sales) * 100, 1) : 0;
            
            return "📈 Yesterday's profit: **{$currency}" . number_format($profit, 2) . "**\n" .
                   "Sales: {$currency}" . number_format($sales, 2) . " | Expenses: {$currency}" . number_format($expenses, 2) . "\n" .
                   "Margin: {$margin}%";
            break;
            
        case 'week':
            $start = date('Y-m-d', strtotime('monday this week'));
            $end = date('Y-m-d');
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
            $stmt->execute([$user_id, $start, $end]);
            $sales = $stmt->fetch()['total'];
            
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
            $stmt->execute([$user_id, $start, $end]);
            $expenses = $stmt->fetch()['total'];
            
            $profit = $sales - $expenses;
            
            return "📈 This week's profit: **{$currency}" . number_format($profit, 2) . "**\n" .
                   "Sales: {$currency}" . number_format($sales, 2) . " | Expenses: {$currency}" . number_format($expenses, 2);
            break;
            
        case 'month':
            $start = date('Y-m-01');
            $end = date('Y-m-d');
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date BETWEEN ? AND ?");
            $stmt->execute([$user_id, $start, $end]);
            $sales = $stmt->fetch()['total'];
            
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
            $stmt->execute([$user_id, $start, $end]);
            $expenses = $stmt->fetch()['total'];
            
            $profit = $sales - $expenses;
            $daily_avg = $profit / date('j');
            
            return "📈 This month's profit: **{$currency}" . number_format($profit, 2) . "**\n" .
                   "Sales: {$currency}" . number_format($sales, 2) . " | Expenses: {$currency}" . number_format($expenses, 2) . "\n" .
                   "Daily average: {$currency}" . number_format($daily_avg, 2);
            break;
            
        default: // today
            $date = date('Y-m-d');
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE user_id = ? AND sale_date = ?");
            $stmt->execute([$user_id, $date]);
            $sales = $stmt->fetch()['total'];
            
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date = ?");
            $stmt->execute([$user_id, $date]);
            $expenses = $stmt->fetch()['total'];
            
            $profit = $sales - $expenses;
            
            return "📈 Today's profit: **{$currency}" . number_format($profit, 2) . "**\n" .
                   "Sales: {$currency}" . number_format($sales, 2) . " | Expenses: {$currency}" . number_format($expenses, 2);
    }
}

function handleInventoryQuery($message, $user_id, $pdo, $currency) {
    // Low stock items
    if (strpos($message, 'low') !== false || strpos($message, 'reorder') !== false) {
        $stmt = $pdo->prepare("SELECT * FROM inventory_items WHERE user_id = ? AND current_stock <= low_stock_threshold ORDER BY current_stock ASC LIMIT 5");
        $stmt->execute([$user_id]);
        $items = $stmt->fetchAll();
        
        if (count($items) > 0) {
            $response = "⚠️ **Low Stock Alert!**\n";
            foreach ($items as $item) {
                $response .= "• {$item['item_name']}: Only {$item['current_stock']} {$item['unit']}(s) left\n";
            }
            return $response;
        } else {
            return "✅ All inventory items are well-stocked!";
        }
    }
    
    // Total inventory value
    if (strpos($message, 'value') !== false || strpos($message, 'worth') !== false) {
        $stmt = $pdo->prepare("SELECT SUM(current_stock * cost_price) as total_value, SUM(current_stock) as total_items FROM inventory_items WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $data = $stmt->fetch();
        
        return "📦 Your inventory is worth: **{$currency}" . number_format($data['total_value'], 2) . "**\n" .
               "Total items in stock: {$data['total_items']}";
    }
    
    return null;
}

function handleBudgetQuery($message, $user_id, $pdo, $currency) {
    $current_month = date('Y-m-01');
    
    // Get overall budget
    $stmt = $pdo->prepare("SELECT * FROM budgets WHERE user_id = ? AND month = ? AND category_id IS NULL");
    $stmt->execute([$user_id, $current_month]);
    $overall = $stmt->fetch();
    
    // Get total spent this month
    $month_end = date('Y-m-t');
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND expense_date BETWEEN ? AND ?");
    $stmt->execute([$user_id, $current_month, $month_end]);
    $total_spent = $stmt->fetch()['total'];
    
    if ($overall) {
        $percentage = round(($total_spent / $overall['amount']) * 100, 1);
        $remaining = $overall['amount'] - $total_spent;
        
        $response = "🎯 **Monthly Budget Status**\n";
        $response .= "Budget: {$currency}" . number_format($overall['amount'], 2) . "\n";
        $response .= "Spent: {$currency}" . number_format($total_spent, 2) . " ({$percentage}%)\n";
        $response .= "Remaining: {$currency}" . number_format($remaining, 2) . "\n";
        
        if ($percentage >= 100) {
            $response .= "⚠️ You've exceeded your budget!";
        } elseif ($percentage >= 80) {
            $response .= "⚠️ You're close to your budget limit!";
        } else {
            $response .= "✅ You're within budget.";
        }
        
        return $response;
    } else {
        return "You haven't set a budget for this month. Go to Budgets to set one!";
    }
}

function handleTimeBasedQuery($message, $user_id, $pdo, $currency) {
    // This handles generic questions about specific dates
    if (strpos($message, 'yesterday') !== false) {
        $date = date('Y-m-d', strtotime('yesterday'));
        
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as sales FROM sales WHERE user_id = ? AND sale_date = ?");
        $stmt->execute([$user_id, $date]);
        $sales = $stmt->fetch()['sales'];
        
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE user_id = ? AND expense_date = ?");
        $stmt->execute([$user_id, $date]);
        $expenses = $stmt->fetch()['expenses'];
        
        return "📅 **Yesterday's Summary** (" . date('F j, Y', strtotime('yesterday')) . ")\n" .
               "Sales: {$currency}" . number_format($sales, 2) . "\n" .
               "Expenses: {$currency}" . number_format($expenses, 2) . "\n" .
               "Profit: {$currency}" . number_format($sales - $expenses, 2);
    }
    
    return null;
}
?>