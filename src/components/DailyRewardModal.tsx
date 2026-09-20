import React, { useState } from 'react';
import { UserAccount } from '../types';
import { StorageService } from '../services/storage';
import { soundManager } from '../services/sound';
import { X, Gift, Check, Sparkles, Calendar } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onRewardClaimed: (user: UserAccount) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRewardClaimed,
}) => {
  const { canClaim, currentDay, rewardCoins } = StorageService.checkDailyReward(currentUser);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const REWARDS = [
    { day: 1, coins: 50, special: 'Khởi đầu ngày mới' },
    { day: 2, coins: 100, special: 'Thợ săn kiên trì' },
    { day: 3, coins: 150, special: 'Gia tăng phần thưởng' },
    { day: 4, coins: 200, special: 'Chuỗi chiến tích' },
    { day: 5, coins: 300, special: 'Hộp quà vàng' },
    { day: 6, coins: 450, special: 'Đỉnh cao phong độ' },
    { day: 7, coins: 1000, special: '★ HỘP QUÀ TỐI THƯỢNG 1000 XU' },
  ];

  const handleClaim = () => {
    const res = StorageService.claimDailyReward();
    if (res.success && res.user) {
      soundManager.playVictory();
      setClaimedNotice(`Chúc mừng! Bạn đã nhận thành công ${res.coinsClaimed} xu thưởng ngày ${res.streak % 7 || 7}!`);
      onRewardClaimed(res.user);
    } else {
      soundManager.playClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm font-mono">
      <div className="w-full max-w-lg bg-zinc-900 border-4 border-zinc-700 rounded-none shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                ĐIỂM DANH NHẬN QUÀ HÀNG NGÀY
              </h2>
              <p className="text-xs text-zinc-400">
                Chuỗi đăng nhập liên tiếp: <span className="text-amber-400 font-bold">{currentUser.dailyStreak} Ngày</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-daily-reward"
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-none bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {claimedNotice && (
            <div className="p-3 rounded-none bg-emerald-950/70 border-2 border-emerald-600 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {claimedNotice}
            </div>
          )}

          {/* 7-Day Matrix */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {REWARDS.map((r) => {
              const isPast = r.day < currentDay || (!canClaim && r.day <= currentDay);
              const isToday = r.day === currentDay && canClaim;

              return (
                <div
                  key={r.day}
                  className={`p-2 rounded-none border-2 text-center flex flex-col justify-between items-center transition-all ${
                    isToday
                      ? 'bg-amber-500/20 border-amber-500 shadow-md ring-2 ring-amber-500/50'
                      : isPast
                      ? 'bg-zinc-950 border-zinc-800 opacity-60'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 font-bold">Ngày {r.day}</span>
                  <div className="my-1.5">
                    {r.day === 7 ? (
                      <span className="text-xl animate-bounce inline-block">👑</span>
                    ) : (
                      <span className="text-lg">🪙</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-amber-400">+{r.coins}</span>
                  {isPast ? (
                    <span className="text-[9px] text-emerald-400 flex items-center justify-center mt-1">
                      <Check className="w-3 h-3" /> Đã nhận
                    </span>
                  ) : isToday ? (
                    <span className="text-[9px] text-amber-300 font-bold mt-1">Hôm nay</span>
                  ) : (
                    <span className="text-[9px] text-zinc-500 mt-1">Chờ</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-950 rounded-none border-2 border-zinc-800 text-xs text-zinc-400 space-y-1">
            <p>• Đăng nhập mỗi ngày để nhận xu miễn phí nâng cấp mở khóa 20 skin rắn cổ điển.</p>
            <p>• Điểm danh ngày 7 để nhận ngay 1000 xu thưởng cực lớn!</p>
          </div>

          {/* Claim Action Button */}
          <button
            id="btn-claim-daily-reward"
            type="button"
            disabled={!canClaim}
            onClick={handleClaim}
            className={`w-full py-3 rounded-none font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 border ${
              canClaim
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 active:scale-98'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700'
            }`}
          >
            <Gift className="w-4 h-4" />
            {canClaim ? `Nhận Thưởng Ngay (+${rewardCoins} Xu)` : 'Hôm Nay Bạn Đã Nhận Quà Rồi'}
          </button>
        </div>
      </div>
    </div>
  );
};
