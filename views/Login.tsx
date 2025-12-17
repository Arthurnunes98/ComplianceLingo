import React, { useState } from 'react';
import Button from '../components/Button';
import { ShieldCheck, Lock, Mail, ArrowRight, User as UserIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    if (!isLogin && !name) return;

    setIsLoading(true);
    
    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            if (error) throw error;
            // Handle case where email confirmation is required
            alert("Account created! If email confirmation is enabled, please check your inbox.");
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred during authentication.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-50" />
          <div className="relative z-10">
            <div className="inline-flex p-3 bg-white/10 rounded-xl mb-4 text-white backdrop-blur-sm">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Compliance Lingo</h1>
            <p className="text-indigo-100 text-sm">Study Aid Platform</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6 p-1 bg-slate-50 rounded-lg">
             <button 
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Login
             </button>
             <button 
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Sign Up
             </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-sm text-rose-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={18} />
                        </div>
                        <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="John Doe"
                        required={!isLogin}
                        />
                    </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full justify-center py-3 text-lg">
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
             {isLogin ? (
                 <>New here? <button onClick={() => setIsLogin(false)} className="text-indigo-600 font-medium hover:underline">Create an account</button></>
             ) : (
                 <>Already have an account? <button onClick={() => setIsLogin(true)} className="text-indigo-600 font-medium hover:underline">Log in</button></>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
