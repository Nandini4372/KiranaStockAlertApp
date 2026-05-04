import React, { useEffect, useState } from 'react';
import { 
  IndianRupee, 
  ShoppingBag, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Search,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInventory, getSales, recordSale } from '../lib/db';
import { InventoryItem, Sale } from '../types';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { toast } from 'sonner';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [saleQty, setSaleQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const [inv, sls] = await Promise.all([
      getInventory(user!.uid),
      getSales(user!.uid)
    ]);
    setInventory(inv);
    setSales(sls);
  };

  // DASHBOARD CLEAR VIEW: Stats strictly for TODAY
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  
  const todaySales = sales.filter(s => {
    const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
    return d >= startOfToday;
  });

  const revenueToday = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const itemsSoldToday = todaySales.reduce((acc, curr) => acc + curr.quantity, 0);
  const lowStockCount = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;

  const handleSale = async () => {
    if (!selectedItem || !user || !profile) return;
    setIsProcessing(true);
    try {
      await recordSale({
        itemId: selectedItem.id!,
        itemName: selectedItem.name,
        quantity: saleQty,
        totalAmount: selectedItem.price * saleQty,
        ownerId: user.uid
      }, profile);
      
      toast.success(`Sold ${saleQty} ${selectedItem.unit} of ${selectedItem.name}`);
      setSelectedItem(null);
      setSaleQty(1);
      setSearch('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Sale failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Aggregation Logic for Bar Chart
  const getAggregatedData = () => {
    const now = new Date();
    const dataMap: { [key: string]: number } = {};
    
    if (period === 'daily') {
      // Last 12 hours
      for (let i = 0; i < 12; i++) {
        const d = new Date(now);
        d.setHours(now.getHours() - i, 0, 0, 0);
        const label = d.toLocaleTimeString([], { hour: '2-digit' });
        dataMap[label] = 0;
      }
      sales.forEach(s => {
        const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        if (d >= new Date(now.getTime() - 12 * 60 * 60 * 1000)) {
          const label = d.toLocaleTimeString([], { hour: '2-digit' });
          if(dataMap[label] !== undefined) dataMap[label] += s.totalAmount;
        }
      });
    } else if (period === 'weekly') {
      // Last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString([], { weekday: 'short' });
        dataMap[label] = 0;
      }
      sales.forEach(s => {
        const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        const label = d.toLocaleDateString([], { weekday: 'short' });
        if(dataMap[label] !== undefined) dataMap[label] += s.totalAmount;
      });
    } else if (period === 'monthly') {
      // By month this year
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), i, 1);
        const label = d.toLocaleDateString([], { month: 'short' });
        dataMap[label] = 0;
      }
      sales.forEach(s => {
        const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        if (d.getFullYear() === now.getFullYear()) {
          const label = d.toLocaleDateString([], { month: 'short' });
          if(dataMap[label] !== undefined) dataMap[label] += s.totalAmount;
        }
      });
    } else if (period === 'yearly') {
      // Last 5 years
      for (let i = 0; i < 5; i++) {
        const label = String(now.getFullYear() - i);
        dataMap[label] = 0;
      }
      sales.forEach(s => {
        const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        const label = String(d.getFullYear());
        if(dataMap[label] !== undefined) dataMap[label] += s.totalAmount;
      });
    }

    return Object.entries(dataMap).map(([name, amount]) => ({ name, amount })).reverse();
  };

  const chartData = getAggregatedData();

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) && i.quantity > 0
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Status overview for {profile?.storeName || 'your store'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full text-indigo-700 font-medium">
          <TrendingUp size={16} />
          Business is active
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <IndianRupee size={24} />
            </div>
            <span className="text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-slate-500 font-medium mt-4 text-sm">Revenue Today</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">₹{revenueToday.toLocaleString()}</h2>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-medium mt-4 text-sm">Items Sold Today</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{itemsSoldToday}</h2>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            {lowStockCount > 0 && (
              <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full animate-pulse">Action Required</span>
            )}
          </div>
          <p className="text-slate-500 font-medium mt-4 text-sm">Low Stock Items</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{lowStockCount}</h2>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Sale Section */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="text-indigo-600" size={20} />
              Quick Sale
            </h3>
            
            {!selectedItem ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search item to sell..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {search && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    {filteredInventory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all text-left"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500">Stock: {item.quantity} {item.unit} • ₹{item.price}/{item.unit}</p>
                        </div>
                        <Plus className="text-indigo-600" />
                      </button>
                    ))}
                    {filteredInventory.length === 0 && <p className="text-center text-slate-500 py-4">No matching items</p>}
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col md:flex-row gap-6 md:items-center">
                <div className="flex-1">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Adding Sale For</p>
                  <h4 className="text-xl font-bold text-slate-900">{selectedItem.name}</h4>
                  <p className="text-sm text-slate-600">Inventory: {selectedItem.quantity} {selectedItem.unit} remaining</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSaleQty(Math.max(1, saleQty - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-slate-900">{saleQty}</span>
                    <button 
                      onClick={() => setSaleQty(Math.min(selectedItem.quantity, saleQty + 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-xl font-bold text-slate-900">₹{(selectedItem.price * saleQty).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={handleSale}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            )}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={20} />
                Sales Performance
              </h3>
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize",
                      period === p 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={period === 'daily' ? 30 : period === 'weekly' ? 40 : 25}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#4f46e5' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Sales</h3>
              <ArrowRight size={18} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {sales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{sale.itemName}</p>
                    <p className="text-xs text-slate-500">Qty: {sale.quantity}</p>
                  </div>
                  <p className="font-bold text-slate-900">₹{sale.totalAmount}</p>
                </div>
              ))}
              {sales.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No sales recorded today</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
