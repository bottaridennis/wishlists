import { LogOut, Heart, User } from 'lucide-react';

interface HeaderProps {
  user: {
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const isPipino = user?.email === 'dennisbottari@gmail.com';
  const roleName = isPipino ? 'Pipino 🧔‍♂️' : 'Pipina 👩‍🦰';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all px-4 sm:px-6">
      <div className="max-w-5xl mx-auto py-3.5 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-3" id="header-brand">
          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shadow-xs">
            <Heart size={15} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 tracking-wider leading-none uppercase">
              Pipino &amp; Pipina
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider block mt-1">
              IL NOSTRO SPAZIO REGALI
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        {user && (
          <div className="flex items-center gap-4" id="header-user-actions">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-semibold border border-slate-200">
                  <User size={13} />
                </div>
              )}
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user.displayName.split(' ')[0]}
                </p>
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mt-0.5">
                  {roleName}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              id="logout-btn"
              onClick={onLogout}
              className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
              title="Disconnetti"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
