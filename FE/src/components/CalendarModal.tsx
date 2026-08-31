import React, { useEffect, useState } from 'react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateRange: Date;
  onDateRangeChange: (newDateRange: Date) => void;
}

const navButton =
    "bg-transparent bg-none border-none text-[18px] cursor-pointer p-[8px] rounded-[4px] " +
    "text-[#6b7280] transition-all duration-200 ease-[ease] " +
    "hover:bg-[#f3f4f6] hover:text-[#374151]";

const todayButton =
    "bg-brand-primary text-white border-none py-[8px] px-[16px] rounded-[6px] text-[14px] " +
    "font-medium cursor-pointer transition-[background-color] duration-200 ease-[ease] " +
    "hover:bg-brand-primary-hover";


/* A day's colours came from four rules that overlapped, and which one won was
   decided by specificity and source order rather than by the order the classes
   were listed:

     .calendar-day                    base        (0,1,0)
     .calendar-day.in-range                       (0,2,0)
     .calendar-day.weekday                        (0,2,0)  later, so beats in-range
     .calendar-day.today                          (0,2,0)  later still
     .calendar-day:hover:not(.empty)              (0,3,0)  beats all three
     .calendar-day.today.in-range                 (0,3,0)  ties hover, declared after

   Utilities cannot reproduce that by being listed in order - when two utilities
   set the same property, the winner is their position in the generated
   stylesheet, not their position in the class attribute. So the winner is picked
   here instead, in JS, and only one utility per property is ever applied.

   The hover case is the subtle one: hovering a plain in-range or today cell does
   repaint it grey, because the hover rule outranks both. A cell that is today
   AND in range does not, because that rule was declared last. */
function dayClasses(day: Date | null, inRange: boolean, weekday: boolean, today: boolean) {
    const colour = !day
        ? 'text-[#374151]'
        : today
        ? 'text-white'
        : weekday
        ? 'text-[#dc2626]'
        : inRange
        ? 'text-[#1e40af]'
        : 'text-[#374151]';

    const background = today ? 'bg-[#ef4444]' : inRange ? 'bg-[#dbeafe]' : '';
    const weight = day && (today || inRange) ? 'font-semibold' : 'font-medium';
    // Empty cells never highlight; today-and-in-range keeps its red.
    const hover = !day || (today && inRange) ? '' : 'hover:bg-[#f3f4f6]';
    const cursor = day ? 'cursor-pointer' : 'cursor-default';

    return [
        'aspect-square flex items-center justify-center text-[13px] rounded-[4px]',
        'transition-all duration-200 ease-[ease]',
        cursor, colour, background, weight, hover,
    ].join(' ');
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
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white rounded-[8px] p-[24px] min-w-[320px] max-w-[400px] border border-[#e5e7eb] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
        role="dialog"
        aria-modal="true"
        aria-label="Choose schedule date range"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-[20px]">
          <button type="button" className={navButton} onClick={goToPreviousMonth} aria-label="Previous month">
            ‹
          </button>
          <h3 className="m-0 text-[16px] font-semibold text-[#1f2937]">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button type="button" className={navButton} onClick={goToNextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="grid grid-cols-[repeat(7,1fr)] gap-[4px] mb-[8px]">
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Sun</div>
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Mon</div>
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Tue</div>
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Wed</div>
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Thu</div>
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Fri</div>
          <div className="text-center text-[11px] font-semibold text-[#6b7280] py-[6px] px-[4px]">Sat</div>
        </div>

        <div className="grid grid-cols-[repeat(7,1fr)] gap-[4px]">
          {days.map((day, index) => (
            <div
              key={index}
              className={dayClasses(
                day,
                !!day && isInCurrentRange(day),
                !!day && isWeekday(day),
                !!day && day.toDateString() === new Date().toDateString(),
              )}
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

        <div className="mt-[20px] flex justify-between items-center">
          <button type="button" className={todayButton} onClick={goToToday}>
            Today
          </button>
          <div className="text-[11px] text-[#6b7280] text-right font-medium">
            Current: {rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
