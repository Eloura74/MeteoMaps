import React from 'react';
import { Map, Search, Globe, Library, User } from 'lucide-react';

const BottomTabNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'map', icon: Map, label: 'Carte' },
    { id: 'search', icon: Search, label: 'Itinéraire' },
    { id: 'discovery', icon: Globe, label: 'Découvrir' },
    { id: 'library', icon: Library, label: 'Bibliothèque' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] md:hidden glass-pro border-t border-white/5 px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 scale-110' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-white rounded-full translate-y-[-1px]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNav;
