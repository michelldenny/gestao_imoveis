import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName, formatCurrency } from '../utils/formatters';

interface CalendarViewProps {
  transactions: Transaction[];
  onDayClick: (date: string, transactions: Transaction[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ transactions, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add empty slots for previous month days
    for (let i = 0; i < date.getDay(); i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const getDayStatus = (dateStr: string) => {
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    if (dayTransactions.length === 0) return null;

    const hasOverdue = dayTransactions.some(t => t.status === 'pending' && new Date(t.date) < new Date() && t.type === 'expense');
    if (hasOverdue) return 'overdue';

    const allPaid = dayTransactions.every(t => t.status === 'paid');
    return allPaid ? 'paid' : 'pending';
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
          {getMonthName(currentDate)}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-6">
        <div className="grid grid-cols-7 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-4 auto-rows-fr">
          {daysInMonth.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="bg-transparent" />;
            
            const dateStr = date.toISOString().split('T')[0];
            const status = getDayStatus(dateStr);
            const dayTrans = transactions.filter(t => t.date === dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => dayTrans.length > 0 && onDayClick(dateStr, dayTrans)}
                className={`
                  relative rounded-xl flex flex-col items-center justify-start pt-2
                  h-14 md:h-24 md:items-start md:p-2 md:border md:hover:shadow-md transition-all
                  ${!status ? 'bg-transparent md:bg-white md:border-gray-100' : ''}
                  ${status && 'md:bg-gray-50 md:border-gray-200'}
                `}
              >
                <span className={`text-sm font-semibold mb-1 ${!status ? 'text-gray-700' : 'text-gray-900'}`}>
                  {date.getDate()}
                </span>
                
                {status && (
                  <div className="flex gap-1 justify-center flex-wrap w-full max-w-[80%]">
                    {dayTrans.map((t, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full ${
                          t.status === 'paid' ? 'bg-emerald-400' : 
                          (new Date(t.date) < new Date() && t.type === 'expense' && t.status === 'pending') ? 'bg-red-400' : 'bg-amber-400'
                        }`} 
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};