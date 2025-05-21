import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './UnlockCalendar.module.css';

// Data types for calendar
interface UnlockItem {
  asset_id: string;
  asset_name: string;
  logo?: string;
  unlock_date: string;
  amount: number;
  percent_of_total: number;
  is_cliff: boolean;
  is_tge: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  unlocks: UnlockItem[];
  isToday: boolean;
}

interface CalendarMonth {
  year: number;
  month: number; // 0-11
  days: CalendarDay[][];
}

interface MonthYearOption {
  year: number;
  month: number;
  label: string;
  value: string;
}

interface UnlockCalendarProps {
  unlocks: UnlockItem[];
  onItemClick?: (assetId: string) => void;
  formatNumber?: (value: number) => string;
  formatPercent?: (value: number) => string;
  formatDate?: (dateString?: string) => string;
}

// Helper function to generate Google Calendar URL
const generateGoogleCalendarUrl = (event: {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}): string => {
  const { title, description, startDate, endDate, location } = event;
  
  // Format dates for Google Calendar
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
  const dateParam = endDate 
    ? `&dates=${formatDate(startDate)}/${formatDate(endDate)}`
    : `&dates=${formatDate(startDate)}/${formatDate(new Date(startDate.getTime() + 60 * 60 * 1000))}`;
  
  const params = [
    `&text=${encodeURIComponent(title)}`,
    dateParam,
    `&details=${encodeURIComponent(description)}`,
    location ? `&location=${encodeURIComponent(location)}` : '',
  ];
  
  return baseUrl + params.join('');
};



// Formats numbers by default
const defaultFormatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' mil';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + ' k';
  }
  return Math.round(value).toLocaleString('en-US');
};

