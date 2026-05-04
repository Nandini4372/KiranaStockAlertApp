import React from 'react';
import { 
  ArrowLeft, 
  Package, 
  LayoutDashboard, 
  History, 
  AlertTriangle, 
  FileDown, 
  IndianRupee, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Guide() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. The Dashboard",
      icon: LayoutDashboard,
      color: "bg-indigo-50 text-indigo-600",
      content: "Your main command center. It shows real-time stats for the current day. The data clears at the start of every day to give you a fresh view of today's performance.",
      details: [
        "Revenue & Items Sold: Tracks total sales and unit counts for the current day.",
        "Performance Graph: Visualize your sales trends with a bar chart toggling between Daily, Weekly, Monthly, and Yearly views.",
        "Quick Sale: Use the 'Record Sale' section to quickly deduct stock and log revenue."
      ]
    },
    {
      title: "2. Inventory Management",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
      content: "Maintain a complete digital list of your products. Accurate inventory leads to better business decisions.",
      details: [
        "Product Details: Store Name, Brand, Category, Unit (kg/pc), Price, and Stock Levels.",
        "Excel Import/Export: Use the 'Template' button to download a standard format. Fill it and import your entire catalog at once.",
        "Bulk Action: Search and filter through thousands of items instantly."
      ]
    },
    {
      title: "3. Low Stock Alerts",
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600",
      content: "Never run out of stock again. The system monitors your 'Reorder Level' values automatically.",
      details: [
        "Instant Identification: Items falling below your set limit appear here highlighted in red.",
        "Quick Update: You can update the stock quantity directly from this page without navigating to full inventory.",
        "Proactive Ordering: View stock levels at a glance to prepare your next distributor order."
      ]
    },
    {
      title: "4. Sales History",
      icon: History,
      color: "bg-purple-50 text-purple-600",
      content: "A detailed record of every activity in your store, archived for your review.",
      details: [
        "3-Month Limit: The app maintains a detailed log of all transactions for the last 3 months.",
        "Categorized View: Records are grouped by Month, then by Day, showing exactly how much you earned each day.",
        "Transparency: Tap on any month to see a breakdown of daily activity and revenue."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>

        <header className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Using the <span className="text-indigo-600">Kirana Alert</span> App
            </h1>
            <p className="mt-4 text-xl text-slate-500 max-w-2xl">
              A comprehensive guide to managing your shop efficiently and scaling your operations.
            </p>
          </motion.div>
        </header>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <motion.section 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                  <section.icon size={28} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-900">{section.title}</h2>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {section.content}
                  </p>
                  <ul className="grid gap-3 pt-2">
                    {section.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-500 text-sm">
                        <CheckCircle2 size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>
          ))}

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-indigo-600 p-10 rounded-[40px] text-white text-center shadow-xl shadow-indigo-100"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap size={32} />
            </div>
            <h3 className="text-3xl font-black mb-4">Pro Tip: Import/Export</h3>
            <p className="text-indigo-100 font-medium max-w-xl mx-auto mb-8">
              Moving from paper or another software? Download our Excel Template, fill in your stock details, and import thousands of items in seconds.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-lg"
            >
              Get Started Now
            </button>
          </motion.div>
        </div>

        <footer className="mt-20 pt-12 border-t border-slate-200 text-center text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} Kirana Store Alert. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
