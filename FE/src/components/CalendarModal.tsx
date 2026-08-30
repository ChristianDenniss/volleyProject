/**
 * CalendarModal — the month-grid date picker the schedules page uses to jump its two-week window, highlighting today and the days currently in range.
 * Picking any day snaps the window to that day's week, so the schedule always starts on a Sunday no matter which cell was clicked; "Today" returns to the current week.
 * Lives in `components/`; opened from `Schedules`.
 */
import { useEffect, useState, type KeyboardEvent } from 'react'
import Modal from '@/components/ui/modals/Modal'
import Button from '@/components/ui/buttons/Button'
import IconButton from '@/components/ui/buttons/IconButton'

/** Length of the schedule window, in days. Mirrors `WINDOW_DAYS` in Schedules. */
const WINDOW_DAYS = 14

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  isOpen: boolean
  onClose: () => void
  currentDateRange: Date
  onDateRangeChange: (next: Date) => void
}

/** The month laid out as calendar cells, with leading nulls for the days before the 1st. */
function monthCells(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const cells: (Date | null)[] = Array.from({ length: firstDay.getDay() }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day))
  }
  return cells
}

/** Snaps a date back to the Sunday that starts its week. */
function startOfWeek(date: Date): Date {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  return start
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export default function CalendarModal({
  isOpen,
  onClose,
  currentDateRange,
  onDateRangeChange,
}: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(currentDateRange))

  // Re-centre on the window whenever the picker reopens, so it never shows a stale month.
  useEffect(() => {
    if (isOpen) setVisibleMonth(new Date(currentDateRange))
  }, [isOpen, currentDateRange])

  const rangeStart = startOfWeek(currentDateRange)
  const rangeEnd = new Date(rangeStart)
  rangeEnd.setDate(rangeEnd.getDate() + WINDOW_DAYS - 1)

  const today = new Date()
  const cells = monthCells(visibleMonth)

  const shiftMonth = (delta: number) => {
    const next = new Date(visibleMonth)
    next.setMonth(next.getMonth() + delta)
    setVisibleMonth(next)
  }

  const pickDate = (date: Date) => {
    onDateRangeChange(startOfWeek(date))
    onClose()
  }

  const onCellKeyDown = (event: KeyboardEvent, date: Date) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pickDate(date)
    }
  }

  const formatRangeDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose schedule date range"
      size="sm"
      footer={
        <>
          <span className="mr-auto text-xs text-content-tertiary">
            Current: {formatRangeDate(rangeStart)} – {formatRangeDate(rangeEnd)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onDateRangeChange(startOfWeek(new Date()))
              setVisibleMonth(new Date())
            }}
          >
            Today
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-3">
          <IconButton
            icon={<span aria-hidden className="text-lg leading-none">&lsaquo;</span>}
            label="Previous month"
            size="sm"
            onClick={() => shiftMonth(-1)}
          />
          <h3 className="m-0 text-sm font-semibold text-content">
            {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <IconButton
            icon={<span aria-hidden className="text-lg leading-none">&rsaquo;</span>}
            label="Next month"
            size="sm"
            onClick={() => shiftMonth(1)}
          />
        </header>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-content-muted">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            if (!day) return <div key={index} aria-hidden />

            const inRange = day >= rangeStart && day <= rangeEnd
            const isToday = isSameDay(day, today)

            return (
              <button
                key={index}
                type="button"
                onClick={() => pickDate(day)}
                onKeyDown={(event) => onCellKeyDown(event, day)}
                aria-label={day.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                aria-current={isToday ? 'date' : undefined}
                className={`aspect-square cursor-pointer rounded-control border text-sm tabular-nums transition-colors ${
                  inRange
                    ? 'border-accent bg-brand-subtle font-semibold text-accent'
                    : 'border-transparent text-content-secondary hover:bg-surface-inset'
                } ${isToday ? 'ring-2 ring-status-info/40' : ''}`}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
