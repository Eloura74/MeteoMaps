import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SlidePanel = ({ 
  children, 
  title, 
  isOpen, 
  onClose, 
  headerExtra,
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Focus effect when opened
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false);
      window.scrollTo(0, 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile interaction - very subtle blur */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[1000] md:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel Overlay */}
      <div className={`
        fixed z-[2000] glass-pro flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
        /* Mobile: Bottom sheet */
        inset-x-0 bottom-4 mx-4 mb-safe rounded-[2.5rem]
        ${isExpanded ? 'h-[92vh]' : 'h-[65vh]'}
        /* Desktop: Floating Sidebar */
        md:inset-y-4 md:left-4 md:right-auto md:w-96 md:h-auto md:max-w-[400px] md:mx-0 md:rounded-[2rem] md:mb-0
        ${className}
      `}>
        {/* Handle for mobile expansion */}
        <div 
          className="md:hidden pt-4 pb-2 cursor-pointer touch-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto" />
        </div>

        {/* Header - Transparent and clean */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{title}</h3>
            {headerExtra}
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-white/5 rounded-2xl transition-all text-zinc-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 md:pb-8">
          {children}
        </div>
      </div>
    </>
  );
};

export default SlidePanel;
