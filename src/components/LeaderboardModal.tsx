import React, { useState } from 'react';
import { UserAccount, GlobalLeaderboardEntry } from '../types';
import { StorageService, getRankTierName } from '../services/storage';
import { ALL_MAPS } from '../constants/maps';
import { soundManager } from '../services/sound';
import { X, Trophy, Medal, Award, Star, User } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [tab, setTab] = useState<'global' | 'personal' | 'rank'>('global');
  const globalEntries = StorageService.getGlobalLeaderboard(currentUser);
  const currentRankTier = getRankTierName(currentUser.rankPoints);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-4 border-zinc-700 rounded-none shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-lg font-bold font-mono text-zinc-100">
                BẢNG XẾP HẠNG & DANH HIỆU
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Xếp hạng toàn cầu và thành tích cá nhân 28 bản đồ
              </p>
            </div>
          </div>
          <button
            id="btn-close-leaderboard"
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-3 bg-zinc-950 border-b-2 border-zinc-800 text-xs font-mono">
          <button
            id="tab-global-ranking"
            type="button"
            onClick={() => {
              setTab('global');
              soundManager.playClick();
            }}
            className={`px-3 py-2 rounded-none font-bold transition-all flex items-center gap-1.5 border ${
              tab === 'global'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>
          <button
            id="tab-personal-records"
            type="button"
            onClick={() => {
              setTab('personal');
              soundManager.playClick();
            }}
            className={`px-3 py-2 rounded-none font-bold transition-all flex items-center gap-1.5 border ${
              tab === 'personal'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Kỷ Lục 28 Bản Đồ ({Object.keys(currentUser.highScores).length})
          </button>
          <button
            id="tab-rank-tier"
            type="button"
            onClick={() => {
              setTab('rank');
              soundManager.playClick();
            }}
            className={`px-3 py-2 rounded-none font-bold transition-all flex items-center gap-1.5 border ${
              tab === 'rank'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            Hệ Thống Xếp Hạng
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: Global Leaderboard */}
          {tab === 'global' && (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500 font-mono flex items-center justify-between px-3 py-1">
                <span>HẠNG / TÊN NGƯỜI CHƠI</span>
                <span>BẢN ĐỒ / ĐIỂM SỐ</span>
              </div>
              {globalEntries.map((entry) => (
                <div
                  key={entry.rank + entry.username}
                  className={`flex items-center justify-between p-3 rounded-none border-2 font-mono text-xs transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-none flex items-center justify-center font-bold text-xs ${
                        entry.rank === 1
                          ? 'bg-amber-500 text-black'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-black'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{entry.username}</span>
                        {entry.isCurrentUser && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-none font-normal">
                            BẠN
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500">Rank: {entry.rankTitle}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-sm">{entry.score} ĐIỂM</div>
                    <div className="text-[10px] text-zinc-500">{entry.mapTitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Personal map-by-map records */}
          {tab === 'personal' && (
            <div className="space-y-3">
              <div className="p-3 rounded-none bg-zinc-950 border-2 border-zinc-800 flex items-center justify-between font-mono text-xs">
                <span>Tổng bản đồ đã hoàn thành điểm:</span>
                <span className="text-emerald-400 font-bold">
                  {Object.keys(currentUser.highScores).length} / 28 Bản Đồ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_MAPS.map((mapItem) => {
                  const score = currentUser.highScores[mapItem.id] || 0;
                  return (
                    <div
                      key={mapItem.id}
                      className="p-3 rounded-none bg-zinc-950 border-2 border-zinc-800 flex items-center justify-between font-mono text-xs"
                    >
                      <div>
                        <div className="font-bold text-zinc-300">{mapItem.name}</div>
                        <div className="text-[10px] text-zinc-500">{mapItem.layoutName}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold text-sm ${
                            score > 0 ? 'text-amber-400' : 'text-zinc-600'
                          }`}
                        >
                          {score > 0 ? `${score} Điểm` : 'Chưa Chơi'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Rank Tier System */}
          {tab === 'rank' && (
            <div className="space-y-4 font-mono">
              {/* Current Rank Status Card */}
              <div className="p-4 rounded-none bg-zinc-950 border-2 border-zinc-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Hạng Hiện Tại Của Bạn:</span>
                  <div className="text-xl font-bold flex items-center gap-2 mt-1">
                    <span>{currentRankTier.badge}</span>
                    <span className={currentRankTier.color}>{currentRankTier.title}</span>
                  </div>
                  <span className="text-xs text-zinc-400 mt-1 block">
                    Điểm Xếp Hạng: <b className="text-amber-400">{currentUser.rankPoints} ĐXP</b>
                  </span>
                </div>
                <Award className="w-12 h-12 text-amber-500/80" />
              </div>

              {/* Tiers list */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-bold block">
                  CÁC BẬC XẾP HẠNG TRONG GAME:
                </span>
                {[
                  { name: 'Thách Đấu', points: '2500+ ĐXP', badge: '👑', color: 'text-amber-400', desc: 'Đỉnh cao của mọi tay săn mồi.' },
                  { name: 'Kim Cương', points: '2000 - 2499 ĐXP', badge: '💎', color: 'text-cyan-400', desc: 'Kỹ năng né cạm bẫy thượng thừa.' },
                  { name: 'Bạch Kim', points: '1500 - 1999 ĐXP', badge: '💠', color: 'text-emerald-400', desc: 'Chiến binh giàu kinh nghiệm.' },
                  { name: 'Vàng', points: '1000 - 1499 ĐXP', badge: '🥇', color: 'text-yellow-400', desc: 'Thợ săn mồi cừ khôi.' },
                  { name: 'Bạc', points: '500 - 999 ĐXP', badge: '🥈', color: 'text-slate-300', desc: 'Bước đệm vững chắc.' },
                  { name: 'Đồng', points: '0 - 499 ĐXP', badge: '🥉', color: 'text-amber-700', desc: 'Hạng khởi đầu cho tân thủ.' },
                ].map((tier) => (
                  <div
                    key={tier.name}
                    className="p-3 rounded-none bg-zinc-950 border-2 border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{tier.badge}</span>
                      <div>
                        <div className={`font-bold ${tier.color}`}>{tier.name}</div>
                        <div className="text-[11px] text-zinc-500">{tier.desc}</div>
                      </div>
                    </div>
                    <span className="text-zinc-400 font-bold">{tier.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
