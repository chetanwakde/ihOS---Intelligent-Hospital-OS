import React, { useState } from 'react';
import { StaffRole } from '../types';
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';

interface AuthUser {
  name: string;
  role: string;
}

interface Props {
  onLogin: (user: AuthUser) => void;
}

export const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email && password) {
      // Mock Login Success - Derive name from email for better UX
      const namePart = email.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      onLogin({
        name: `Dr. ${displayName}`, 
        role: StaffRole.DOCTOR
      });
    } else {
      setError('Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    onLogin({
        name: 'Guest Administrator',
        role: 'Hospital Admin'
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white relative overflow-hidden flex-col justify-between p-16">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-900/50">
               <Activity className="w-10 h-10 text-white" />
            </div>
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-white">ihOS</h1>
                <p className="text-blue-200 text-sm font-medium tracking-wide uppercase mt-1">Intelligent Hospital OS</p>
            </div>
          </div>
          <p className="text-slate-300 text-xl max-w-lg leading-relaxed font-light">
            Orchestrating patient flow, staff resilience, and resource allocation with next-generation predictive AI.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
             <div className="bg-green-500/20 p-2.5 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-green-400" />
             </div>
             <div>
               <h3 className="font-semibold text-white">HIPAA Compliant Core</h3>
               <p className="text-sm text-slate-400">Enterprise-grade security & privacy</p>
             </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
             <div className="bg-blue-500/20 p-2.5 rounded-xl">
                <HeartPulse className="w-6 h-6 text-blue-400" />
             </div>
             <div>
               <h3 className="font-semibold text-white">AI Clinical Triage</h3>
               <p className="text-sm text-slate-400">Real-time acuity scoring & bed matching</p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              Sign in to access your dashboard.
            </p>
          </div>

            {/* Demo Access Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-24 h-24 text-blue-600 transform rotate-12" />
                </div>
                <div className="relative z-10">
                    <h3 className="font-bold text-blue-900 text-lg mb-1">New here? Try the Demo</h3>
                    <p className="text-blue-700/80 text-sm mb-4">Experience the full platform with simulated data. No account required.</p>
                    <button 
                        onClick={handleDemoLogin}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-blue-50 text-blue-700 font-semibold py-2.5 px-4 rounded-xl border border-blue-200 shadow-sm transition-all flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98]"
                    >
                        <Sparkles className="w-4 h-4" /> Launch Live Demo
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-500 font-medium">or sign in with email</span>
                </div>
            </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 shadow-sm"
                  placeholder="name@hospital.org"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">Forgot password?</a>
              </div>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8 leading-relaxed">
             Protected by Enterprise-Grade Security. <br/>
             Authorized personnel only. By signing in, you agree to our policies.
          </p>
        </div>
      </div>
    </div>
  );
};