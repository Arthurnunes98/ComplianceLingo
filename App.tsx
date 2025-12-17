import React, { useState, useEffect } from 'react';
import { AppView, Note, User } from './types';
import Notes from './views/Notes';
import Translator from './views/Translator';
import Quiz from './views/Quiz';
import News from './views/News';
import Login from './views/Login';
import { supabase } from './services/supabase';
import { Book, GraduationCap, Languages, ShieldCheck, LogOut, Menu, Newspaper } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [currentView, setCurrentView] = useState<AppView>(AppView.NOTES);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Notes state is now managed within the Notes component (fetching from DB),
  // but we keep it here if we want to pass it to Quiz or other components.
  // For the Quiz to work, we will lift the state up: Notes component will populate this.
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User'
        });
      }
      setLoadingSession(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User'
        });
      } else {
        setUser(null);
        setNotes([]);
      }
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navItems = [
    { id: AppView.NOTES, label: 'Study Notes', icon: Book },
    { id: AppView.TRANSLATOR, label: 'Tech Translator', icon: Languages },
    { id: AppView.QUIZ, label: 'Smart Quiz', icon: GraduationCap },
    { id: AppView.NEWS, label: 'Updates', icon: Newspaper },
  ];

  if (loadingSession) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-indigo-700">
           <ShieldCheck size={28} className="shrink-0" />
           <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              Compliance<br /><span className="text-indigo-600">Lingo</span>
           </h1>
        </div>

        <div className="p-4">
          <div className="mb-6 px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-rose-600 transition-colors p-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header & Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-indigo-600" />
            <span className="font-bold text-slate-900">ComplianceLingo</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-30 bg-slate-800/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <nav className="space-y-2 mt-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      currentView === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 mt-4 border-t border-slate-100"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 overflow-hidden relative w-full bg-slate-50/50">
          <div className="h-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar">
            {currentView === AppView.NOTES && <Notes notes={notes} setNotes={setNotes} user={user} />}
            {currentView === AppView.TRANSLATOR && <Translator />}
            {currentView === AppView.QUIZ && <Quiz notes={notes} />}
            {currentView === AppView.NEWS && <News />}
          </div>
        </main>

      </div>
    </div>
  );
};

export default App;
