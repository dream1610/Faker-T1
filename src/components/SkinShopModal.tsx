import React, { useState } from 'react';
import { SnakeSkin, UserAccount } from '../types';
import { SNAKE_SKINS } from '../constants/skins';
import { soundManager } from '../services/sound';
import { StorageService } from '../services/storage';
import { X, Sparkles, Volume2, Check, Lock, Zap, Flame, Ghost } from 'lucide-react';

interface SkinShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserUpdated: (user: UserAccount) => void;
}

export const SkinShopModal: React.FC<SkinShopModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [selectedSkinId, setSelectedSkinId] = useState<string>(currentUser.currentSkinId);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'skins' | 'hats'>('skins');
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const selectedSkin = SNAKE_SKINS.find((s) => s.id === selectedSkinId) || SNAKE_SKINS[0];
  const isOwned = currentUser.ownedSkinIds.includes(selectedSkin.id);
  const isEquipped = currentUser.currentSkinId === selectedSkin.id;

  const handleTestSound = (skin: SnakeSkin) => {
    if (skin.soundVariant === 'fire') {
      soundManager.playSpecialEat('fire');
    } else if (skin.soundVariant === 'lightning') {
      soundManager.playSpecialEat('lightning');
    } else if (skin.soundVariant === 'ghost') {
      soundManager.playEat('ghost');
    } else if (skin.soundVariant === 'arcade') {
      soundManager.playEat('arcade');
    } else {
      soundManager.playEat('classic');
    }
  };

  const handleBuySkin = (skin: SnakeSkin) => {
    setPurchaseMsg(null);
    if (currentUser.coins < skin.price) {
      setPurchaseMsg({ text: 'Bạn không đủ xu! Hãy chơi game hoặc điểm danh để kiếm thêm.', isError: true });
      soundManager.playDie();
      return;
    }

    const updated = StorageService.updateActiveUser((u) => {
      u.coins -= skin.price;
      if (!u.ownedSkinIds.includes(skin.id)) {
        u.ownedSkinIds.push(skin.id);
      }
      u.currentSkinId = skin.id;
      return u;
    });

    if (updated) {
      soundManager.playVictory();
      setPurchaseMsg({ text: `Đã mở khóa và trang bị skin ${skin.name}!`, isError: false });
      onUserUpdated(updated);
    }
  };

  const handleEquipSkin = (skin: SnakeSkin) => {
    const updated = StorageService.updateActiveUser((u) => {
      u.currentSkinId = skin.id;
      return u;
    });
    if (updated) {
      soundManager.playClick();
      onUserUpdated(updated);
    }
  };

  const handleEquipHat = (hat: 'none' | 'crown' | 'glasses' | 'cap' | 'horns') => {
    const updated = StorageService.updateActiveUser((u) => {
      u.customHat = hat;
      return u;
    });
    if (updated) {
      soundManager.playClick();
      onUserUpdated(updated);
    }
  };

  const filteredSkins = SNAKE_SKINS.filter((s) => {
    if (filterRarity === 'all') return true;
    return s.rarity === filterRarity;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-zinc-900 border-4 border-zinc-700 rounded-none shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
                CỬA HÀNG SKIN & NGOẠI HÌNH
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Số dư: <span className="text-amber-400 font-bold">🪙 {currentUser.coins} Xu</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-shop"
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

        {/* Top Filter & Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b-2 border-zinc-800 bg-zinc-900 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-none border-2 border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('skins');
                soundManager.playClick();
              }}
              className={`px-3 py-1.5 rounded-none transition-colors border ${
                activeTab === 'skins' ? 'bg-zinc-800 text-emerald-400 border-emerald-500 font-bold' : 'border-transparent text-zinc-400'
              }`}
            >
              Skin Rắn ({SNAKE_SKINS.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('hats');
                soundManager.playClick();
              }}
              className={`px-3 py-1.5 rounded-none transition-colors border ${
                activeTab === 'hats' ? 'bg-zinc-800 text-emerald-400 border-emerald-500 font-bold' : 'border-transparent text-zinc-400'
              }`}
            >
              Phụ Kiện Đầu (5)
            </button>
          </div>

          {activeTab === 'skins' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <span className="text-zinc-500 mr-1 hidden sm:inline">Phẩm:</span>
              {[
                { id: 'all', label: 'Tất Cả' },
                { id: 'mythic', label: '★ Tối Thượng (3)' },
                { id: 'epic', label: 'Sử Thi' },
                { id: 'rare', label: 'Hiếm' },
                { id: 'classic', label: 'Cơ Bản' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterRarity(f.id)}
                  className={`px-2.5 py-1 rounded-none border transition-colors ${
                    filterRarity === f.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification message */}
        {purchaseMsg && (
          <div
            className={`mx-5 mt-3 p-2.5 rounded-none font-mono text-xs border ${
              purchaseMsg.isError
                ? 'bg-red-950/80 border-red-800 text-red-300'
                : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
            }`}
          >
            {purchaseMsg.isError ? '⚠️ ' : '✅ '}
            {purchaseMsg.text}
          </div>
        )}

        {/* Main Content Area: Left Grid, Right Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Left / Center: Skins List */}
          <div className="md:col-span-2 overflow-y-auto p-4 border-r-2 border-zinc-800 space-y-4 max-h-[60vh]">
            {activeTab === 'skins' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredSkins.map((skin) => {
                  const owned = currentUser.ownedSkinIds.includes(skin.id);
                  const equipped = currentUser.currentSkinId === skin.id;
                  const isSelected = selectedSkinId === skin.id;

                  return (
                    <button
                      key={skin.id}
                      id={`skin-card-${skin.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedSkinId(skin.id);
                        setPurchaseMsg(null);
                        soundManager.playClick();
                      }}
                      className={`relative p-3 rounded-none border-2 text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-950/20 shadow-lg'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between w-full mb-2">
                        {skin.rarity === 'mythic' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-none bg-gradient-to-r from-red-600 to-amber-500 text-white flex items-center gap-0.5 animate-pulse">
                            {skin.effect === 'spark' && <Flame className="w-2.5 h-2.5" />}
                            {skin.effect === 'fade' && <Ghost className="w-2.5 h-2.5" />}
                            {skin.effect === 'electric' && <Zap className="w-2.5 h-2.5" />}
                            TỐI THƯỢNG
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-none ${
                              skin.rarity === 'epic'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : skin.rarity === 'rare'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {skin.rarity === 'epic' ? 'Sử Thi' : skin.rarity === 'rare' ? 'Hiếm' : 'Thường'}
                          </span>
                        )}

                        {equipped && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded-none border border-emerald-800">
                            Đang Dùng
                          </span>
                        )}
                      </div>

                      {/* Mini Snake Visual Preview */}
                      <div className="h-10 w-full bg-zinc-900 rounded-none flex items-center justify-center gap-1 my-1 px-2 border border-zinc-800">
                        <div
                          className="w-4 h-4 rounded-none shadow-inner relative flex items-center justify-center"
                          style={{ backgroundColor: skin.headColor }}
                        >
                          <div className="w-1 h-1 bg-black rounded-none absolute -top-0.5 right-0.5" />
                        </div>
                        <div className="w-3.5 h-3.5 rounded-none" style={{ backgroundColor: skin.bodyColor }} />
                        <div className="w-3 h-3 rounded-none opacity-90" style={{ backgroundColor: skin.bodyColor }} />
                        <div className="w-2.5 h-2.5 rounded-none opacity-70" style={{ backgroundColor: skin.tailColor }} />
                      </div>

                      {/* Info & Price */}
                      <div className="mt-2">
                        <div className="text-xs font-bold text-zinc-200 font-mono truncate">{skin.name}</div>
                        <div className="text-[11px] font-mono mt-1 flex items-center justify-between">
                          {owned ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-bold">
                              <Check className="w-3 h-3" /> Đã Sở Hữu
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold">🪙 {skin.price} Xu</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB: HATS / ACCESSORIES */}
            {activeTab === 'hats' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 font-mono">
                  Trang bị phụ kiện độc đáo trên đầu rắn (Mở khóa miễn phí qua thăng hạng và kỉ lục):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'none', label: 'Không Đội Phụ Kiện', icon: '❌', desc: 'Giữ nguyên nét tối giản cổ điển.' },
                    { id: 'crown', label: 'Vương Miện Quán Quân', icon: '👑', desc: 'Biểu tượng của nhà vô địch bất bại.' },
                    { id: 'glasses', label: 'Kính Râm Pixel Ngầu', icon: '🕶️', desc: 'Phong cách Cyberpunk sành điệu.' },
                    { id: 'cap', label: 'Mũ Lưỡi Trai Năng Động', icon: '🧢', desc: 'Thoải mái, đậm chất đường phố.' },
                    { id: 'horns', label: 'Cặp Sừng Quỷ Dạ Xoa', icon: '😈', desc: 'Sự hung hãn đe dọa mọi đối thủ trong phòng.' },
                  ].map((hatItem) => {
                    const isEquippedHat = currentUser.customHat === hatItem.id;
                    return (
                      <button
                        key={hatItem.id}
                        type="button"
                        onClick={() => handleEquipHat(hatItem.id as any)}
                        className={`p-3 rounded-none border-2 text-left flex items-start gap-3 transition-colors ${
                          isEquippedHat
                            ? 'border-emerald-500 bg-emerald-950/30'
                            : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-3xl">{hatItem.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-zinc-200 font-mono flex items-center justify-between">
                            {hatItem.label}
                            {isEquippedHat && <span className="text-xs text-emerald-400">Đang Chọn</span>}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono mt-1">{hatItem.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Selected Item Detailed Inspector */}
          <div className="p-5 bg-zinc-950 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Chi Tiết Skin</span>
                <button
                  type="button"
                  onClick={() => handleTestSound(selectedSkin)}
                  className="px-2.5 py-1 rounded-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Thử Âm Thanh
                </button>
              </div>

              {/* Large Visual Showcase Box */}
              <div className="h-32 bg-zinc-900 rounded-none border-2 border-zinc-800 relative flex items-center justify-center overflow-hidden">
                {/* Background grid dots */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                />

                {/* Snake Display in Box */}
                <div className="relative z-10 flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-none border-2 border-white/40 shadow-lg relative flex items-center justify-center font-bold"
                    style={{ backgroundColor: selectedSkin.headColor }}
                  >
                    <div className="w-2 h-2 bg-black rounded-none absolute -top-1 right-1" />
                    {selectedSkin.hat && selectedSkin.hat !== 'none' && (
                      <span className="absolute -top-3 text-base">
                        {selectedSkin.hat === 'crown' ? '👑' : selectedSkin.hat === 'glasses' ? '🕶️' : '🧢'}
                      </span>
                    )}
                  </div>
                  <div
                    className="w-8 h-8 rounded-none border border-white/20"
                    style={{ backgroundColor: selectedSkin.bodyColor }}
                  />
                  <div
                    className="w-7 h-7 rounded-none border border-white/10 opacity-90"
                    style={{ backgroundColor: selectedSkin.bodyColor }}
                  />
                  <div
                    className="w-6 h-6 rounded-none opacity-75"
                    style={{ backgroundColor: selectedSkin.tailColor }}
                  />
                </div>

                {/* Mythic badge overlay */}
                {selectedSkin.rarity === 'mythic' && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-none bg-amber-500 text-black border border-amber-400">
                    <Sparkles className="w-3 h-3" /> HIỆU ỨNG ĐẶC BIỆT
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-100 font-mono">{selectedSkin.name}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed">
                  {selectedSkin.description}
                </p>

                {selectedSkin.effect !== 'none' && (
                  <div className="mt-3 p-2.5 rounded-none bg-amber-950/40 border-2 border-amber-700/50 text-amber-300 text-xs font-mono flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      {selectedSkin.effect === 'spark' && 'Kích hoạt hiệu ứng tàn tro & tia lửa rực cháy khi săn mồi!'}
                      {selectedSkin.effect === 'fade' && 'Kích hoạt hiệu ứng mờ dần dạng ảo ảnh ghost trail!'}
                      {selectedSkin.effect === 'electric' && 'Kích hoạt hiệu ứng hồ quang sấm sét giật liên hồi!'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t-2 border-zinc-800 space-y-2">
              {isOwned ? (
                <button
                  id="btn-equip-selected-skin"
                  type="button"
                  disabled={isEquipped}
                  onClick={() => handleEquipSkin(selectedSkin)}
                  className={`w-full py-3 rounded-none font-mono text-sm font-bold transition-all shadow-md border ${
                    isEquipped
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 active:scale-98'
                  }`}
                >
                  {isEquipped ? 'Đang Trang Bị' : 'Trang Bị Skin Này'}
                </button>
              ) : (
                <button
                  id="btn-buy-selected-skin"
                  type="button"
                  onClick={() => handleBuySkin(selectedSkin)}
                  className="w-full py-3 rounded-none bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-sm font-bold transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 border border-amber-400"
                >
                  <Lock className="w-4 h-4" /> Mở Khóa với {selectedSkin.price} Xu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
