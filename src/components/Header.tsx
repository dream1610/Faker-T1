import React from 'react';
import { UserAccount, GameTheme } from '../types';
import { GAME_THEMES } from '../constants/themes';
import { getRankTierName, StorageService } from '../services/storage';
import { soundManager } from '../services/sound';
import { 
  Palette, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Gift, 
  ShoppingBag, 
  Trophy, 
  MapPin, 
  LogOut, 
  Swords, 
  Users 
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount;
  currentTheme: GameTheme;
  onThemeChange: (theme: GameTheme) => void;
  onOpenShop: () => void;
  onOpenMaps: () => void;
  onOpenLeaderboard: () => void;
  onOpenDailyReward: () => void;
  onOpenDuelRoom: () => void;
  onSwitchAccount: () => void;
  onReturnToMenu?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  gameMode: 'single' | 'duel';
  onSetGameMode: (mode: 'single' | 'duel') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentTheme,
  onThemeChange,
  onOpenShop,
  onOpenMaps,
  onOpenLeaderboard,
  onOpenDailyReward,
  onOpenDuelRoom,
  onSwitchAccount,
  onReturnToMenu,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  gameMode,
  onSetGameMode,
}) => {
  const rankTier = getRankTierName(currentUser.rankPoints);
  const { canClaim } = StorageService.checkDailyReward(currentUser);

  return (
    <header className="w-full bg-zinc-900 border-b-2 border-zinc-800 text-zinc-100 font-mono shadow-md select-none sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Logo & Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              if (onReturnToMenu) {
                soundManager.playClick();
                onReturnToMenu();
              }
            }}
            className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
            title="Về Menu Chính"
          >
            <span className="text-2xl animate-pulse">🐍</span>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-emerald-400">
                RẮN SĂN MỒI
              </h1>
              <div className="text-[10px] text-zinc-400 -mt-1 hidden sm:block">NOKIA RETRO 3310</div>
            </div>
          </button>

          {/* Return to Menu Button */}
          {onReturnToMenu && (
            <button
              id="btn-nav-return-menu"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onReturnToMenu();
              }}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-none text-xs font-bold transition-colors"
            >
              MENU
            </button>
          )}

          {/* Mode Tabs */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-none border border-zinc-800 text-xs">
            <button
              id="mode-btn-single"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSetGameMode('single');
              }}
              className={`px-2.5 py-1 rounded-none transition-colors font-bold ${
                gameMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Đơn
            </button>
            <button
              id="mode-btn-duel"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSetGameMode('duel');
                onOpenDuelRoom();
              }}
              className={`px-2.5 py-1 rounded-none transition-colors font-bold flex items-center gap-1 ${
                gameMode === 'duel'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Swords className="w-3 h-3" />
              RIVAL 1v1
            </button>
          </div>
        </div>

        {/* Center / Action Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs">
          {/* Daily Reward Button with notification pip */}
          <button
            id="btn-nav-daily-reward"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenDailyReward();
            }}
            className="relative px-2.5 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
            title="Điểm danh nhận quà hàng ngày"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Điểm Danh</span>
            {canClaim && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-none animate-ping" />
            )}
            {canClaim && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-none" />
            )}
          </button>

          {/* Map Selector */}
          <button
            id="btn-nav-maps"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenMaps();
            }}
            className="px-2.5 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
            title="Chọn trong 28 bản đồ"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">28 Bản Đồ</span>
          </button>

          {/* Skin Shop */}
          <button
            id="btn-nav-shop"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenShop();
            }}
            className="px-2.5 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
            title="Cửa hàng 20 skin và phụ kiện"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Skin Rắn</span>
          </button>

          {/* Leaderboard */}
          <button
            id="btn-nav-leaderboard"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenLeaderboard();
            }}
            className="px-2.5 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors border border-zinc-700"
            title="Bảng xếp hạng toàn cầu"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden md:inline">BXH</span>
          </button>
        </div>

        {/* Right: Theme, Sound, Fullscreen & User Profile */}
        <div className="flex items-center gap-2 text-xs">
          {/* Theme Dropdown */}
          <div className="relative flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-none border border-zinc-800">
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            <select
              id="theme-select-dropdown"
              value={currentTheme.id}
              onChange={(e) => {
                soundManager.playClick();
                const found = GAME_THEMES.find((t) => t.id === e.target.value);
                if (found) onThemeChange(found);
              }}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              {GAME_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id} className="bg-zinc-900 text-zinc-100">
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            title={isMuted ? 'Bật âm thanh retro' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-zinc-200 text-xs flex items-center justify-end gap-1">
                <span>{currentUser.username}</span>
                <span title={`Hạng: ${rankTier.title}`}>{rankTier.badge}</span>
              </div>
              <div className="text-[11px] text-amber-400 font-bold">
                🪙 {currentUser.coins} Xu
              </div>
            </div>

            {/* Logout / Switch Account */}
            <button
              id="btn-switch-account"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSwitchAccount();
              }}
              className="p-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 border border-zinc-700 transition-colors"
              title="Đổi tài khoản hoặc đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
