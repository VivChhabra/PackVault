import React from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { 
      id: 'collection', 
      label: 'Collection', 
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="white" strokeWidth="2.5" className="w-6 h-6">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    { 
      id: 'binders', 
      label: 'Binders', 
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill={active ? "white" : "none"} stroke="white" strokeWidth="2.5" className="w-6 h-6">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      )
    },
    { 
      id: 'trades', 
      label: 'Trades', 
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6">
          <path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M4 17h16" />
        </svg>
      )
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#7A3126] border-t border-black/30 pb-safe z-50 rounded-t-xl shadow-[0_-8px_20px_rgba(0,0,0,0.4)] touch-manipulation">
      <div className="flex justify-around items-center h-16 sm:h-20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${
              activeTab === tab.id ? 'bg-black/10' : ''
            }`}
          >
            <div className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'opacity-40'}`}>
              {tab.icon(activeTab === tab.id)}
            </div>
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-1 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-white/40'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;