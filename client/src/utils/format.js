// Format a number as Indian Rupees — ₹24,000.00
export const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
};

// "15 Jan 2025, 10:30 AM"
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
};

// "15 Jan 2025"
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
};

// Initials from first + last name
export const getInitials = (firstName = '', lastName = '') =>
  `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

// Account type display labels
export const accountTypeLabel = { SAVINGS: 'Savings', CHECKING: 'Checking', CURRENT: 'Current' };

// Transaction direction colour
export const directionColor = (direction) =>
  direction === 'RECEIVED' ? 'text-green-600' : direction === 'SENT' ? 'text-red-500' : 'text-gray-500';

export const directionSign = (direction) =>
  direction === 'RECEIVED' ? '+' : direction === 'SENT' ? '−' : '';
