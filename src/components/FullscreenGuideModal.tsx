import React from 'react';
import { soundManager } from '../services/sound';
import { X, Share2, PlusSquare, Smartphone, CheckCircle2, Sparkles, ExternalLink, Download } from 'lucide-react';

interface FullscreenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  canPromptNativeInstall?: boolean;
  onNativeInstall?: () => void;
}

export const FullscreenGuideModal: React.FC<FullscreenGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  canPromptNativeInstall,
  onNativeInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none">
      <div className="w-full max-w-lg bg-zinc-900 border-4 border-amber-500 rounded-none shadow-[0_0_30px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b-2 border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 text-zinc-950 font-black text-xs rounded-none flex items-center gap-1">
              <Smartphone className="w-4 h-4" /> 100%
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                ẨN THANH TRÌNH DUYỆT • TOÀN MÀN HÌNH
              </h2>
              <p className="text-[10px] text-zinc-400">
                Loại bỏ thanh tìm kiếm ở trên & thanh chuyển trang ở dưới
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-none bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs text-zinc-200">
          {/* Why explanation banner */}
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-none">
            <p className="text-[11px] text-amber-300 leading-relaxed">
              ⚠️ <strong>Lưu ý:</strong> Trên điện thoại (đặc biệt là iPhone), trình duyệt web mặc định luôn giữ thanh tìm kiếm ở trên và thanh chuyển trang ở dưới.
              Để ẩn 100% hai thanh này, bạn chỉ cần làm theo hướng dẫn sau:
            </p>
          </div>

          {/* Guide Steps */}
          {isIOS ? (
            <div className="space-y-3">
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                CÁCH TỐT NHẤT: THÊM VÀO MÀN HÌNH CHÍNH (PWA)
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="w-6 h-6 rounded-none bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>Nhấn nút Chia sẻ</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-sky-400 text-[10px]">
                      <Share2 className="w-3 h-3 inline" /> ⎋
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Nằm ở thanh công cụ phía dưới cùng hoặc trên cùng của trình duyệt Safari.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="w-6 h-6 rounded-none bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>Chọn &quot;Thêm vào MH chính&quot;</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-amber-400 text-[10px]">
                      <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Cuộn xuống danh sách tùy chọn chia sẻ và bấm dòng có biểu tượng dấu cộng [+].
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-zinc-950 p-2.5 border border-zinc-800">
                <div className="w-6 h-6 rounded-none bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-zinc-100">
                    Nhấn &quot;Thêm&quot; (Add) ở góc trên bên phải
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    ✓ Thoát ra Màn hình chính và mở biểu tượng &quot;Rắn Săn Mồi&quot; vừa tạo: Toàn bộ thanh tìm kiếm và thanh chuyển trang sẽ biến mất 100%, game full màn hình không viền!
                  </p>
                </div>
              </div>

              {/* Quick Safari shortcut */}
              <div className="p-2.5 bg-zinc-950 border border-sky-500/40 space-y-1">
                <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  💡 Mẹo ẩn nhanh trực tiếp trên Safari:
                </div>
                <p className="text-[10px] text-zinc-300">
                  Nhấn vào biểu tượng <strong>&quot;aA&quot;</strong> ở bên trái thanh địa chỉ tìm kiếm ➔ Chọn <strong>&quot;Ẩn thanh công cụ&quot; (Hide Toolbar)</strong> để thu nhỏ thanh trình duyệt lại ngay lập tức!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                CÀI ĐẶT ỨNG DỤNG ĐỂ CHƠI TOÀN MÀN HÌNH
              </div>

              {canPromptNativeInstall && onNativeInstall ? (
                <div className="p-3 bg-emerald-950/40 border-2 border-emerald-500 space-y-2 text-center">
                  <p className="text-xs text-zinc-200">
                    Trình duyệt của bạn hỗ trợ cài đặt trực tiếp chỉ với 1 chạm:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onNativeInstall();
                      onClose();
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 border border-emerald-400 shadow-md"
                  >
                    <Download className="w-4 h-4" /> Cài Đặt Game Toàn Màn Hình Ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-2 bg-zinc-950 p-3 border border-zinc-800">
                  <p className="text-[11px] text-zinc-300">
                    1. Nhấn vào biểu tượng menu <strong>3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt Chrome/Cốc Cốc.
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    2. Chọn <strong>&quot;Thêm vào màn hình chính&quot;</strong> hoặc <strong>&quot;Cài đặt ứng dụng&quot;</strong>.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    3. Mở game từ biểu tượng ứng dụng để chơi toàn màn hình 100% không còn thanh địa chỉ.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t-2 border-zinc-800 flex items-center justify-between gap-2">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Game hỗ trợ PWA offline
          </span>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs border border-amber-400 transition-colors"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
