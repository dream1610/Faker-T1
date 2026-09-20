import { UserAccount, GlobalLeaderboardEntry, ChatMessage } from '../types';

export type DpadPositionPreference = 'auto' | 'right' | 'left';

// Storage keys
const ACCOUNTS_KEY = 'retro_snake_accounts';
const ACTIVE_USER_ID_KEY = 'retro_snake_active_user_id';
const GLOBAL_CHAT_KEY = 'retro_snake_global_chat';
const GLOBAL_LEADERBOARD_KEY = 'retro_snake_leaderboard';
const DPAD_POSITION_KEY = 'retro_snake_dpad_position';

export function getRankTierName(points: number): { title: string; color: string; badge: string } {
  if (points >= 2500) return { title: 'Thách Đấu', color: 'text-amber-400', badge: '👑' };
  if (points >= 2000) return { title: 'Kim Cương', color: 'text-cyan-400', badge: '💎' };
  if (points >= 1500) return { title: 'Bạch Kim', color: 'text-emerald-400', badge: '💠' };
  if (points >= 1000) return { title: 'Vàng', color: 'text-yellow-400', badge: '🥇' };
  if (points >= 500) return { title: 'Bạc', color: 'text-slate-300', badge: '🥈' };
  return { title: 'Đồng', color: 'text-amber-700', badge: '🥉' };
}

