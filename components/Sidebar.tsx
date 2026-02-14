
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import SettingsModal from './SettingsModal';

const navItems = [
  { name: 'Mood Tracker', icon: 'mood' },
  { name: 'Journal', icon: 'description' },
  { name: 'Insights', icon: 'insights' },
  { name: 'Interests', icon: 'explore' },
];

const AnimatedIcon: React.FC<{ name: string; active: boolean; }> = ({ name, active }) => {
  const iconColor = active ? 'text-primary' : 'group-hover:text-accent-teal';
  const baseClasses = `w-6 h-6 transition-colors duration-300 ${iconColor}`;

  switch (name) {
    case 'mood':
      return (
        <svg viewBox="0 0 24 24" className={baseClasses} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2" className="transition-all group-hover:d[M8,12s1.5,4,4,4,4-4,4-4]"></path>
          <line x1="9" y1="9" x2="9.01" y2="9" className="transition-all group-hover:scale-125 origin-center"></line>
          <line x1="15" y1="9" x2="15.01" y2="9" className="transition-all group-hover:scale-125 origin-center"></line>
        </svg>
      );
    case 'description':
      return (
        <svg viewBox="0 0 24 24" className={`${baseClasses} transition-transform duration-300 group-hover:scale-110`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="m11.5 16.5-2-1.5 2-1.5" className="journal-icon-pen transition-transform duration-300" />
          <path d="M8.5 14.5h5" className="journal-icon-scribble transition-all duration-300" strokeDashoffset="50" strokeDasharray="50" />
        </svg>
      );
    case 'insights':
      return (
        <svg viewBox="0 0 24 24" className={baseClasses} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          <path className="insights-icon-line" d="M2 12h4l3-9 6 18 3-9h4" />
          <circle cx="6" cy="12" r="1.5" className="insights-icon-dot1 fill-current stroke-none transition-transform origin-center" transform="scale(0)" />
          <circle cx="9" cy="3" r="1.5" className="insights-icon-dot2 fill-current stroke-none transition-transform origin-center" transform="scale(0)" />
          <circle cx="15" cy="21" r="1.5" className="insights-icon-dot3 fill-current stroke-none transition-transform origin-center" transform="scale(0)" />
        </svg>
      );
    case 'explore':
      return (
        <div className="animate-on-hover-compass-spin">
          <svg viewBox="0 0 24 24" className={baseClasses} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>
      );
    default:
      return <span className="material-symbols-outlined">{name}</span>;
  }
};


interface NavLinkProps {
  name: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ name, icon, active, onClick }) => {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 transform hover:scale-105 ${active
          ? 'bg-primary/20 text-text-light'
          : 'hover:bg-white/10 text-slate-300 hover:text-text-light'
        }`}
    >
      <AnimatedIcon name={icon} active={active} />
      <span className={`text-base font-semibold`}>{name}</span>
    </a>
  );
};

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user }) => {
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  return (
    <aside className="w-80 h-full bg-surface-dark flex-col justify-between p-6 z-20 shadow-2xl rounded-r-2xl shrink-0 hidden md:flex">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 px-2">
          <div className="bg-gradient-to-tr from-primary to-accent-teal aspect-square rounded-full size-12 flex items-center justify-center shadow-[0_0_15px_rgba(255,159,67,0.3)]">
            <span className="material-symbols-outlined text-background-dark text-2xl font-bold">rocket_launch</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-light text-xl font-bold tracking-tight">Evolve</h1>
            <p className="text-secondary/80 text-xs font-medium tracking-wide">Playful Growth</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-8">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              name={item.name}
              icon={item.icon}
              active={activePage === item.name}
              onClick={() => setActivePage(item.name)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom section: Settings + User */}
      <div className="flex flex-col gap-3">
        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors duration-300 group-hover:rotate-90">
            settings
          </span>
          <span className="text-sm font-medium text-slate-300 group-hover:text-text-light transition-colors">
            Settings
          </span>
        </button>

        {/* User profile */}
        <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-dark border border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
          {user ? (
            <>
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 ring-2 ring-primary/30"
                style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBybBfSOscd_IlJT3tFETk0yqdnJeh6t7E7l8kQ7fyT8pLeGUAE4g12gbvicp2eKcMSmYaO6KoYteDHx-JwClDu9YYYPWg7ORoMTpT9poK97ACozytUBgfWIKbFA82_cG_zIOCnZdPDcQVaMVVqQBtRcW41YRj67F4cMuLETq4jcNRadVuGI7XBUtylHIedmC0s2GdMp_-z6w1BxXz-bS2RtQQPWqKfXGD3bAF7UsomLbCWtS0R0mhyaxkvUSs4ppvDjo3-KQA6oQ")` }}
                aria-label="Portrait of Alex Johnson"
              ></div>
              <div className="flex flex-col flex-1">
                <p className="text-text-light text-sm font-bold truncate">{user.email}</p>
                <p className="text-slate-400 text-xs">Growth Seeker</p>
              </div>
              <button
                onClick={handleSignOut}
                className="material-symbols-outlined text-slate-400 text-sm transition-transform duration-300 group-hover:rotate-45"
                title="Sign Out"
              >
                logout
              </button>
            </>
          ) : (
            <>
              <div className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 ring-2 ring-primary/30">
                <span className="material-symbols-outlined text-background-dark text-2xl font-bold">person</span>
              </div>
              <div className="flex flex-col flex-1">
                <p className="text-text-light text-sm font-bold">Guest User</p>
                <p className="text-slate-400 text-xs">Sign in to save data</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm transition-transform duration-300 group-hover:rotate-45">settings</span>
            </>
          )}
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
};

export default Sidebar;