// Formats percentages by default
const defaultFormatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Days of the week for header
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Month names
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Custom month and year selector with controlled height
const MonthYearSelector: React.FC<{
  options: MonthYearOption[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Closing dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string) => {
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        className={styles.customSelect}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption?.label}
        <span className={styles.selectArrow}>▼</span>
      </div>
      {isOpen && (
        <div className={styles.selectDropdown}>
          {options.map(option => (
            <div 
              key={option.value} 
              className={`${styles.selectOption} ${option.value === value ? styles.selectedOption : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const UnlockCalendar: React.FC<UnlockCalendarProps> = ({
  unlocks,
  onItemClick,
  formatNumber = defaultFormatNumber,
  formatPercent = defaultFormatPercent
}) => {
  // Current date
  const today = useMemo(() => new Date(), []);
  
  // Current month/year in calendar
  const [currentDate, setCurrentDate] = useState<Date>(today);
  
  // Selected day in calendar
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Grouping unlocks by dates
  const unlocksByDate = useMemo(() => {
    const grouped: Record<string, UnlockItem[]> = {};
    
    unlocks.forEach(unlock => {
      const date = new Date(unlock.unlock_date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(unlock);
    });
    
    return grouped;
  }, [unlocks]);
  
  // Counting unlocks for displaying counters
  const countUnlocksByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    
    unlocks.forEach(unlock => {
      const date = new Date(unlock.unlock_date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!counts[dateKey]) {
        counts[dateKey] = 0;
      }
      
      counts[dateKey]++;
    });
    
    return counts;
  }, [unlocks]);
  
  // Create calendar data for current month
  const calendarData = useMemo((): CalendarMonth => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Last day of month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Day of week for first day of month (0 = Sunday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Total days in month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Add days from previous month to fill first week
    const lastDayOfPrevMonth = new Date(year, month, 0);
    const daysInPrevMonth = lastDayOfPrevMonth.getDate();
    
    // Create calendar grid
    const calendarDays: CalendarDay[][] = [];
    let week: CalendarDay[] = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month - 1, daysInPrevMonth - firstDayOfWeek + i + 1);
      const dateKey = date.toISOString().split('T')[0];
      
      week.push({
        date,
        isCurrentMonth: false,
        unlocks: unlocksByDate[dateKey] || [],
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      
      week.push({
        date,
        isCurrentMonth: true,
        unlocks: unlocksByDate[dateKey] || [],
        isToday: date.toDateString() === today.toDateString()
      });
      
      // If Sunday or last day of month, start new week
      if (week.length === 7 || day === daysInMonth) {
        calendarDays.push(week);
        week = [];
      }
    }
    
    // Add days from next month to fill last week
    if (week.length > 0) {
      const daysToAdd = 7 - week.length;
      for (let i = 1; i <= daysToAdd; i++) {
        const date = new Date(year, month + 1, i);
        const dateKey = date.toISOString().split('T')[0];
        
        week.push({
          date,
          isCurrentMonth: false,
          unlocks: unlocksByDate[dateKey] || [],
          isToday: date.toDateString() === today.toDateString()
        });
      }
      calendarDays.push(week);
    }
    
    return { year, month, days: calendarDays };
  }, [currentDate, unlocksByDate, today]);
  
  // Go to previous month
  const prevMonth = () => {
    setCurrentDate(date => {
      const prevMonth = new Date(date);
      prevMonth.setMonth(date.getMonth() - 1);
      return prevMonth;
    });
    setSelectedDate(null);
  };
  
  // Go to next month
  const nextMonth = () => {
    setCurrentDate(date => {
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      return nextMonth;
    });
    setSelectedDate(null);
  };
  
  // Go to current month
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };
  
  // Handle day selection
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(prevDate => 
      prevDate && day.date.toDateString() === prevDate.toDateString() 
        ? null 
        : day.date
    );
  };
  
  // Render unlocks for selected day
  const renderSelectedDayUnlocks = () => {
    if (!selectedDate) return null;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const dayUnlocks = unlocksByDate[dateKey] || [];
    
    if (dayUnlocks.length === 0) {
      return (
        <div className={styles.noUnlocksSelected}>
          <p>No unlock events on this date</p>
        </div>
      );
    }
    
    return (
      <div className={styles.selectedDayUnlocks}>
        <h3 className={styles.selectedDayTitle}>
          Unlocks on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        <div className={styles.unlocksList}>
          {dayUnlocks.map((unlock, index) => {
            // Create event details for calendars
            const eventDate = new Date(unlock.unlock_date);
            const endDate = new Date(eventDate);
            endDate.setHours(eventDate.getHours() + 1);
            
            const eventTitle = `${unlock.asset_name} Token Unlock`;
            const eventDescription = `${formatNumber(unlock.amount)} tokens (${formatPercent(unlock.percent_of_total)} of total supply) will be unlocked for ${unlock.asset_name}.${unlock.is_cliff ? ' This is a cliff unlock event.' : ''}${unlock.is_tge ? ' This is a TGE unlock event.' : ''}`;
            
            const googleCalendarUrl = generateGoogleCalendarUrl({
              title: eventTitle,
              description: eventDescription,
              startDate: eventDate,
              endDate: endDate
            });
            
            return (
              <div 
                key={`${unlock.asset_id}-${index}`} 
                className={styles.unlockCard}
                onClick={() => onItemClick && onItemClick(unlock.asset_id)}
              >
                <div className={styles.calendarButtons}>
                  <a 
                    href={googleCalendarUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.calendarButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM7 18.75c-.75 0-1.5-.75-1.5-1.5V12c0-.75.75-1.5 1.5-1.5h10.5V15c0 2.25-1.5 3.75-3.75 3.75H7z" fill="currentColor"/>
                    </svg>
                    Add to Google
                  </a>
                </div>
                <div className={styles.unlockHeader}>
                  <div className={styles.unlockAssetInfo}>
                    {unlock.logo ? (
                      <img 
                        src={unlock.logo} 
                        alt={unlock.asset_name} 
                        className={styles.assetLogo}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={styles.assetIconPlaceholder}>
                        {unlock.asset_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className={styles.assetName}>{unlock.asset_name}</span>
                  </div>
                  <div className={styles.unlockBadges}>
                    {unlock.is_cliff && <span className={styles.cliffBadge}>Cliff</span>}
                    {unlock.is_tge && <span className={styles.tgeBadge}>TGE</span>}
                  </div>
                </div>
                <div className={styles.unlockDetails}>
                  <div className={styles.unlockDetail}>
                    <span className={styles.detailLabel}>Amount:</span>
                    <span className={styles.detailValue}>{formatNumber(unlock.amount)}</span>
                  </div>
                  <div className={styles.unlockDetail}>
                    <span className={styles.detailLabel}>% of total:</span>
                    <span className={styles.detailValue}>{formatPercent(unlock.percent_of_total)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Sort months with unlocks for selector
  const monthYearOptions = useMemo((): MonthYearOption[] => {
    const uniqueYearMonths = new Set<string>();
    
    unlocks.forEach(unlock => {
      const date = new Date(unlock.unlock_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      uniqueYearMonths.add(`${year}-${month}`);
    });
    
    return Array.from(uniqueYearMonths)
      .map(yearMonth => {
        const [year, month] = yearMonth.split('-').map(Number);
        return { 
          year, 
          month, 
          label: `${MONTHS[month]} ${year}`, 
          value: `${year}-${month}` 
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  }, [unlocks]);
  
  // Handle month selection in custom selector
  const handleMonthYearSelect = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(null);
  };
  
  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarControls}>
          <button className={styles.navButton} onClick={prevMonth}>◀</button>
          <MonthYearSelector
            options={monthYearOptions}
            value={`${calendarData.year}-${calendarData.month}`}
            onChange={handleMonthYearSelect}
          />
          <button className={styles.navButton} onClick={nextMonth}>▶</button>
          <button className={styles.todayButton} onClick={goToToday}>Today</button>
        </div>
      </div>
      
      <div className={styles.calendar}>
        <div className={styles.weekdays}>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className={styles.weekday}>{day}</div>
          ))}
        </div>
        
        <div className={styles.calendarGrid}>
          {calendarData.days.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className={styles.week}>
              {week.map((day, dayIndex) => {
                const dateKey = day.date.toISOString().split('T')[0];
                const unlockCount = countUnlocksByDate[dateKey] || 0;
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                
                return (
                  <div 
                    key={`day-${weekIndex}-${dayIndex}`} 
                    className={`
                      ${styles.day} 
                      ${day.isCurrentMonth ? styles.currentMonth : styles.otherMonth}
                      ${day.isToday ? styles.today : ''}
                      ${isSelected ? styles.selected : ''}
                      ${unlockCount > 0 ? styles.hasUnlocks : ''}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className={styles.dayNumber}>{day.date.getDate()}</span>
                    {unlockCount > 0 && (
                      <div className={styles.unlockIndicator}>
                        <span className={styles.unlockCount}>{unlockCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {renderSelectedDayUnlocks()}
    </div>
  );
};

export default UnlockCalendar; 