import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Direction } from '../types';
import { soundManager } from '../services/sound';

interface ControlsPadProps {
  onDirectionChange: (dir: Direction) => void;
  currentDirection: Direction;
  isPaused: boolean;
  onTogglePause: () => void;
  accentColor?: string;
  className?: string;
  compact?: boolean;
}

export const ControlsPad: React.FC<ControlsPadProps> = ({
  onDirectionChange,
  currentDirection,
  isPaused,
  onTogglePause,
  accentColor = '#879b29',
  className = '',
  compact = true,
}) => {
  const handlePress = (e: React.PointerEvent, dir: Direction) => {
    e.preventDefault();
    // Vibrate gently on supported mobile devices for instant tactile feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
    soundManager.playMove();
    onDirectionChange(dir);
  };

  const handlePause = (e: React.PointerEvent) => {
    e.preventDefault();
    soundManager.playClick();
    onTogglePause();
  };

  // Responsive compact size for mobile screen maximization
  const padSize = compact ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-36 h-36 sm:w-40 sm:h-40';
  const btnDirV = compact ? 'w-9 h-7 sm:w-10 sm:h-8' : 'w-11 h-9 sm:w-12 sm:h-10';
  const btnDirH = compact ? 'w-7 h-9 sm:w-8 sm:h-10' : 'w-9 h-11 sm:w-10 sm:h-12';
  const centerSize = compact ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-9 h-9 sm:w-10 sm:h-10';
  const iconSize = compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6';

  return (
    <div
      className={`flex flex-col items-center justify-center select-none touch-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Retro Nokia Square Cross D-Pad with Zero-Latency Pointer Event Handlers */}
      <div className={`relative ${padSize} bg-zinc-950/90 border-2 border-zinc-700 rounded-none shadow-xl flex items-center justify-center`}>
        {/* Direction UP */}
        <button
          id="btn-ctrl-up"
          type="button"
          onPointerDown={(e) => handlePress(e, 'UP')}
          className={`absolute top-1 sm:top-1.5 ${btnDirV} rounded-none border-2 border-zinc-700 flex items-center justify-center transition-transform active:scale-90 active:border-amber-400 active:bg-amber-500/40 shadow-sm ${
            currentDirection === 'UP'
              ? 'bg-amber-500/30 text-amber-300 border-amber-500'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
          aria-label="Lên"
        >
          <ChevronUp className={iconSize} />
        </button>

        {/* Direction DOWN */}
        <button
          id="btn-ctrl-down"
          type="button"
          onPointerDown={(e) => handlePress(e, 'DOWN')}
          className={`absolute bottom-1 sm:bottom-1.5 ${btnDirV} rounded-none border-2 border-zinc-700 flex items-center justify-center transition-transform active:scale-90 active:border-amber-400 active:bg-amber-500/40 shadow-sm ${
            currentDirection === 'DOWN'
              ? 'bg-amber-500/30 text-amber-300 border-amber-500'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
          aria-label="Xuống"
        >
          <ChevronDown className={iconSize} />
        </button>

        {/* Direction LEFT */}
        <button
          id="btn-ctrl-left"
          type="button"
          onPointerDown={(e) => handlePress(e, 'LEFT')}
          className={`absolute left-1 sm:left-1.5 ${btnDirH} rounded-none border-2 border-zinc-700 flex items-center justify-center transition-transform active:scale-90 active:border-amber-400 active:bg-amber-500/40 shadow-sm ${
            currentDirection === 'LEFT'
              ? 'bg-amber-500/30 text-amber-300 border-amber-500'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
          aria-label="Trái"
        >
          <ChevronLeft className={iconSize} />
        </button>

        {/* Direction RIGHT */}
        <button
          id="btn-ctrl-right"
          type="button"
          onPointerDown={(e) => handlePress(e, 'RIGHT')}
          className={`absolute right-1 sm:right-1.5 ${btnDirH} rounded-none border-2 border-zinc-700 flex items-center justify-center transition-transform active:scale-90 active:border-amber-400 active:bg-amber-500/40 shadow-sm ${
            currentDirection === 'RIGHT'
              ? 'bg-amber-500/30 text-amber-300 border-amber-500'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
          aria-label="Phải"
        >
          <ChevronRight className={iconSize} />
        </button>

        {/* Center Pause / Resume Button */}
        <button
          id="btn-ctrl-pause"
          type="button"
          onPointerDown={handlePause}
          className={`${centerSize} rounded-none bg-zinc-900 border-2 border-zinc-700 text-zinc-400 flex items-center justify-center hover:text-white active:scale-85 active:border-emerald-500 transition-transform shadow-inner`}
          aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </div>
    </div>
  );
};
