// WhatsApp-style date formatting function
export const formatWhatsAppDate = (dateString: string, t?: (key: string) => string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    const todayText = t ? t('date.today') : 'Today at';
    return `${todayText} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  // Yesterday
  if (diffDays === 1) {
    const yesterdayText = t ? t('date.yesterday') : 'Yesterday at';
    return `${yesterdayText} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  // This week (within last 7 days) - show day name
  if (diffDays < 7) {
    const dayKey = `date.${date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}`;
    const dayName = t ? t(dayKey) : date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  // This year - show date without year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
           ` at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  // Older than this year - show full date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
         ` at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};

// Short version for email list (without time)
export const formatWhatsAppDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Today - show time only
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // This week (within last 7 days) - show day name
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // This year - show date without year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Older than this year - show full date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
