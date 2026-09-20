import React, { useState } from 'react';
import { UserAccount } from '../types';
import { StorageService } from '../services/storage';
import { soundManager } from '../services/sound';
import { Users, UserPlus, LogIn, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLoginSuccess }) => {
  const accounts = StorageService.getAccounts();
  const [tab, setTab] = useState<'saved' | 'login' | 'register'>(accounts.length > 0 ? 'saved' : 'register');
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = StorageService.register(usernameInput);
    if (!res.success || !res.user) {
      setErrorMessage(res.error || 'Đăng ký không thành công.');
      soundManager.playDie();
      return;
    }
    soundManager.playVictory();
    onLoginSuccess(res.user);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = StorageService.login(usernameInput);
    if (!res.success || !res.user) {
      setErrorMessage(res.error || 'Đăng nhập thất bại.');
      soundManager.playDie();
      return;
    }
    soundManager.playVictory();
    onLoginSuccess(res.user);
  };

  const handleSelectAccount = (acc: UserAccount) => {
    soundManager.playClick();
    StorageService.setActiveUserId(acc.id);
    onLoginSuccess(acc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-none shadow-2xl p-6 relative overflow-hidden">
        {/* Retro Header Screen */}
        <div className="text-center pb-5 border-b-2 border-zinc-800">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-zinc-800 border-2 border-zinc-700 mb-3 shadow-inner">
            <span className="text-3xl">🐍</span>
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-wider text-emerald-400">
            RẮN SĂN MỒI CỔ ĐIỂN
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {accounts.length === 0
              ? 'Tạo tài khoản người chơi để lưu kỷ lục và tiền xu'
              : 'Đăng nhập hoặc chọn tài khoản để tiếp tục'}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-none mt-4 border-2 border-zinc-800 text-xs font-mono">
          <button
            id="tab-register-account"
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage('');
              soundManager.playClick();
            }}
            className={`py-2 rounded-none flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'register' ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Đăng Ký
          </button>
          <button
            id="tab-login-account"
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
              soundManager.playClick();
            }}
            className={`py-2 rounded-none flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'login' ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Đăng Nhập
          </button>
          <button
            id="tab-saved-accounts"
            type="button"
            onClick={() => {
              setTab('saved');
              setErrorMessage('');
              soundManager.playClick();
            }}
            className={`py-2 rounded-none flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'saved' ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Đã Lưu ({accounts.length})
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-none bg-red-950/80 border-2 border-red-800 text-red-300 text-xs font-mono">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* TAB 1: Saved accounts list */}
        {tab === 'saved' && (
          <div className="mt-4">
            <p className="text-xs text-zinc-400 mb-2 font-mono">Danh sách tài khoản đã lưu trên thiết bị:</p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  id={`btn-select-user-${acc.id}`}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full flex items-center justify-between p-3 rounded-none bg-zinc-800/80 hover:bg-zinc-700/80 border-2 border-zinc-700 hover:border-emerald-500 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{acc.avatarIcon || '🐍'}</span>
                    <div>
                      <div className="font-bold text-sm text-zinc-100 font-mono group-hover:text-emerald-400">
                        {acc.username}
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 font-mono">
                        <span className="text-amber-400 font-bold">🪙 {acc.coins} xu</span>
                        <span>•</span>
                        <span>{Object.keys(acc.highScores).length} bản đồ</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition-transform" />
                </button>
              ))}

              {accounts.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-xs font-mono border-2 border-dashed border-zinc-800 p-4">
                  Chưa có tài khoản nào. Vui lòng bấm tab Đăng Ký để tạo tài khoản mới!
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
              <button
                id="btn-goto-register"
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage('');
                }}
                className="text-xs text-emerald-400 hover:underline font-mono"
              >
                + Đăng ký tài khoản người chơi mới
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Direct Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <div>
              <label htmlFor="login-username-input" className="block text-xs text-zinc-300 font-mono mb-1.5">
                Tên Người Chơi:
              </label>
              <input
                id="login-username-input"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Nhập tên tài khoản của bạn..."
                className="w-full px-3 py-2.5 bg-zinc-950 border-2 border-zinc-700 rounded-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                autoFocus
              />
            </div>
            <button
              id="btn-submit-login"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none transition-colors font-mono text-sm border border-emerald-500 shadow-md active:scale-98"
            >
              Đăng Nhập Vào Game
            </button>
          </form>
        )}

        {/* TAB 3: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="mt-4 space-y-4">
            <div>
              <label htmlFor="register-username-input" className="block text-xs text-zinc-300 font-mono mb-1.5">
                Đặt Tên Người Chơi Mới:
              </label>
              <input
                id="register-username-input"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Ví dụ: SnakeMaster, NokiaPro..."
                className="w-full px-3 py-2.5 bg-zinc-950 border-2 border-zinc-700 rounded-none text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                maxLength={16}
                autoFocus
              />
              <p className="text-[11px] text-zinc-400 mt-1.5 font-mono">
                Từ 3 đến 16 ký tự. Nhận ngay 200 xu tân thủ khi tạo mới!
              </p>
            </div>
            <button
              id="btn-submit-register"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none transition-colors font-mono text-sm border border-emerald-500 shadow-md active:scale-98"
            >
              Tạo Tài Khoản & Bắt Đầu
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