export const StorageService = {
  getAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem(ACCOUNTS_KEY);
      if (!data) {
        return [];
      }
      const parsed: UserAccount[] = JSON.parse(data);
      // Remove any leftover mock seed accounts from previous runs if any
      const cleaned = parsed.filter(a => a.id !== 'user_viet_gamer' && a.id !== 'user_gdreed');
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  saveAccounts(accounts: UserAccount[]) {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {}
  },

  getActiveUserId(): string | null {
    return localStorage.getItem(ACTIVE_USER_ID_KEY);
  },

  setActiveUserId(id: string | null) {
    if (id) {
      localStorage.setItem(ACTIVE_USER_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_USER_ID_KEY);
    }
  },

  getActiveUser(): UserAccount | null {
    const activeId = this.getActiveUserId();
    if (!activeId) return null;
    const accounts = this.getAccounts();
    return accounts.find((a) => a.id === activeId) || null;
  },

  register(username: string): { success: boolean; error?: string; user?: UserAccount } {
    const trimmed = username.trim();
    if (!trimmed) {
      return { success: false, error: 'Vui lòng nhập tên người chơi.' };
    }
    if (trimmed.length < 3 || trimmed.length > 16) {
      return { success: false, error: 'Tên người chơi phải từ 3 đến 16 ký tự.' };
    }

    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.username.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return { success: false, error: 'Tên tài khoản này đã được sử dụng.' };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newUser: UserAccount = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      username: trimmed,
      avatarIcon: '🐍',
      coins: 200, // starting bonus coins
      highScores: {},
      currentSkinId: 'classic_nokia',
      ownedSkinIds: ['classic_nokia'],
      currentThemeId: 'nokia_green',
      rankPoints: 100,
      dailyStreak: 1,
      lastDailyClaim: '',
      friends: [],
      customHat: 'none',
      createdAt: todayStr,
    };

    accounts.push(newUser);
    this.saveAccounts(accounts);
    this.setActiveUserId(newUser.id);
    return { success: true, user: newUser };
  },

  login(username: string): { success: boolean; error?: string; user?: UserAccount } {
    const trimmed = username.trim();
    if (!trimmed) {
      return { success: false, error: 'Vui lòng nhập tên tài khoản.' };
    }

    const accounts = this.getAccounts();
    const found = accounts.find((a) => a.username.toLowerCase() === trimmed.toLowerCase());
    if (!found) {
      return { success: false, error: 'Không tìm thấy tài khoản. Vui lòng bấm Đăng Ký nếu bạn chưa có.' };
    }

    this.setActiveUserId(found.id);
    return { success: true, user: found };
  },

  logout() {
    this.setActiveUserId(null);
  },

  updateActiveUser(updater: (user: UserAccount) => UserAccount): UserAccount | null {
    const active = this.getActiveUser();
    if (!active) return null;
    const updated = updater({ ...active });
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === active.id);
    if (index >= 0) {
      accounts[index] = updated;
      this.saveAccounts(accounts);
    }
    return updated;
  },

  saveGameScore(mapId: string, score: number, coinsEarned: number, isWinMatch: boolean = false): {
    newRecord: boolean;
    highScore: number;
    updatedUser: UserAccount | null;
  } {
    let newRecord = false;
    let finalHighScore = score;

    const updatedUser = this.updateActiveUser((user) => {
      const currentBest = user.highScores[mapId] || 0;
      if (score > currentBest) {
        newRecord = true;
        user.highScores[mapId] = score;
        finalHighScore = score;
      } else {
        finalHighScore = currentBest;
      }

      user.coins += coinsEarned;
      if (newRecord) {
        user.coins += 20; // record bonus
      }

      // Rank points
      const pointsGain = isWinMatch ? 35 : Math.floor(score * 1.5);
      user.rankPoints += pointsGain;

      return user;
    });

    return {
      newRecord,
      highScore: finalHighScore,
      updatedUser,
    };
  },

  checkDailyReward(user: UserAccount): { canClaim: boolean; currentDay: number; rewardCoins: number } {
    const today = new Date().toISOString().slice(0, 10);
    const rewards = [50, 100, 150, 200, 300, 450, 1000];
    const canClaim = user.lastDailyClaim !== today;
    const currentDay = Math.min(7, Math.max(1, (user.dailyStreak % 7) + (canClaim ? 1 : 0)));
    const rewardCoins = rewards[currentDay - 1];

    return { canClaim, currentDay, rewardCoins };
  },

  claimDailyReward(): { success: boolean; coinsClaimed: number; streak: number; user: UserAccount | null } {
    const user = this.getActiveUser();
    if (!user) return { success: false, coinsClaimed: 0, streak: 0, user: null };

    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDailyClaim === today) {
      return { success: false, coinsClaimed: 0, streak: user.dailyStreak, user };
    }

    const rewards = [50, 100, 150, 200, 300, 450, 1000];
    const newStreak = user.dailyStreak + 1;
    const dayIndex = ((newStreak - 1) % 7);
    const coinsClaimed = rewards[dayIndex];

    const updatedUser = this.updateActiveUser((u) => {
      u.coins += coinsClaimed;
      u.dailyStreak = newStreak;
      u.lastDailyClaim = today;
      return u;
    });

    return { success: true, coinsClaimed, streak: newStreak, user: updatedUser };
  },

  getGlobalLeaderboard(currentUser?: UserAccount | null): GlobalLeaderboardEntry[] {
    const raw = localStorage.getItem(GLOBAL_LEADERBOARD_KEY);
    let entries: GlobalLeaderboardEntry[] = [];
    if (raw) {
      try {
        entries = JSON.parse(raw);
      } catch {}
    }

    if (entries.length === 0) {
      entries = [
        { rank: 1, username: 'Gdreed', score: 112, mapTitle: '20x20 - Ma Trận', skinId: 'mythic_fire_dragon', rankTitle: 'Thách Đấu' },
        { rank: 2, username: 'CaoThuNokia3310', score: 89, mapTitle: '20x20 - Tự Do', skinId: 'classic_nokia', rankTitle: 'Bạch Kim' },
        { rank: 3, username: 'SnakeMaster_99', score: 84, mapTitle: '15x15 - Chữ Thập', skinId: 'cyber_ruby', rankTitle: 'Vàng' },
        { rank: 4, username: 'PixelGamer_VN', score: 76, mapTitle: '15x15 - Tự Do', skinId: 'emerald_pixel', rankTitle: 'Vàng' },
        { rank: 5, username: 'RetroViper', score: 68, mapTitle: '12x12 - Rào Bao Quanh', skinId: 'glacier_ice', rankTitle: 'Bạc' },
        { rank: 6, username: 'NokiaClassic_Pro', score: 62, mapTitle: '10x10 - Tự Do', skinId: 'desert_cobra', rankTitle: 'Bạc' },
        { rank: 7, username: 'ChienThanRan', score: 55, mapTitle: '12x12 - Song Long', skinId: 'amethyst_gem', rankTitle: 'Bạc' },
        { rank: 8, username: 'VuaSanMoi', score: 48, mapTitle: '10x10 - Pháo Đài', skinId: 'steampunk_brass', rankTitle: 'Đồng' },
      ];
    }

    if (currentUser) {
      // Find highest score of current user across all maps
      let maxScore = 0;
      let bestMap = '10x10 - Tự Do';
      Object.entries(currentUser.highScores).forEach(([mId, sc]) => {
        if (sc > maxScore) {
          maxScore = sc;
          bestMap = mId.replace('_', 'x - Màn ');
        }
      });

      if (maxScore > 0) {
        // Insert or update user
        const existingIdx = entries.findIndex((e) => e.username === currentUser.username);
        const userEntry: GlobalLeaderboardEntry = {
          rank: 1,
          username: currentUser.username,
          score: maxScore,
          mapTitle: bestMap,
          skinId: currentUser.currentSkinId,
          rankTitle: getRankTierName(currentUser.rankPoints).title,
          isCurrentUser: true,
        };

        if (existingIdx >= 0) {
          entries[existingIdx] = userEntry;
        } else {
          entries.push(userEntry);
        }

        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, idx) => {
          e.rank = idx + 1;
        });

        localStorage.setItem(GLOBAL_LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 50)));
      }
    }

    return entries;
  },

  getGlobalChat(): ChatMessage[] {
    try {
      const data = localStorage.getItem(GLOBAL_CHAT_KEY);
      if (!data) {
        const seedChat: ChatMessage[] = [
          { id: 'c1', senderName: 'Hệ Thống', text: 'Chào mừng bạn đến với Rắn Săn Mồi Cổ Điển! Hãy đăng ký tài khoản để bắt đầu.', timestamp: Date.now() - 3600000, type: 'system' },
          { id: 'c2', senderName: 'Gdreed', text: 'Chúc anh em săn mồi đạt kỷ lục cao và mở khóa được skin Hỏa Long tối thượng nhé! 🔥', timestamp: Date.now() - 1800000, type: 'global', emote: '🔥' },
          { id: 'c3', senderName: 'CaoThuNokia3310', text: 'Ai solo 1v1 phòng riêng bản đồ 15x15 không? Tạo phòng vào quất ngay!', timestamp: Date.now() - 600000, type: 'global', emote: '⚔️' },
        ];
        localStorage.setItem(GLOBAL_CHAT_KEY, JSON.stringify(seedChat));
        return seedChat;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  sendGlobalChatMessage(senderName: string, text: string, emote?: string): ChatMessage[] {
    const messages = this.getGlobalChat();
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderName,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'global',
      emote,
    };
    messages.push(newMsg);
    // keep last 60 messages
    const trimmed = messages.slice(-60);
    try {
      localStorage.setItem(GLOBAL_CHAT_KEY, JSON.stringify(trimmed));
    } catch {}
    return trimmed;
  },

  addFriend(username: string): { success: boolean; message: string; user: UserAccount | null } {
    const user = this.getActiveUser();
    if (!user) return { success: false, message: 'Chưa đăng nhập.', user: null };

    const target = username.trim();
    if (!target) return { success: false, message: 'Vui lòng nhập tên bạn bè.', user };
    if (target.toLowerCase() === user.username.toLowerCase()) {
      return { success: false, message: 'Không thể tự kết bạn với chính mình.', user };
    }
    if (user.friends.includes(target)) {
      return { success: false, message: 'Người chơi này đã có trong danh sách bạn bè.', user };
    }

    const updated = this.updateActiveUser((u) => {
      u.friends.push(target);
      return u;
    });

    return { success: true, message: `Đã kết bạn thành công với ${target}!`, user: updated };
  },

  getDpadPosition(): DpadPositionPreference {
    try {
      const val = localStorage.getItem(DPAD_POSITION_KEY);
      if (val === 'left' || val === 'right' || val === 'auto') return val;
      return 'auto';
    } catch {
      return 'auto';
    }
  },

  setDpadPosition(pos: DpadPositionPreference) {
    try {
      localStorage.setItem(DPAD_POSITION_KEY, pos);
    } catch {}
  }
};
