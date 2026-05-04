import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInventory, updateInventoryItem } from '../lib/db';
import { InventoryItem } from '../types';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function LowStock() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const data = await getInventory(user!.uid);
    setItems(data.filter(i => i.quantity <= i.lowStockThreshold));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Low Stock Alerts</h1>
        <p className="text-slate-500 mt-1">Items that require immediate restocking</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <motion.div 
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{item.category}</p>
              
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Stock</p>
                  <p className="text-3xl font-black text-red-600">{item.quantity} <span className="text-sm font-medium">{item.unit}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Threshold</p>
                  <p className="text-lg font-bold text-slate-700">{item.lowStockThreshold}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <input 
                    type="number"
                    defaultValue={item.quantity}
                    className="w-full px-3 py-2 bg-transparent text-slate-900 font-bold outline-none text-center"
                    onBlur={async (e) => {
                      const newQty = Number(e.target.value);
                      if (newQty !== item.quantity && !isNaN(newQty)) {
                        try {
                          await updateInventoryItem(item.id!, { quantity: newQty });
                          toast.success(`Updated ${item.name} stock`);
                          loadData();
                        } catch (err) {
                          toast.error("Failed to update stock");
                        }
                      }
                    }}
                  />
                  <div className="px-3 py-2 bg-slate-100 text-[10px] font-bold text-slate-400 uppercase border-l border-slate-200">
                    SET
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/inventory')}
                  className="w-12 h-12 flex items-center justify-center bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  title="View in Inventory"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">All set!</h3>
            <p className="text-slate-500">Your inventory levels are looking healthy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
