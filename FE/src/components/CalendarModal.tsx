import React, { useEffect, useState } from 'react';
import '../styles/CalendarModal.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateRange: Date;
  onDateRangeChange: (newDateRange: Date) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  currentDateRange,
  onDateRangeChange
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentDateRange));

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  // Get the start of the current 2-week range
  const getCurrentRangeStart = () => {
    const startDate = new Date(currentDateRange);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
    return startDate;
  };

  const rangeStart = getCurrentRangeStart();
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 13); // 2 weeks

  // Generate calendar days for the selected month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(selectedMonth);

  const isInCurrentRange = (date: Date) => {
    return date >= rangeStart && date <= rangeEnd;
  };

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 4; // Monday, Tuesday, Wednesday, Thursday
  };

  const handleDateClick = (date: Date) => {
    // Set the date range to start from this date
    const newRangeStart = new Date(date);
    newRangeStart.setDate(newRangeStart.getDate() - newRangeStart.getDay()); // Start of week
    onDateRangeChange(newRangeStart);
    onClose();
  };

  const handleDateKeyDown = (event: React.KeyboardEvent, date: Date) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDateClick(date);
    }
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setSelectedMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setSelectedMonth(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    const todayRangeStart = new Date(today);
    todayRangeStart.setDate(todayRangeStart.getDate() - todayRangeStart.getDay());
    onDateRangeChange(todayRangeStart);
    setSelectedMonth(today);
  };

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div
        className="calendar-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose schedule date range"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="calendar-header">
          <button type="button" className="calendar-nav-btn" onClick={goToPreviousMonth} aria-label="Previous month">
            ‹
          </button>
          <h3 className="calendar-title">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button type="button" className="calendar-nav-btn" onClick={goToNextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="calendar-weekdays">
          <div className="weekday">Sun</div>
          <div className="weekday">Mon</div>
          <div className="weekday">Tue</div>
          <div className="weekday">Wed</div>
          <div className="weekday">Thu</div>
          <div className="weekday">Fri</div>
          <div className="weekday">Sat</div>
        </div>

        <div className="calendar-grid">
          {days.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day ? 'empty' : ''} ${
                 day && isInCurrentRange(day) ? 'in-range' : ''
               } ${day && isWeekday(day) ? 'weekday' : ''} ${
                 day && day.toDateString() === new Date().toDateString() ? 'today' : ''
               }`}
              role={day ? 'button' : undefined}
              tabIndex={day ? 0 : undefined}
              aria-label={day ? day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : undefined}
              onClick={() => day && handleDateClick(day)}
              onKeyDown={(event) => day && handleDateKeyDown(event, day)}
            >
              {day ? day.getDate() : ''}
            </div>
          ))}
        </div>

        <div className="calendar-footer">
          <button type="button" className="today-btn" onClick={goToToday}>
            Today
          </button>
          <div className="range-info">
            Current: {rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
