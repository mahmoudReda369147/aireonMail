export interface TimeRemaining {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  totalMilliseconds: number;
}

export const calculateTimeRemaining = (dueDate: string): TimeRemaining => {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;

  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);

  // Calculate time units
  const seconds = Math.floor((absDiff / 1000) % 60);
  const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
  const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  // Calculate years and months
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);
  const finalDays = remainingDays % 30;

  return {
    years,
    months,
    days: finalDays,
    hours,
    minutes,
    seconds,
    isOverdue,
    totalMilliseconds: diff,
  };
};

export const formatTimeRemaining = (timeRemaining: TimeRemaining): string => {
  const { years, months, days, hours, minutes, seconds, isOverdue } = timeRemaining;

  const parts: string[] = [];

  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  const timeString = parts.join(' ');
  return isOverdue ? `Overdue by ${timeString}` : timeString;
};
