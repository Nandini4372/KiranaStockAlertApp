import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2,
  FileDown,
  FileUp,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../lib/db';
import { InventoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dairy',
    brand: '',
    quantity: 0,
    unit: 'pcs',
    price: 0,
    lowStockThreshold: 5
  });

  const categories = ['Dairy', 'Grains', 'Produce', 'Snacks', 'Beverages', 'Other'];

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const data = await getInventory(user!.uid);
    setInventory(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const itemData = { ...formData, ownerId: user.uid };
    
    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id!, itemData);
        toast.success("Item updated");
      } else {
        await addInventoryItem(itemData);
        toast.success("Item added");
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteInventoryItem(id);
      toast.success("Item deleted");
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Dairy',
      quantity: 0,
      unit: 'pcs',
      price: 0,
      lowStockThreshold: 5
    });
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      lowStockThreshold: item.lowStockThreshold
    });
    setIsModalOpen(true);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws) as any[];

        if (json.length === 0) {
          toast.error("The file is empty");
          return;
        }

        const promises = json.map((row, index) => {
          // Helper to find column by multiple possible names
          const findVal = (keys: string[]) => {
            const match = Object.keys(row).find(k => 
              keys.some(key => k.toLowerCase().trim() === key.toLowerCase())
            );
            return match ? row[match] : undefined;
          };

          const name = findVal(['product', 'name', 'item', 'product name']);
          if (!name) {
            throw new Error(`Row ${index + 1} is missing a Product column`);
          }

          return addInventoryItem({
            name: String(name),
            category: String(findVal(['category', 'type', 'group']) || 'Other'),
            brand: String(findVal(['brand', 'company', 'make']) || ''),
            quantity: Number(findVal(['stock quantity', 'quantity', 'stock', 'qty']) || 0),
            unit: String(findVal(['unit', 'measure']) || 'pcs'),
            price: Number(findVal(['unit price', 'price', 'rate', 'cost']) || 0),
            lowStockThreshold: Number(findVal(['reorder level', 'threshold', 'alert level', 'limit']) || 5),
            ownerId: user.uid
          });
        });

        await Promise.all(promises);
        toast.success(`Successfully imported ${json.length} items`);
        loadData();
      } catch (error: any) {
        console.error("Import Error:", error);
        toast.error(error.message || "Import failed. Check your file columns.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      {
        Product: 'Milk 1L',
        Category: 'Dairy',
        Brand: 'Amul',
        Unit: 'pkt',
        'Unit Price': 60,
        'Stock Quantity': 20,
        'Reorder Level': 5
      },
      {
        Product: 'Basmati Rice 5kg',
        Category: 'Grains',
        Brand: 'India Gate',
        Unit: 'pcs',
        'Unit Price': 450,
        'Stock Quantity': 10,
        'Reorder Level': 2
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Template");
    XLSX.writeFile(wb, "Inventory_Template.xlsx");
  };

  const handleExport = () => {
    const mappedData = inventory.map(item => ({
      Product: item.name,
      Category: item.category,
      Brand: item.brand || '',
      Unit: item.unit,
      'Unit Price': item.price,
      'Stock Quantity': item.quantity,
      'Reorder Level': item.lowStockThreshold
    }));
    const ws = XLSX.utils.json_to_sheet(mappedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "inventory_export.xlsx");
  };

  const filteredInventory = inventory.filter(item => {
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            title="Download Excel Template"
          >
            <FileDown size={18} />
            Template
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
          >
            <FileDown size={18} />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
            <FileUp size={18} />
            Import
            <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleImport} />
          </label>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search products by name..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Brand</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-400">ID: {item.id?.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600 font-medium">{item.brand || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "font-medium",
                      item.quantity <= item.lowStockThreshold ? "text-red-500 flex items-center gap-1" : "text-slate-700"
                    )}>
                      {item.quantity} {item.unit}
                      {item.quantity <= item.lowStockThreshold && <AlertCircle size={14} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{item.price}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-indigo-100 shadow-sm transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id!)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-100 shadow-sm transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No items found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Product Name</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Brand</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. Amul, Nestle"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Unit</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option>kg</option>
                      <option>l</option>
                      <option>pcs</option>
                      <option>box</option>
                      <option>pkt</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Quantity</label>
                    <input 
                      type="number" required min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Price Per Unit (₹)</label>
                    <input 
                      type="number" required min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Low Stock Threshold (Alert me at this level)</label>
                    <input 
                      type="number" required min="1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.lowStockThreshold}
                      onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    {editingItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
