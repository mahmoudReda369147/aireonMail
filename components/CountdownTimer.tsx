import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { calculateTimeRemaining, formatTimeRemaining } from '../utils/timeUtils';

interface CountdownTimerProps {
  dueDate: string;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ dueDate, compact = false }) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(dueDate));

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(dueDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [dueDate]);

  const { years, months, days, hours, minutes, seconds, isOverdue } = timeRemaining;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isOverdue
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
        }`}
      >
        {isOverdue ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-mono font-semibold">
          {formatTimeRemaining(timeRemaining)}
        </span>
      </div>
    );
  }

  // Determine which units to show based on time remaining
  const showYears = years > 0;
  const showMonths = months > 0 || showYears;
  const showDays = days > 0 || showMonths;

  // Create array of visible time units
  const timeUnits = [];
  if (showYears) timeUnits.push({ value: years, label: 'Y', fullLabel: 'Year' });
  if (showMonths) timeUnits.push({ value: months, label: 'Mo', fullLabel: 'Month' });
  if (showDays) timeUnits.push({ value: days, label: 'D', fullLabel: 'Day' });
  timeUnits.push({ value: hours, label: 'H', fullLabel: 'Hour' });
  timeUnits.push({ value: minutes, label: 'M', fullLabel: 'Minute' });
  timeUnits.push({ value: seconds, label: 'S', fullLabel: 'Second' });

  // Limit to max 6 units, prioritize larger units
  const displayUnits = timeUnits.slice(0, 6);

  return (
    <div
      className={`rounded-lg p-3 border backdrop-blur-sm ${
        isOverdue
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-blue-500/5 border-blue-500/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isOverdue ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isOverdue ? 'text-red-400' : 'text-blue-400'
            }`}
          >
            {isOverdue ? 'Overdue' : 'Time Left'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        {displayUnits.map((unit, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`text-xl font-bold font-mono tabular-nums ${
                isOverdue ? 'text-red-300' : 'text-blue-300'
              }`}
            >
              {unit.value.toString().padStart(2, '0')}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wide font-medium">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
