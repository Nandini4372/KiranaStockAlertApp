import React, { useState } from 'react';
import { UserCircle, Store, MapPin, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/db';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: profile?.storeName || '',
    ownerName: profile?.ownerName || '',
    address: profile?.address || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user.uid, {
        ...formData,
        ownerId: user.uid
      });
      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Store Profile</h1>
        <p className="text-slate-500 mt-1">Configure your business details and alert settings</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-8">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-600 border-4 border-white">
              <Store size={48} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Store size={14} className="text-slate-400" />
                  Store Name
                </label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <UserCircle size={14} className="text-slate-400" />
                  Owner Name
                </label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  Store Address
                </label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <ShieldCheck size={18} />
                Your data is stored securely
              </div>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
