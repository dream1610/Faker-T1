import React from 'react';
import { SnakeSpeedLevel } from '../types';
import { SNAKE_SPEED_OPTIONS, SPEED_LEVELS } from '../constants/speeds';
import { soundManager } from '../services/sound';
import { Zap, X, Check, Gauge, Sparkles } from 'lucide-react';

interface SpeedSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpeed: SnakeSpeedLevel;
  onSelectSpeed: (speed: SnakeSpeedLevel) => void;
  isDynamicSpeed?: boolean;
  onToggleDynamicSpeed?: () => void;
  title?: string;
}

export const SpeedSettingModal: React.FC<SpeedSettingModalProps> = ({
  isOpen,
  onClose,
  currentSpeed,
  onSelectSpeed,
  isDynamicSpeed = true,
  onToggleDynamicSpeed,
  title = 'CHỈNH TỐC ĐỘ CỦA RẮN',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono select-none">
      <div className="w-full max-w-md bg-zinc-900 border-4 border-zinc-700 rounded-none shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b-2 border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-none">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">{title}</h2>
              <p className="text-[10px] text-zinc-400">Chọn tốc độ bò phù hợp với phản xạ của bạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1 rounded-none bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Speed List */}
        <div className="p-3 sm:p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {SPEED_LEVELS.map((lvl) => {
            const opt = SNAKE_SPEED_OPTIONS[lvl];
            const isSelected = currentSpeed === lvl;

            return (
              <button
                key={lvl}
                type="button"
                id={`btn-speed-option-${lvl}`}
                onClick={() => {
                  soundManager.playClick();
                  onSelectSpeed(lvl);
                }}
                className={`w-full text-left p-3 border-2 transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Speed Bars Gauge */}
                  <div
                    className={`flex items-end gap-0.5 h-7 pt-1 px-1.5 border ${
                      isSelected ? 'border-amber-500/50 bg-amber-950/40' : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1 rounded-none transition-all ${
                          bar <= lvl
                            ? isSelected
                              ? 'bg-amber-400 h-' + (bar * 1.2)
                              : 'bg-zinc-400 h-' + (bar * 1.2)
                            : 'bg-zinc-700 h-1'
                        }`}
                        style={{ height: `${bar <= lvl ? bar * 5 : 3}px` }}
                      />
                    ))}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {opt.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 border font-bold ${
                          isSelected ? 'border-amber-500 text-amber-300 bg-amber-950/80' : 'border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {opt.multiplier}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {isSelected ? (
                    <div className="w-5 h-5 bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 border border-zinc-700 bg-zinc-900" />
                  )}
                </div>
              </button>
            );
          })}

          {/* Dynamic acceleration option */}
          {onToggleDynamicSpeed && (
            <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <span className="text-xs text-zinc-200 font-bold block">Tăng tốc khi ăn điểm:</span>
                  <span className="text-[10px] text-zinc-400 block">
                    {isDynamicSpeed ? 'Rắn sẽ chạy nhanh dần khi điểm cao' : 'Tốc độ luôn cố định không đổi'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="btn-toggle-dynamic-speed"
                onClick={() => {
                  soundManager.playClick();
                  onToggleDynamicSpeed();
                }}
                className={`px-3 py-1 text-xs font-bold border transition-colors ${
                  isDynamicSpeed
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {isDynamicSpeed ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t-2 border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">
            Có thể đổi tốc độ bất cứ lúc nào trong trận
          </span>
          <button
            type="button"
            id="btn-close-speed-modal"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs border border-amber-400 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
