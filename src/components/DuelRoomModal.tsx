import React, { useState, useEffect } from 'react';
import { UserAccount, MapObstacleConfig, GridSize } from '../types';
import { duelManager } from '../services/multiplayer';
import { soundManager } from '../services/sound';
import { StorageService } from '../services/storage';
import { X, Swords, Copy, Check, Bot, Users, Play, Send } from 'lucide-react';

interface DuelRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  currentMap: MapObstacleConfig;
  onStartDuel: (isBot: boolean, opponentName: string, opponentSkinId: string, roomCode: string) => void;
}

export const DuelRoomModal: React.FC<DuelRoomModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentMap,
  onStartDuel,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'friends'>('create');
  const [createdRoomCode, setCreatedRoomCode] = useState<string>('');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<'idle' | 'waiting' | 'ready'>('idle');
  const [guestPlayer, setGuestPlayer] = useState<{ name: string; skinId: string } | null>(null);

  useEffect(() => {
    if (isOpen && !createdRoomCode) {
      setCreatedRoomCode(duelManager.generateRoomCode());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleRoomEvent = (ev: any) => {
      if (ev.roomCode === createdRoomCode) {
        if (ev.type === 'PLAYER_JOINED') {
          soundManager.playMatchFound();
          setGuestPlayer({ name: ev.payload.username, skinId: ev.payload.skinId });
          setRoomStatus('ready');
        }
      }
    };

    duelManager.subscribe(handleRoomEvent);
    return () => duelManager.unsubscribe();
  }, [isOpen, createdRoomCode]);

  if (!isOpen) return null;

  const handleCopyRoomCode = () => {
    navigator.clipboard?.writeText(createdRoomCode);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoomBroadcast = () => {
    setRoomStatus('waiting');
    duelManager.broadcast({
      type: 'ROOM_CREATED',
      roomCode: createdRoomCode,
      senderId: currentUser.id,
      payload: {
        username: currentUser.username,
        skinId: currentUser.currentSkinId,
        mapId: currentMap.id,
        gridSize: currentMap.gridSize,
      },
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputRoomCode.trim().toUpperCase();
    if (!code) return;

    duelManager.broadcast({
      type: 'PLAYER_JOINED',
      roomCode: code,
      senderId: currentUser.id,
      payload: {
        username: currentUser.username,
        skinId: currentUser.currentSkinId,
      },
    });

    soundManager.playMatchFound();
    onStartDuel(false, 'Đối Thủ Đấu Phòng', 'matrix_hacker', code);
    onClose();
  };

  const handlePlayWithBot = (botLevel: 'easy' | 'hard' | 'master') => {
    soundManager.playClick();
    const botName =
      botLevel === 'master' ? 'Bot Thần Xà Nokia' : botLevel === 'hard' ? 'Bot Cao Thủ 3310' : 'Bot Tập Luyện';
    const botSkin =
      botLevel === 'master' ? 'mythic_fire_dragon' : botLevel === 'hard' ? 'cyber_ruby' : 'glacier_ice';

    onStartDuel(true, botName, botSkin, 'SOLO_BOT');
    onClose();
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    setFriendFeedback(null);
    const res = StorageService.addFriend(friendNameInput);
    setFriendFeedback(res.message);
    if (res.success) {
      soundManager.playVictory();
      setFriendNameInput('');
    } else {
      soundManager.playDie();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-zinc-900 border-4 border-zinc-700 rounded-none shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                ĐẤU TRƯỜNG RIVAL 1V1 (CHẾ ĐỘ ĐÔI)
              </h2>
              <p className="text-xs text-zinc-400">
                Tạo phòng, nhập mã solo trực tuyến hoặc tập luyện cùng Bot AI
              </p>
            </div>
          </div>
          <button
            id="btn-close-duel-modal"
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

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-2 border-b-2 border-zinc-800 text-xs">
          <button
            id="tab-create-room"
            type="button"
            onClick={() => {
              setActiveTab('create');
              soundManager.playClick();
            }}
            className={`py-2 rounded-none flex items-center justify-center gap-1.5 transition-colors font-bold border ${
              activeTab === 'create' ? 'bg-zinc-800 text-emerald-400 border-emerald-500 shadow' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Tạo Phòng
          </button>
          <button
            id="tab-join-room"
            type="button"
            onClick={() => {
              setActiveTab('join');
              soundManager.playClick();
            }}
            className={`py-2 rounded-none flex items-center justify-center gap-1.5 transition-colors font-bold border ${
              activeTab === 'join' ? 'bg-zinc-800 text-emerald-400 border-emerald-500 shadow' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Vào Phòng
          </button>
          <button
            id="tab-friends-list"
            type="button"
            onClick={() => {
              setActiveTab('friends');
              soundManager.playClick();
            }}
            className={`py-2 rounded-none flex items-center justify-center gap-1.5 transition-colors font-bold border ${
              activeTab === 'friends' ? 'bg-zinc-800 text-emerald-400 border-emerald-500 shadow' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Bạn Bè ({currentUser.friends.length})
          </button>
        </div>

        {/* Main Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: CREATE ROOM */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {/* Room Code Card */}
              <div className="p-4 rounded-none bg-zinc-950 border-2 border-zinc-800 text-center space-y-2">
                <span className="text-xs text-zinc-400 uppercase tracking-wide">Mã Phòng Của Bạn:</span>
                <div className="text-3xl font-extrabold text-amber-400 tracking-widest py-1 select-all">
                  {createdRoomCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="px-3 py-1.5 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs inline-flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã Sao Chép Mã' : 'Sao Chép Mã Phòng'}
                </button>
                <p className="text-[11px] text-zinc-500 pt-1">
                  Mở thêm 1 tab trình duyệt hoặc gửi mã này cho bạn bè để cùng solo 1v1!
                </p>
              </div>

              {/* Waiting Status / Opponent Status */}
              {guestPlayer ? (
                <div className="p-3 rounded-none bg-emerald-950/40 border-2 border-emerald-600 text-emerald-300 text-xs flex items-center justify-between">
                  <span>Đối thủ đã vào phòng: <b>{guestPlayer.name}</b></span>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMatchFound();
                      onStartDuel(false, guestPlayer.name, guestPlayer.skinId, createdRoomCode);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-400"
                  >
                    Bắt Đầu Trận!
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-none bg-zinc-950 border-2 border-zinc-800 text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none bg-amber-400 animate-ping" />
                    Đang mở phòng chờ đối thủ tham gia...
                  </span>
                  <button
                    type="button"
                    onClick={handleCreateRoomBroadcast}
                    className="text-emerald-400 hover:underline"
                  >
                    Làm Mới Phòng
                  </button>
                </div>
              )}

              {/* Instant Bot Opponent Alternative */}
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-xs text-zinc-400 font-bold block mb-2">
                  HOẶC THÁCH ĐẤU BOT AI NGAY LẬP TỨC:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayWithBot('easy')}
                    className="p-3 rounded-none bg-zinc-950 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-zinc-600 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-emerald-400">Bot Dễ</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Tập luyện phản xạ</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayWithBot('hard')}
                    className="p-3 rounded-none bg-zinc-950 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-amber-600 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-amber-400">Bot Cao Thủ</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Săn mồi thông minh</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayWithBot('master')}
                    className="p-3 rounded-none bg-zinc-950 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-red-600 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-red-400">Thần Xà AI</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Tối thượng 3310</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOIN ROOM */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="input-join-room-code" className="block text-xs text-zinc-300 mb-1.5">
                  Nhập Mã Phòng 5 Ký Tự:
                </label>
                <input
                  id="input-join-room-code"
                  type="text"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: AB7K9"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-zinc-950 border-2 border-zinc-700 rounded-none text-lg text-amber-400 font-extrabold tracking-widest uppercase focus:outline-none focus:border-emerald-500 text-center"
                  autoFocus
                />
              </div>
              <button
                id="btn-confirm-join-room"
                type="submit"
                disabled={!inputRoomCode.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-none border border-emerald-500 transition-colors text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Tham Gia Trận Đấu
              </button>
            </form>
          )}

          {/* TAB 3: FRIENDS & INVITE */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* Add friend form */}
              <form onSubmit={handleAddFriend} className="flex gap-2">
                <input
                  type="text"
                  value={friendNameInput}
                  onChange={(e) => setFriendNameInput(e.target.value)}
                  placeholder="Nhập tên người chơi muốn kết bạn..."
                  className="flex-1 px-3 py-2 bg-zinc-950 border-2 border-zinc-700 rounded-none text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none border border-emerald-500 text-xs"
                >
                  Kết Bạn
                </button>
              </form>

              {friendFeedback && (
                <div className="p-2 rounded-none bg-zinc-950 border border-zinc-800 text-xs text-amber-400">
                  {friendFeedback}
                </div>
              )}

              {/* Friends list */}
              <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-bold block">
                  DANH SÁCH BẠN BÈ ({currentUser.friends.length}):
                </span>
                {currentUser.friends.map((friendName) => (
                  <div
                    key={friendName}
                    className="p-3 rounded-none bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-emerald-400" />
                      <span className="font-bold text-zinc-200">{friendName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        onStartDuel(true, friendName, 'cyber_ruby', 'FRIEND_MATCH');
                        onClose();
                      }}
                      className="px-3 py-1 rounded-none bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-600 font-bold transition-colors"
                    >
                      Mời Đấu 1v1
                    </button>
                  </div>
                ))}

                {currentUser.friends.length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    Chưa có người bạn nào. Hãy nhập tên ở trên để thêm bạn mới!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
