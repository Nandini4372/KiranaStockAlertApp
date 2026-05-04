import React from 'react';
import { Package, LogIn, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signIn();
      navigate('/');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const features = [
    "Real-time Inventory Tracking",
    "Smart Low-Stock Notifications",
    "Quick Sales Recording",
    "Analytics Dashboard"
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <div className="flex-1 bg-indigo-600 p-12 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Animated Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-4 border-white rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border-4 border-white rounded-full animate-bounce" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600">
              <Package size={28} />
            </div>
            <span className="text-2xl font-black tracking-tighter">KiranaAlert</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            Manage your store <br /> with intelligence.
          </h1>

          <div className="space-y-6">
            {features.map((f, i) => (
              <motion.div 
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-4 text-xl text-indigo-50"
              >
                <CheckCircle2 className="text-indigo-300" />
                {f}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-indigo-500 pt-8 mt-12">
          <p className="text-indigo-200">The most trusted inventory partner for over 500+ small businesses across India.</p>
        </div>
      </div>

      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Store Owner</h2>
            <p className="text-slate-500">Log in to your dashboard to manage your stock and sales.</p>
          </div>

          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-400">Secure Authentication</span></div>
            </div>

            <p className="text-xs text-center text-slate-400 leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy. KiranaAlert uses Google Firebase for secure data handling.
            </p>
          </div>

          <div 
            onClick={() => navigate('/guide')}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 py-3 rounded-full cursor-pointer hover:bg-slate-100 transition-colors group"
          >
            Ready to scale your business?
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
