import { useAuth } from '../context/AuthContext';

export const useFormat = () => {
  const { activeBusinessId, businesses } = useAuth();
  const activeBiz = businesses.find(b => b.id === activeBusinessId);
  const dateFormat = activeBiz?.date_format || 'MM/DD/YYYY';
  const currencySymbol = '₱';

  const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return `${currencySymbol}0.00`;
    return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return dateStr;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(timestamp);
  };

  return { formatCurrency, formatDate, formatRelativeTime, currencySymbol, dateFormat };
};