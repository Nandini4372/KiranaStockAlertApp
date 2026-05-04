import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  History as HistoryIcon,
  IndianRupee,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSales } from '../lib/db';
import { Sale } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DaySummary {
  date: string;
  totalRevenue: number;
  totalItems: number;
  sales: Sale[];
}

interface MonthGroup {
  month: string;
  days: DaySummary[];
  monthTotal: number;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MonthGroup[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    const allSales = await getSales(user!.uid);
    
    // Filter to last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2); // Current + 2 previous
    threeMonthsAgo.setDate(1);
    threeMonthsAgo.setHours(0,0,0,0);

    const filtered = allSales.filter(s => {
      const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
      return date >= threeMonthsAgo;
    });

    // Group by Month -> Day
    const groups: { [key: string]: { [key: string]: Sale[] } } = {};
    
    filtered.forEach(sale => {
      const date = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const dayKey = date.toLocaleDateString();

      if (!groups[monthKey]) groups[monthKey] = {};
      if (!groups[monthKey][dayKey]) groups[monthKey][dayKey] = [];
      groups[monthKey][dayKey].push(sale);
    });

    const formatted: MonthGroup[] = Object.entries(groups).map(([month, daysMap]) => {
      const days: DaySummary[] = Object.entries(daysMap).map(([date, sales]) => ({
        date,
        totalRevenue: sales.reduce((acc, s) => acc + s.totalAmount, 0),
        totalItems: sales.reduce((acc, s) => acc + s.quantity, 0),
        sales
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        month,
        days,
        monthTotal: days.reduce((acc, d) => acc + d.totalRevenue, 0)
      };
    }).sort((a, b) => {
      // Sort months descending
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    });

    setHistory(formatted);
    if (formatted.length > 0) setExpandedMonth(formatted[0].month);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales History</h1>
        <p className="text-slate-500 mt-1">Activities recorded over the last 3 months</p>
      </header>

      <div className="space-y-4">
        {history.map((monthGroup) => (
          <div key={monthGroup.month} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              onClick={() => setExpandedMonth(expandedMonth === monthGroup.month ? null : monthGroup.month)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900">{monthGroup.month}</h3>
                  <p className="text-xs text-slate-500">{monthGroup.days.length} days of activity</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Total</p>
                  <p className="font-black text-slate-900">₹{monthGroup.monthTotal.toLocaleString()}</p>
                </div>
                <div className={cn("transition-transform duration-200", expandedMonth === monthGroup.month ? "rotate-180" : "")}>
                  <ChevronDown size={20} className="text-slate-400" />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedMonth === monthGroup.month && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-slate-50"
                >
                  <div className="p-4 space-y-3">
                    {monthGroup.days.map((day) => (
                      <div key={day.date} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs font-bold text-indigo-600 uppercase">
                              {new Date(day.date).toLocaleDateString('default', { weekday: 'short' })}
                            </p>
                            <p className="text-xl font-black text-slate-900">
                              {new Date(day.date).getDate()}
                            </p>
                          </div>
                          <div className="h-8 w-px bg-slate-100 hidden md:block" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{day.date}</p>
                            <p className="text-xs text-slate-500">{day.sales.length} transactions carried out</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                              <IndianRupee size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Revenue</p>
                              <p className="font-bold text-slate-900">₹{day.totalRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                              <ShoppingBag size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Units Sold</p>
                              <p className="font-bold text-slate-900">{day.totalItems}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {history.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <HistoryIcon size={48} className="text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No history yet</h3>
            <p className="text-slate-500 text-center max-w-xs">Start recording sales to see your store's activity log here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
