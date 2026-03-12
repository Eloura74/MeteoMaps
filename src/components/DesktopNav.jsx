import React from 'react';
import { Map, Search, Globe, Library } from 'lucide-react';

const DesktopNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'search', icon: Search, label: 'Itinéraire' },
    { id: 'discovery', icon: Globe, label: 'Découvrir' },
    { id: 'library', icon: Library, label: 'Bibliothèque' },
  ];

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-[1005] hidden md:flex flex-col gap-4 p-2 glass-pro rounded-3xl border border-white/5 shadow-2xl animate-spring-right">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(isActive ? 'map' : tab.id)}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 ${
              isActive 
                ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/10'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            
            {/* Tooltip */}
            <div className="absolute left-16 px-3 py-1.5 bg-zinc-950 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-100 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap shadow-2xl">
              {tab.label}
            </div>

            {/* Active Indicator Dot */}
             {isActive && (
              <div className="absolute -right-1 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
            )}
          </button>
        );
      })}
      
      <div className="w-8 h-[1px] bg-white/5 mx-auto my-2" />
      
      <button
        onClick={() => onTabChange('map')}
        className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 ${
          activeTab === 'map' 
            ? 'bg-zinc-100 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
            : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/10'
        }`}
      >
        <Map size={20} />
      </button>
    </nav>
  );
};

export default DesktopNav;
