export const CONSTANTS = {
  APP: {
    NAME: 'KITA-LOG',
    VERSION: '1.0.0',
    WEBSITE: 'https://kita-log.com',
    SUPPORT_EMAIL: 'support@kita-log.com',
  },
  BUSINESS: {
    FREE_LIMIT: 2,
    PREMIUM_PRICE: 199,
    CURRENCY: '₱',
  },
  TRANSACTIONS: {
    TYPES: {
      SALE: 'sale',
      EXPENSE: 'expense',
    },
  },
  INVENTORY: {
    DEFAULT_LOW_STOCK_THRESHOLD: 5,
  },
  NOTIFICATIONS: {
    DAILY_SUMMARY_HOUR: 20,
    DAILY_SUMMARY_MINUTE: 0,
  },
  OFFLINE: {
    QUEUE_KEY: '@kita_log_write_queue',
    CACHE_PREFIX: '@kita_log_cache_',
  },
  CHAT: {
    MAX_HISTORY_MESSAGES: 50,
  },
};