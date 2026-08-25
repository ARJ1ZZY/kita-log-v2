export const getSampleInventory = (businessType = 'Sari-sari Store') => {
  const baseItems = {
    'Sari-sari Store': [
      { item_name: 'Lucky Me Pancit Canton', category: 'Food', unit: 'pcs', cost_price: 10, selling_price: 15, current_stock: 100, low_stock_threshold: 20, barcode: 'SARI001' },
      { item_name: 'Coca-Cola 1L', category: 'Beverages', unit: 'bottle', cost_price: 45, selling_price: 60, current_stock: 50, low_stock_threshold: 10, barcode: 'SARI002' },
      { item_name: 'Safeguard Soap', category: 'Personal Care', unit: 'pcs', cost_price: 25, selling_price: 40, current_stock: 5, low_stock_threshold: 10, barcode: 'SARI003' },
      { item_name: 'Milo 24g Sachet', category: 'Beverages', unit: 'pcs', cost_price: 8, selling_price: 12, current_stock: 200, low_stock_threshold: 30, barcode: 'SARI004' },
      { item_name: 'Oishi Prawn Crackers', category: 'Snacks', unit: 'pcs', cost_price: 6, selling_price: 10, current_stock: 150, low_stock_threshold: 25, barcode: 'SARI005' },
      { item_name: 'Downy Fabric Conditioner 25ml', category: 'Household', unit: 'sachet', cost_price: 5, selling_price: 8, current_stock: 80, low_stock_threshold: 15, barcode: 'SARI006' },
    ],
    'Ukay-ukay': [
      { item_name: 'Vintage Denim Jacket', category: 'Clothing', unit: 'pcs', cost_price: 150, selling_price: 350, current_stock: 12, low_stock_threshold: 3, barcode: 'UKAY001' },
      { item_name: 'Polo Shirt', category: 'Clothing', unit: 'pcs', cost_price: 80, selling_price: 150, current_stock: 25, low_stock_threshold: 5, barcode: 'UKAY002' },
      { item_name: 'Summer Dress', category: 'Dresses', unit: 'pcs', cost_price: 120, selling_price: 250, current_stock: 8, low_stock_threshold: 2, barcode: 'UKAY003' },
      { item_name: 'Sneakers (Pre-owned)', category: 'Footwear', unit: 'pair', cost_price: 200, selling_price: 450, current_stock: 6, low_stock_threshold: 2, barcode: 'UKAY004' },
      { item_name: 'Kids T-shirt Bundle', category: 'Kids Wear', unit: 'set', cost_price: 100, selling_price: 200, current_stock: 15, low_stock_threshold: 4, barcode: 'UKAY005' },
      { item_name: 'Winter Scarf', category: 'Accessories', unit: 'pcs', cost_price: 40, selling_price: 100, current_stock: 10, low_stock_threshold: 3, barcode: 'UKAY006' },
    ],
    'Online Seller': [
      { item_name: 'Wireless Earbuds', category: 'Electronics', unit: 'pcs', cost_price: 250, selling_price: 499, current_stock: 20, low_stock_threshold: 5, barcode: 'ONL001' },
      { item_name: 'Phone Case (iPhone/Android)', category: 'Accessories', unit: 'pcs', cost_price: 50, selling_price: 120, current_stock: 40, low_stock_threshold: 8, barcode: 'ONL002' },
      { item_name: 'LED Ring Light', category: 'Gadgets', unit: 'pcs', cost_price: 180, selling_price: 350, current_stock: 15, low_stock_threshold: 3, barcode: 'ONL003' },
      { item_name: 'Scented Candles', category: 'Home Decor', unit: 'pcs', cost_price: 60, selling_price: 150, current_stock: 30, low_stock_threshold: 6, barcode: 'ONL004' },
      { item_name: 'Makeup Brush Set', category: 'Cosmetics', unit: 'set', cost_price: 120, selling_price: 280, current_stock: 18, low_stock_threshold: 4, barcode: 'ONL005' },
      { item_name: 'Laptop Stand', category: 'Accessories', unit: 'pcs', cost_price: 150, selling_price: 320, current_stock: 12, low_stock_threshold: 3, barcode: 'ONL006' },
    ],
    'Micro-enterprise': [
      { item_name: 'Bond Paper (Ream)', category: 'Office Supplies', unit: 'ream', cost_price: 120, selling_price: 180, current_stock: 25, low_stock_threshold: 5, barcode: 'MIC001' },
      { item_name: 'Ballpen (Box)', category: 'Office Supplies', unit: 'box', cost_price: 30, selling_price: 55, current_stock: 40, low_stock_threshold: 10, barcode: 'MIC002' },
      { item_name: 'Dishwashing Liquid 500ml', category: 'Cleaning', unit: 'bottle', cost_price: 35, selling_price: 55, current_stock: 30, low_stock_threshold: 8, barcode: 'MIC003' },
      { item_name: 'Trash Bags (Pack)', category: 'Cleaning', unit: 'pack', cost_price: 20, selling_price: 35, current_stock: 20, low_stock_threshold: 5, barcode: 'MIC004' },
      { item_name: 'Notebook 80 leaves', category: 'School Supplies', unit: 'pcs', cost_price: 25, selling_price: 45, current_stock: 50, low_stock_threshold: 10, barcode: 'MIC005' },
      { item_name: 'Envelope (Pack)', category: 'Office Supplies', unit: 'pack', cost_price: 15, selling_price: 30, current_stock: 35, low_stock_threshold: 8, barcode: 'MIC006' },
    ],
  };
  return (baseItems[businessType] || baseItems['Sari-sari Store']).map(item => ({ ...item }));
};

export const getSampleTransactions = (businessId) => [
  { business_id: businessId, type: 'sale', amount: 450, description: 'Sold assorted items', date: new Date().toISOString().split('T')[0], time: '10:30', item_id: null, quantity: 0, created_at: new Date().toISOString() },
  { business_id: businessId, type: 'expense', amount: 250, description: 'Restock supplies', date: new Date().toISOString().split('T')[0], time: '14:15', item_id: null, quantity: 0, created_at: new Date().toISOString() },
  { business_id: businessId, type: 'sale', amount: 120, description: 'Sold snacks', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], time: '09:00', item_id: null, quantity: 0, created_at: new Date().toISOString() },
];