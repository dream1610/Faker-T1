import React from 'react';
import { UserAccount, MapObstacleConfig, GameTheme, SnakeSpeedLevel } from '../types';
import { getRankTierName, StorageService } from '../services/storage';
import { soundManager } from '../services/sound';
import { SNAKE_SPEED_OPTIONS, SPEED_LEVELS, getSpeedOption } from '../constants/speeds';
import { SpeedSettingModal } from './SpeedSettingModal';
import { FullscreenGuideModal } from './FullscreenGuideModal';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Play,
  Swords,
  ShoppingBag,
  Trophy,
  Gift,
  Palette,
  Volume2,
  VolumeX,
  LogOut,
  MapPin,
  Flame,
  Shield,
  Layers,
  Zap,
  Smartphone,
} from 'lucide-react';

interface MainMenuProps {
  currentUser: UserAccount;
  currentMap: MapObstacleConfig;
  currentTheme: GameTheme;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartSingleGame: () => void;
  onOpenMapSelect: () => void;
  onOpenDuelModal: () => void;
  onOpenSkinShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenDailyReward: () => void;
  onOpenThemeSelect: () => void;
  onLogout: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  currentUser,
  currentMap,
  currentTheme,
  isMuted,
  onToggleMute,
  onStartSingleGame,
  onOpenMapSelect,
  onOpenDuelModal,
  onOpenSkinShop,
  onOpenLeaderboard,
  onOpenDailyReward,
  onOpenThemeSelect,
  onLogout,
}) => {
  const rank = getRankTierName(currentUser.rankPoints);
  const personalBest = currentUser.highScores[currentMap.id] || 0;
  const dailyStatus = StorageService.checkDailyReward(currentUser);
  const [dpadPref, setDpadPref] = React.useState(StorageService.getDpadPosition());
  const [snakeSpeed, setSnakeSpeed] = React.useState<SnakeSpeedLevel>(() => StorageService.getSnakeSpeed());
  const [showSpeedModal, setShowSpeedModal] = React.useState<boolean>(false);
  const { isStandalone, isIOS, canPromptNativeInstall, promptInstall } = usePWAInstall();
  const [showFullscreenGuide, setShowFullscreenGuide] = React.useState<boolean>(false);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none py-2 px-3">
      {/* 1. Main Retro Nokia Bezel Container */}
      <div className="w-full bg-zinc-900 border-4 border-zinc-700 rounded-none p-4 md:p-6 shadow-2xl relative overflow-hidden">
        {/* Top Decorative Nokia 3310 Branding */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐍</span>
            <div>
              <h1 className="text-base md:text-lg font-bold font-mono text-emerald-400 tracking-wider">
                SNAKE
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono">
                MENU CHÍNH • CHỌN CHẾ ĐỘ & MÀN CHƠI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick sound toggle */}
            <button
              id="btn-menu-toggle-sound"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onToggleMute();
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 rounded-none transition-colors"
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Logout button */}
            <button
              id="btn-menu-logout"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onLogout();
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-400 hover:text-red-400 rounded-none transition-colors flex items-center gap-1 text-xs font-mono"
              title="Đổi tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Player Status Bar */}
        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-none p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-900 border-2 border-zinc-700 rounded-none flex items-center justify-center text-2xl shadow-inner">
              {currentUser.avatarIcon || '🐍'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm md:text-base text-zinc-100 font-mono">
                  {currentUser.username}
                </span>
                <span className={`text-xs px-2 py-0.5 border-2 border-zinc-700 rounded-none font-mono font-bold bg-zinc-900 ${rank.color}`}>
                  {rank.badge} {rank.title}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  🪙 {currentUser.coins} xu
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-3.5 h-3.5" /> Chuỗi {currentUser.dailyStreak} ngày
                </span>
              </div>
            </div>
          </div>

          {/* Daily reward quick claim button */}
          <button
            id="btn-menu-daily-reward"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenDailyReward();
            }}
            className={`px-3 py-1.5 border-2 text-xs font-mono font-bold rounded-none flex items-center gap-1.5 transition-all ${
              dailyStatus.canClaim
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-md animate-pulse'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            {dailyStatus.canClaim ? 'Nhận Quà Hôm Nay!' : 'Điểm Danh 7 Ngày'}
          </button>
        </div>

        {/* 3. Highlighted Current Map Card */}
        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-none p-4 mb-5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2 border-b border-zinc-900 pb-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <MapPin className="w-3.5 h-3.5" /> MÀN CHƠI ĐANG CHỌN
            </span>
            <span className="text-zinc-500">
              Lưới: {currentMap.gridSize}x{currentMap.gridSize} Khối
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold font-mono text-zinc-100 flex items-center gap-2">
                <span>{currentMap.name}</span>
                {currentMap.hasBorder ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 border border-red-800 bg-red-950/80 text-red-300 rounded-none flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Viền Tường
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 border border-blue-800 bg-blue-950/80 text-blue-300 rounded-none">
                    Xuyên Tường
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 line-clamp-1">
                {currentMap.description}
              </p>
              <div className="text-xs font-mono text-amber-400 mt-1">
                🏆 Kỷ lục cá nhân: <span className="font-bold">{personalBest}</span> điểm
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-menu-change-map"
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onOpenMapSelect();
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-2 border-zinc-700 rounded-none text-xs font-mono font-bold transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Đổi Màn (28)
              </button>
              <button
                id="btn-menu-play-single-direct"
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onStartSingleGame();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-500 rounded-none text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Chơi
              </button>
            </div>
          </div>
        </div>

        {/* 4. Main Menu Navigation Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Option 1: Chơi Đơn (Chọn Màn) */}
          <button
            id="btn-menu-start-single"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenMapSelect();
            }}
            className="p-4 bg-zinc-800/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-500 rounded-none text-left transition-all group flex items-start gap-3"
          >
            <div className="p-2.5 bg-zinc-900 border-2 border-zinc-700 group-hover:border-emerald-500 rounded-none text-emerald-400">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100 font-mono group-hover:text-emerald-400">
                1. CHƠI ĐƠN (28 MÀN)
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">
                Chọn màn chơi và kích thước ô lưới để bắt đầu săn mồi.
              </div>
            </div>
          </button>

          {/* Option 2: Đấu Đôi 1v1 */}
          <button
            id="btn-menu-start-duel"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenDuelModal();
            }}
            className="p-4 bg-zinc-800/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-cyan-500 rounded-none text-left transition-all group flex items-start gap-3"
          >
            <div className="p-2.5 bg-zinc-900 border-2 border-zinc-700 group-hover:border-cyan-500 rounded-none text-cyan-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100 font-mono group-hover:text-cyan-400">
                2. ĐẤU ĐÔI 1V1 (ONLINE & BOT)
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">
                Đấu với bạn bè qua mã phòng hoặc tập luyện với Bot AI.
              </div>
            </div>
          </button>

          {/* Option 3: Cửa Hàng Skin */}
          <button
            id="btn-menu-skin-shop"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenSkinShop();
            }}
            className="p-4 bg-zinc-800/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-amber-500 rounded-none text-left transition-all group flex items-start gap-3"
          >
            <div className="p-2.5 bg-zinc-900 border-2 border-zinc-700 group-hover:border-amber-500 rounded-none text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100 font-mono group-hover:text-amber-400">
                3. CỬA HÀNG SKIN (20 MẪU)
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">
                Mở khóa ngoại trang rắn pixel, nón retro và hiệu ứng mồi.
              </div>
            </div>
          </button>

          {/* Option 4: Bảng Xếp Hạng */}
          <button
            id="btn-menu-leaderboard"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenLeaderboard();
            }}
            className="p-4 bg-zinc-800/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-yellow-500 rounded-none text-left transition-all group flex items-start gap-3"
          >
            <div className="p-2.5 bg-zinc-900 border-2 border-zinc-700 group-hover:border-yellow-500 rounded-none text-yellow-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100 font-mono group-hover:text-yellow-400">
                4. BẢNG XẾP HẠNG
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">
                Bảng vinh danh các cao thủ Nokia 3310 toàn máy chủ.
              </div>
            </div>
          </button>
        </div>

        {/* 5. Control Settings Box (Outside Match Configuration) */}
        <div className="mt-4 p-3 bg-zinc-950 border-2 border-zinc-800 rounded-none text-xs font-mono space-y-3">
          {/* Snake Speed Setting */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-current" />
                <span>Tốc độ của rắn:</span>
                <span className="text-amber-400 font-mono">
                  {getSpeedOption(snakeSpeed).shortLabel} ({getSpeedOption(snakeSpeed).multiplier})
                </span>
              </span>
              <button
                type="button"
                id="btn-menu-open-speed-modal"
                onClick={() => {
                  soundManager.playClick();
                  setShowSpeedModal(true);
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline font-bold"
              >
                Chi tiết & mô tả
              </button>
            </div>

            {/* 5 Speed buttons */}
            <div className="grid grid-cols-5 gap-1.5">
              {SPEED_LEVELS.map((lvl) => {
                const opt = SNAKE_SPEED_OPTIONS[lvl];
                const isSel = snakeSpeed === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    id={`btn-menu-speed-${lvl}`}
                    onClick={() => {
                      soundManager.playClick();
                      StorageService.setSnakeSpeed(lvl);
                      setSnakeSpeed(lvl);
                    }}
                    className={`py-1.5 px-1 border-2 text-center transition-all ${
                      isSel
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black shadow-md'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{opt.multiplier}</div>
                    <div className="text-[9px] opacity-80 leading-none">{opt.shortLabel}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-400 pt-0.5">
              💡 {getSpeedOption(snakeSpeed).description}
            </p>
          </div>

          {/* Dpad Positioning Setting */}
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <span>🎮</span> Cài đặt vị trí nút bấm (Điện thoại):
              </span>
              <span className="text-[10px] text-zinc-500">Tối ưu diện tích màn hình</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded-none">
                <span className="text-zinc-400 text-[11px]">Khi màn hình xoay ngang:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      StorageService.setDpadPosition('right');
                      setDpadPref('right');
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-none border transition-colors ${
                      dpadPref !== 'left'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    Bên Phải
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      StorageService.setDpadPosition('left');
                      setDpadPref('left');
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-none border transition-colors ${
                      dpadPref === 'left'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    Bên Trái
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded-none text-[11px] text-zinc-400">
                <span>Khi màn hình để dọc:</span>
                <span className="font-bold text-emerald-400 bg-zinc-950 px-2 py-0.5 border border-zinc-700">
                  Ở Dưới Cùng (Tự Động)
                </span>
              </div>
            </div>
          </div>

          {/* Fullscreen & Hide Toolbar Guide Banner for Mobile Browsers */}
          {!isStandalone && (
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                id="btn-menu-fullscreen-guide"
                onClick={() => {
                  soundManager.playClick();
                  setShowFullscreenGuide(true);
                }}
                className="w-full p-2.5 bg-amber-950/40 hover:bg-amber-950/70 border-2 border-amber-500/70 text-left transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-amber-500 text-zinc-950 font-bold flex-shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200 truncate">
                      Chơi Toàn Màn Hình Không Viền (Ẩn Thanh Duyệt)
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {isIOS
                        ? 'Cách ẩn thanh tìm kiếm & chuyển trang trên iPhone'
                        : 'Cài đặt app để chơi toàn màn hình 100%'}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-400 border border-amber-500/40 px-2 py-0.5 bg-amber-950/80 flex-shrink-0">
                  Xem Cách Làm ➔
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 6. Bottom Secondary Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t-2 border-zinc-800 text-xs font-mono">
          <button
            id="btn-menu-change-theme"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onOpenThemeSelect();
            }}
            className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-zinc-600 rounded-none text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            Chủ Đề Màn Hình: {currentTheme.name}
          </button>

          <div className="text-[11px] text-zinc-500">
            D-Pad / WASD / Mũi tên • Grid Khối Vuông
          </div>
        </div>
      </div>

      {/* Snake Speed Detail Modal */}
      <SpeedSettingModal
        isOpen={showSpeedModal}
        onClose={() => setShowSpeedModal(false)}
        currentSpeed={snakeSpeed}
        onSelectSpeed={(lvl) => {
          setSnakeSpeed(lvl);
          StorageService.setSnakeSpeed(lvl);
        }}
      />

      {/* Fullscreen & Hide Toolbar Guide Modal */}
      <FullscreenGuideModal
        isOpen={showFullscreenGuide}
        onClose={() => setShowFullscreenGuide(false)}
        isIOS={isIOS}
        canPromptNativeInstall={canPromptNativeInstall}
        onNativeInstall={promptInstall}
      />
    </div>
  );
};
