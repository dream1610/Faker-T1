import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 border-t border-zinc-800 bg-zinc-950/80 text-zinc-500 font-mono text-xs select-none mt-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span>🐍 Rắn Săn Mồi</span>
          <span>•</span>
          <span className="text-zinc-400">Phong Cách Khối Vuông Nokia 3310</span>
        </div>
        <div className="text-emerald-400 font-bold tracking-wider hover:text-emerald-300 transition-colors">
          Designed by Gdreed
        </div>
      </div>
    </footer>
  );
};
