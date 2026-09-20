import React, { useState } from 'react';
import { GridSize, MapObstacleConfig, UserAccount } from '../types';
import { ALL_MAPS, GRID_SIZES } from '../constants/maps';
import { soundManager } from '../services/sound';
import { X, Trophy, Shield, Play } from 'lucide-react';

interface MapSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMap: MapObstacleConfig;
  onSelectMap: (map: MapObstacleConfig) => void;
  onStartGame?: (map: MapObstacleConfig) => void;
  currentUser: UserAccount;
}

export const MapSelectModal: React.FC<MapSelectModalProps> = ({
  isOpen,
  onClose,
  selectedMap,
  onSelectMap,
  onStartGame,
  currentUser,
}) => {
  const [activeSize, setActiveSize] = useState<GridSize>(selectedMap.gridSize);

  if (!isOpen) return null;

  const currentSizeMaps = ALL_MAPS.filter((m) => m.gridSize === activeSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-zinc-900 border-4 border-zinc-700 rounded-none shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
                CHỌN BẢN ĐỒ CHIẾN ĐẤU (28 BẢN ĐỒ)
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                4 kích thước ô lưới x 7 kiểu chướng ngại vật retro
              </p>
            </div>
          </div>
          <button
            id="btn-close-map-select"
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

        {/* Grid Size Switcher */}
        <div className="flex items-center justify-center gap-2 p-3 bg-zinc-950 border-b-2 border-zinc-800 text-xs font-mono">
          <span className="text-zinc-500 mr-2 hidden sm:inline">Kích thước ô lưới:</span>
          {GRID_SIZES.map((size) => (
            <button
              key={size}
              id={`size-btn-${size}`}
              type="button"
              onClick={() => {
                setActiveSize(size);
                soundManager.playClick();
              }}
              className={`px-4 py-2 rounded-none font-bold transition-all border-2 ${
                activeSize === size
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border-zinc-700'
              }`}
            >
              {size}x{size} Khối
            </button>
          ))}
        </div>

        {/* 7 Maps for chosen size */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSizeMaps.map((mapConfig) => {
            const isCurrent = selectedMap.id === mapConfig.id;
            const personalBest = currentUser.highScores[mapConfig.id] || 0;

            return (
              <div
                key={mapConfig.id}
                id={`map-card-${mapConfig.id}`}
                className={`p-4 rounded-none border-2 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-emerald-950/20 border-emerald-500 shadow-lg'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div>
                  {/* Map Header & Mini Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-zinc-300">
                      Màn {mapConfig.layoutIndex}/7
                    </span>
                    {mapConfig.hasBorder ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Có Rào Viền
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-blue-950 text-blue-300 border border-blue-800">
                        Xuyên Tường
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold font-mono text-emerald-400 mb-1">
                    {mapConfig.layoutName}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mb-3 line-clamp-2">
                    {mapConfig.description}
                  </p>

                  {/* Visual Mini Map Thumbnail */}
                  <div className="h-28 w-full bg-zinc-900 rounded-none border-2 border-zinc-800 relative flex items-center justify-center p-2 mb-3">
                    <div
                      className="relative w-24 h-24 border border-zinc-700 bg-zinc-950 rounded-none"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${mapConfig.gridSize}, 1fr)`,
                        gridTemplateRows: `repeat(${mapConfig.gridSize}, 1fr)`,
                      }}
                    >
                      {/* Obstacle dots */}
                      {mapConfig.obstacles.map((obs, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-500 rounded-none shadow-sm"
                          style={{
                            gridColumnStart: obs.x + 1,
                            gridRowStart: obs.y + 1,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Record & Action Buttons */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3 bg-zinc-900 px-3 py-1.5 rounded-none border border-zinc-800">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Kỷ Lục:
                    </span>
                    <span className="font-bold text-amber-400">{personalBest} Điểm</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-select-map-${mapConfig.id}`}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        onSelectMap(mapConfig);
                        onClose();
                      }}
                      className={`flex-1 py-2 rounded-none font-mono text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                        isCurrent
                          ? 'bg-zinc-800 text-emerald-400 border-emerald-500'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      {isCurrent ? 'Đang Chọn' : 'Chọn'}
                    </button>

                    <button
                      id={`btn-play-map-${mapConfig.id}`}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        onSelectMap(mapConfig);
                        if (onStartGame) {
                          onStartGame(mapConfig);
                        }
                        onClose();
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-none transition-all flex items-center justify-center gap-1 border border-emerald-500 shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Vào Chơi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
