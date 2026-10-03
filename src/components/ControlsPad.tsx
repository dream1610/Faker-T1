import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Gamepad2,
  Maximize2,
  CircleDot,
} from 'lucide-react';
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

type PadLayout = 'cross' | 'diamond';
type PadScale = 'normal' | 'large' | 'xlarge';

export const ControlsPad: React.FC<ControlsPadProps> = ({
  onDirectionChange,
  currentDirection,
  isPaused,
  onTogglePause,
  accentColor = '#10b981',
  className = '',
  compact = false,
}) => {
  // Load user preference or default to ergonomically large
  const [padLayout, setPadLayout] = useState<PadLayout>(() => {
    try {
      return (localStorage.getItem('snake_ctrl_layout') as PadLayout) || 'cross';
    } catch {
      return 'cross';
    }
  });

  const [padScale, setPadScale] = useState<PadScale>(() => {
    try {
      return (localStorage.getItem('snake_ctrl_scale') as PadScale) || (compact ? 'normal' : 'large');
    } catch {
      return 'large';
    }
  });

  const [showConfig, setShowConfig] = useState(false);
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerActiveRef = useRef<boolean>(false);
  const lastTriggeredDirRef = useRef<Direction | null>(null);

  const saveLayout = (layout: PadLayout) => {
    setPadLayout(layout);
    try {
      localStorage.setItem('snake_ctrl_layout', layout);
    } catch {}
  };

  const saveScale = (scale: PadScale) => {
    setPadScale(scale);
    try {
      localStorage.setItem('snake_ctrl_scale', scale);
    } catch {}
  };

  // Tactile feedback and sound
  const triggerDirection = useCallback((dir: Direction) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(18); // Crisp tactile buzz
    }
    soundManager.playMove();
    onDirectionChange(dir);
  }, [onDirectionChange]);

  const handlePointerDown = (e: React.PointerEvent, dir: Direction) => {
    e.preventDefault();
    e.stopPropagation();
    lastTriggeredDirRef.current = dir;
    triggerDirection(dir);
  };

  const handlePause = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    soundManager.playClick();
    onTogglePause();
  };

  // Touch gesture sliding: Detect direction when dragging thumb across the pad
  const handlePadPointerDown = (e: React.PointerEvent) => {
    pointerActiveRef.current = true;
  };

  const handlePadPointerMove = (e: React.PointerEvent) => {
    if (!pointerActiveRef.current || !padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Deadzone threshold (at least 20px from center before triggering slide)
    if (distance < 20) return;

    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      dir = dy > 0 ? 'DOWN' : 'UP';
    }

    if (dir !== lastTriggeredDirRef.current) {
      lastTriggeredDirRef.current = dir;
      triggerDirection(dir);
    }
  };

  const handlePadPointerUp = () => {
    pointerActiveRef.current = false;
    lastTriggeredDirRef.current = null;
  };

  // Dimensions based on pad scale
  const scaleConfig = {
    normal: {
      container: 'w-44 h-44 sm:w-48 sm:h-48',
      buttonV: 'w-14 h-13 sm:w-16 sm:h-14',
      buttonH: 'w-13 h-14 sm:w-14 sm:h-16',
      diamondBtn: 'w-13 h-13 sm:w-15 sm:h-15',
      center: 'w-12 h-12 sm:w-13 sm:h-13',
      icon: 'w-7 h-7 sm:w-8 sm:h-8',
      offsetV: 'top-1',
      offsetVBot: 'bottom-1',
      offsetHLeft: 'left-1',
      offsetHRight: 'right-1',
    },
    large: {
      container: 'w-52 h-52 sm:w-56 sm:h-56',
      buttonV: 'w-18 h-16 sm:w-20 sm:h-17',
      buttonH: 'w-16 h-18 sm:w-17 sm:h-20',
      diamondBtn: 'w-16 h-16 sm:w-17 sm:h-17',
      center: 'w-14 h-14 sm:w-15 sm:h-15',
      icon: 'w-8 h-8 sm:w-9 sm:h-9',
      offsetV: 'top-1.5',
      offsetVBot: 'bottom-1.5',
      offsetHLeft: 'left-1.5',
      offsetHRight: 'right-1.5',
    },
    xlarge: {
      container: 'w-60 h-60 sm:w-64 sm:h-64',
      buttonV: 'w-22 h-19 sm:w-24 sm:h-20',
      buttonH: 'w-19 h-22 sm:w-20 sm:h-24',
      diamondBtn: 'w-19 h-19 sm:w-20 sm:h-20',
      center: 'w-16 h-16 sm:w-18 sm:h-18',
      icon: 'w-10 h-10 sm:w-11 sm:h-11',
      offsetV: 'top-2',
      offsetVBot: 'bottom-2',
      offsetHLeft: 'left-2',
      offsetHRight: 'right-2',
    },
  }[padScale];

  return (
    <div
      className={`flex flex-col items-center justify-center select-none touch-none relative ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Top micro settings bar */}
      <div className="flex items-center justify-between w-full max-w-xs px-2 mb-1 text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => saveLayout(padLayout === 'cross' ? 'diamond' : 'cross')}
            className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            title="Đổi kiểu hiển thị nút"
          >
            <Gamepad2 className="w-3 h-3 text-emerald-400" />
            <span>{padLayout === 'cross' ? 'Chữ Thập 3D' : 'Nút Kim Cương'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next: Record<PadScale, PadScale> = {
                normal: 'large',
                large: 'xlarge',
                xlarge: 'normal',
              };
              saveScale(next[padScale]);
            }}
            className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            title="Đổi kích thước nút"
          >
            <Maximize2 className="w-3 h-3 text-amber-400" />
            <span>
              {padScale === 'normal' ? 'Cỡ Vừa' : padScale === 'large' ? 'Cỡ To' : 'Cực Đại'}
            </span>
          </button>
        </div>

        <span className="hidden xs:inline text-[9px] text-zinc-500">
          Chạm hoặc Vuốt
        </span>
      </div>

      {/* Main Gamepad Surface */}
      <div
        ref={padRef}
        onPointerDown={handlePadPointerDown}
        onPointerMove={handlePadPointerMove}
        onPointerUp={handlePadPointerUp}
        onPointerCancel={handlePadPointerUp}
        className={`relative ${scaleConfig.container} flex items-center justify-center p-2 rounded-3xl bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-2 border-zinc-700/80 shadow-[0_8px_20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all`}
      >
        {/* Subtle direction guides */}
        <div className="absolute inset-4 rounded-2xl border border-dashed border-zinc-800 pointer-events-none" />

        {padLayout === 'cross' ? (
          /* ========================================================
             STYLE 1: 3D ARCADE CROSS D-PAD (Phím Chữ Thập 3D To Bản)
             ======================================================== */
          <>
            {/* BUTTON UP */}
            <button
              id="btn-ctrl-up"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'UP')}
              className={`absolute ${scaleConfig.offsetV} ${scaleConfig.buttonV} rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border-2 ${
                currentDirection === 'UP'
                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] translate-y-0.5'
                  : 'bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-100 border-zinc-500 hover:from-zinc-600 hover:to-zinc-700 shadow-[0_4px_0_#18181b,0_6px_10px_rgba(0,0,0,0.4)] active:shadow-[0_1px_0_#18181b] active:translate-y-1'
              }`}
              aria-label="Lên"
            >
              <ChevronUp className={`${scaleConfig.icon} stroke-[3] drop-shadow-sm`} />
              <span className="text-[8px] font-black uppercase tracking-wider opacity-60 -mt-1">LÊN</span>
            </button>

            {/* BUTTON DOWN */}
            <button
              id="btn-ctrl-down"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'DOWN')}
              className={`absolute ${scaleConfig.offsetVBot} ${scaleConfig.buttonV} rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border-2 ${
                currentDirection === 'DOWN'
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] translate-y-0.5'
                  : 'bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-100 border-zinc-500 hover:from-zinc-600 hover:to-zinc-700 shadow-[0_4px_0_#18181b,0_6px_10px_rgba(0,0,0,0.4)] active:shadow-[0_1px_0_#18181b] active:translate-y-1'
              }`}
              aria-label="Xuống"
            >
              <span className="text-[8px] font-black uppercase tracking-wider opacity-60 -mb-1">XUỐNG</span>
              <ChevronDown className={`${scaleConfig.icon} stroke-[3] drop-shadow-sm`} />
            </button>

            {/* BUTTON LEFT */}
            <button
              id="btn-ctrl-left"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'LEFT')}
              className={`absolute ${scaleConfig.offsetHLeft} ${scaleConfig.buttonH} rounded-2xl flex items-center justify-center transition-all active:scale-95 border-2 ${
                currentDirection === 'LEFT'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] translate-y-0.5'
                  : 'bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-100 border-zinc-500 hover:from-zinc-600 hover:to-zinc-700 shadow-[0_4px_0_#18181b,0_6px_10px_rgba(0,0,0,0.4)] active:shadow-[0_1px_0_#18181b] active:translate-y-1'
              }`}
              aria-label="Trái"
            >
              <ChevronLeft className={`${scaleConfig.icon} stroke-[3] drop-shadow-sm`} />
            </button>

            {/* BUTTON RIGHT */}
            <button
              id="btn-ctrl-right"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'RIGHT')}
              className={`absolute ${scaleConfig.offsetHRight} ${scaleConfig.buttonH} rounded-2xl flex items-center justify-center transition-all active:scale-95 border-2 ${
                currentDirection === 'RIGHT'
                  ? 'bg-gradient-to-l from-emerald-600 to-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] translate-y-0.5'
                  : 'bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-100 border-zinc-500 hover:from-zinc-600 hover:to-zinc-700 shadow-[0_4px_0_#18181b,0_6px_10px_rgba(0,0,0,0.4)] active:shadow-[0_1px_0_#18181b] active:translate-y-1'
              }`}
              aria-label="Phải"
            >
              <ChevronRight className={`${scaleConfig.icon} stroke-[3] drop-shadow-sm`} />
            </button>

            {/* CENTER BUTTON: PAUSE / RESUME */}
            <button
              id="btn-ctrl-pause"
              type="button"
              onPointerDown={handlePause}
              className={`${scaleConfig.center} rounded-full bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-zinc-600 text-zinc-300 flex flex-col items-center justify-center hover:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.4)] active:scale-90 active:border-emerald-500 transition-all z-10`}
              aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-emerald-400 fill-emerald-400 ml-0.5 animate-pulse" />
              ) : (
                <Pause className="w-5 h-5 text-amber-400 fill-amber-400" />
              )}
              <span className="text-[7px] font-bold tracking-tighter opacity-70 mt-0.5">
                {isPaused ? 'CHƠI' : 'DỪNG'}
              </span>
            </button>
          </>
        ) : (
          /* ========================================================
             STYLE 2: DIAMOND BUTTONS (4 Nút Lớn Tách Rời Siêu Thoáng)
             ======================================================== */
          <div className="w-full h-full relative flex items-center justify-center">
            {/* UP */}
            <button
              id="btn-ctrl-diamond-up"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'UP')}
              className={`absolute top-0 ${scaleConfig.diamondBtn} rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 ${
                currentDirection === 'UP'
                  ? 'bg-emerald-500 text-white border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                  : 'bg-zinc-800 text-zinc-100 border-zinc-600 hover:bg-zinc-700 shadow-[0_4px_0_#18181b]'
              }`}
            >
              <ChevronUp className={`${scaleConfig.icon} stroke-[3]`} />
            </button>

            {/* DOWN */}
            <button
              id="btn-ctrl-diamond-down"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'DOWN')}
              className={`absolute bottom-0 ${scaleConfig.diamondBtn} rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 ${
                currentDirection === 'DOWN'
                  ? 'bg-emerald-500 text-white border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                  : 'bg-zinc-800 text-zinc-100 border-zinc-600 hover:bg-zinc-700 shadow-[0_4px_0_#18181b]'
              }`}
            >
              <ChevronDown className={`${scaleConfig.icon} stroke-[3]`} />
            </button>

            {/* LEFT */}
            <button
              id="btn-ctrl-diamond-left"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'LEFT')}
              className={`absolute left-0 ${scaleConfig.diamondBtn} rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${
                currentDirection === 'LEFT'
                  ? 'bg-emerald-500 text-white border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                  : 'bg-zinc-800 text-zinc-100 border-zinc-600 hover:bg-zinc-700 shadow-[0_4px_0_#18181b]'
              }`}
            >
              <ChevronLeft className={`${scaleConfig.icon} stroke-[3]`} />
            </button>

            {/* RIGHT */}
            <button
              id="btn-ctrl-diamond-right"
              type="button"
              onPointerDown={(e) => handlePointerDown(e, 'RIGHT')}
              className={`absolute right-0 ${scaleConfig.diamondBtn} rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${
                currentDirection === 'RIGHT'
                  ? 'bg-emerald-500 text-white border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                  : 'bg-zinc-800 text-zinc-100 border-zinc-600 hover:bg-zinc-700 shadow-[0_4px_0_#18181b]'
              }`}
            >
              <ChevronRight className={`${scaleConfig.icon} stroke-[3]`} />
            </button>

            {/* CENTER PAUSE */}
            <button
              id="btn-ctrl-diamond-pause"
              type="button"
              onPointerDown={handlePause}
              className={`${scaleConfig.center} rounded-full bg-zinc-900 border-2 border-zinc-700 text-zinc-300 flex items-center justify-center active:scale-90 transition-all z-10 shadow-inner`}
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
