import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Coordinate, Direction, FoodItem, GameTheme, MapObstacleConfig, SnakeSkin, SnakeSpeedLevel, UserAccount } from '../types';
import { SnakeCanvas } from './SnakeCanvas';
import { ControlsPad } from './ControlsPad';
import { SpeedSettingModal } from './SpeedSettingModal';
import { soundManager } from '../services/sound';
import { StorageService } from '../services/storage';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { SNAKE_SPEED_OPTIONS, SPEED_LEVELS, getSpeedOption } from '../constants/speeds';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Infinity,
  Sparkles,
  ArrowLeft,
  Layers,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';

interface SingleGameArenaProps {
  currentUser: UserAccount;
  currentMap: MapObstacleConfig;
  theme: GameTheme;
  skin: SnakeSkin;
  onUserUpdated: (u: UserAccount) => void;
  activeEmote?: string;
  onReturnToMenu?: () => void;
  onChangeMap?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SingleGameArena: React.FC<SingleGameArenaProps> = ({
  currentUser,
  currentMap,
  theme,
  skin,
  onUserUpdated,
  activeEmote,
  onReturnToMenu,
  onChangeMap,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const { isTouch, effectiveControlPosition } = useScreenLayout();

  // Snake State
  const [snake, setSnake] = useState<Coordinate[]>([
    { x: 3, y: Math.floor(currentMap.gridSize / 2) },
    { x: 2, y: Math.floor(currentMap.gridSize / 2) },
    { x: 1, y: Math.floor(currentMap.gridSize / 2) },
  ]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isUnlimitedTime, setIsUnlimitedTime] = useState<boolean>(false);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [isPlayingStarted, setIsPlayingStarted] = useState<boolean>(false);

  // Snake Speed Setting (Levels 1 to 5)
  const [speedLevel, setSpeedLevel] = useState<SnakeSpeedLevel>(() => StorageService.getSnakeSpeed());
  const [showSpeedModal, setShowSpeedModal] = useState<boolean>(false);

  const handleChangeSpeed = useCallback((newSpeed: SnakeSpeedLevel) => {
    setSpeedLevel(newSpeed);
    StorageService.setSnakeSpeed(newSpeed);
  }, []);

  // High-performance 60fps Input Queue buffer to prevent skipped or reverse inputs
  const inputQueueRef = useRef<Direction[]>([]);
  const currentDirectionRef = useRef<Direction>('RIGHT');
  const specialSpawnTimerRef = useRef<number>(0);
  const personalHighScore = currentUser.highScores[currentMap.id] || 0;

  // Auto-activate fullscreen on mobile phones when entering game
  useEffect(() => {
    if (!isFullscreen && onToggleFullscreen) {
      const isMobile =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent || '');
      if (isMobile) {
        onToggleFullscreen();
      }
    }
  }, [isFullscreen, onToggleFullscreen]);

  // Helper to generate a random coordinate free of snake and obstacles
  const getRandomFreeCoord = useCallback(
    (currentSnake: Coordinate[], existingFoods: FoodItem[]): Coordinate => {
      const size = currentMap.gridSize;
      let attempts = 0;
      while (attempts < 500) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);

        const hitObstacle = currentMap.obstacles.some((o) => o.x === x && o.y === y);
        const hitSnake = currentSnake.some((s) => s.x === x && s.y === y);
        const hitFood = existingFoods.some((f) => f.x === x && f.y === y);

        if (!hitObstacle && !hitSnake && !hitFood) {
          return { x, y };
        }
        attempts++;
      }
      return { x: 0, y: 0 };
    },
    [currentMap]
  );

  // Initialize foods
  const initGame = useCallback(() => {
    const initialSnake: Coordinate[] = [
      { x: 3, y: Math.floor(currentMap.gridSize / 2) },
      { x: 2, y: Math.floor(currentMap.gridSize / 2) },
      { x: 1, y: Math.floor(currentMap.gridSize / 2) },
    ];
    setSnake(initialSnake);
    setDirection('RIGHT');
    currentDirectionRef.current = 'RIGHT';
    inputQueueRef.current = [];
    setScore(0);
    setCoinsEarned(0);
    setIsAlive(true);
    setIsPaused(false);
    setIsGameOver(false);
    setIsNewRecord(false);
    setCountdownNum(3);
    setIsPlayingStarted(false);

    // Initial regular circular food
    const fPos = getRandomFreeCoord(initialSnake, []);
    setFoods([
      {
        id: 'food_' + Date.now(),
        x: fPos.x,
        y: fPos.y,
        type: 'REGULAR',
      },
    ]);
  }, [currentMap, getRandomFreeCoord]);

  // Reset when map changes
  useEffect(() => {
    initGame();
  }, [currentMap.id, initGame]);

  // 3-second countdown loop before offline single game begins (3, 2, 1, CHIẾN!)
  useEffect(() => {
    if (isGameOver || isPaused) return;

    if (countdownNum > 0) {
      soundManager.playCountdown(countdownNum);
      const timer = setTimeout(() => {
        setCountdownNum((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdownNum === 0 && !isPlayingStarted) {
      soundManager.playCountdown(0);
      const timer = setTimeout(() => {
        setIsPlayingStarted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdownNum, isGameOver, isPaused, isPlayingStarted]);

  // Direction Input Queue Handler (Immediate response, zero lag, prevents reverse suicide)
  const queueDirection = useCallback(
    (newDir: Direction) => {
      if (isPaused || isGameOver || !isAlive) return;

      const baseDir =
        inputQueueRef.current.length > 0
          ? inputQueueRef.current[inputQueueRef.current.length - 1]
          : currentDirectionRef.current;

      const isOpposite =
        (newDir === 'UP' && baseDir === 'DOWN') ||
        (newDir === 'DOWN' && baseDir === 'UP') ||
        (newDir === 'LEFT' && baseDir === 'RIGHT') ||
        (newDir === 'RIGHT' && baseDir === 'LEFT');

      if (newDir !== baseDir && !isOpposite) {
        if (inputQueueRef.current.length < 3) {
          inputQueueRef.current.push(newDir);
        }
      }
    },
    [isPaused, isGameOver, isAlive]
  );

  // Keyboard input (WASD and Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
        e.preventDefault();
      }

      if (key === ' ' || key === 'p') {
        setIsPaused((p) => !p);
        soundManager.playClick();
        return;
      }

      if ((key === 'arrowup' || key === 'w')) {
        soundManager.playMove();
        queueDirection('UP');
      } else if ((key === 'arrowdown' || key === 's')) {
        soundManager.playMove();
        queueDirection('DOWN');
      } else if ((key === 'arrowleft' || key === 'a')) {
        soundManager.playMove();
        queueDirection('LEFT');
      } else if ((key === 'arrowright' || key === 'd')) {
        soundManager.playMove();
        queueDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queueDirection]);

  // Game Loop: Snake Step Interval
  useEffect(() => {
    if (!isAlive || isPaused || isGameOver || !isPlayingStarted || countdownNum > 0) return;

    const speedOpt = getSpeedOption(speedLevel);
    let baseSpeed =
      currentMap.gridSize <= 10 ? 190 : currentMap.gridSize <= 12 ? 175 : currentMap.gridSize <= 15 ? 160 : 140;

    // Apply speed multiplier delay factor (lower delay = faster snake)
    baseSpeed = Math.round(baseSpeed * speedOpt.delayFactor);

    if (!isUnlimitedTime) {
      const maxSpeedup = Math.min(Math.floor(baseSpeed * 0.45), Math.floor(score * 1.6));
      baseSpeed = Math.max(45, baseSpeed - maxSpeedup);
    }

    const interval = setInterval(() => {
      // Pop next move from input queue if available
      let stepDir = currentDirectionRef.current;
      if (inputQueueRef.current.length > 0) {
        stepDir = inputQueueRef.current.shift()!;
        currentDirectionRef.current = stepDir;
        setDirection(stepDir);
      }

      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let nextX = head.x;
        let nextY = head.y;

        if (stepDir === 'UP') nextY -= 1;
        if (stepDir === 'DOWN') nextY += 1;
        if (stepDir === 'LEFT') nextX -= 1;
        if (stepDir === 'RIGHT') nextX += 1;

        // 1. Boundary Check
        if (!currentMap.hasBorder) {
          nextX = (nextX + currentMap.gridSize) % currentMap.gridSize;
          nextY = (nextY + currentMap.gridSize) % currentMap.gridSize;
        } else {
          if (nextX < 0 || nextX >= currentMap.gridSize || nextY < 0 || nextY >= currentMap.gridSize) {
            handleGameOver();
            return prevSnake;
          }
        }

        // 2. Obstacle Check
        if (currentMap.obstacles.some((o) => o.x === nextX && o.y === nextY)) {
          handleGameOver();
          return prevSnake;
        }

        // 3. Self Collision Check
        if (prevSnake.slice(0, -1).some((s) => s.x === nextX && s.y === nextY)) {
          handleGameOver();
          return prevSnake;
        }

        const newHead = { x: nextX, y: nextY };
        let newSnake = [newHead, ...prevSnake];

        // 4. Food Collisions Check
        const eatenIdx = foods.findIndex((f) => f.x === nextX && f.y === nextY);
        if (eatenIdx >= 0) {
          const eatenFood = foods[eatenIdx];
          const remainingFoods = foods.filter((_, idx) => idx !== eatenIdx);

          if (eatenFood.type === 'REGULAR') {
            soundManager.playEat(skin.soundVariant);
            setScore((s) => s + 1);
            setCoinsEarned((c) => c + 5);

            // Spawn next regular food
            const newRegCoord = getRandomFreeCoord(newSnake, remainingFoods);
            remainingFoods.push({
              id: 'food_' + Date.now(),
              x: newRegCoord.x,
              y: newRegCoord.y,
              type: 'REGULAR',
            });
          } else if (eatenFood.type === 'SPECIAL_GROW') {
            soundManager.playSpecialEat(skin.soundVariant);
            setScore((s) => s + 5);
            setCoinsEarned((c) => c + 25);

            const tail = newSnake[newSnake.length - 1];
            newSnake.push({ ...tail }, { ...tail });
          } else if (eatenFood.type === 'SPECIAL_SHRINK') {
            soundManager.playShrink();
            setScore((s) => s + 8);
            setCoinsEarned((c) => c + 15);

            if (newSnake.length > 3) {
              newSnake.pop();
              newSnake.pop();
            }
          }

          setFoods(remainingFoods);
        } else {
          newSnake.pop();
        }

        // 5. Periodic Special Food Spawner
        specialSpawnTimerRef.current += 1;
        if (specialSpawnTimerRef.current > 32) {
          specialSpawnTimerRef.current = 0;
          const hasSpecial = foods.some((f) => f.type !== 'REGULAR');
          if (!hasSpecial && Math.random() < 0.75) {
            const isGrow = Math.random() < 0.65;
            const specialCoord = getRandomFreeCoord(newSnake, foods);
            setFoods((prev) => [
              ...prev,
              {
                id: 'special_' + Date.now(),
                x: specialCoord.x,
                y: specialCoord.y,
                type: isGrow ? 'SPECIAL_GROW' : 'SPECIAL_SHRINK',
              },
            ]);
          }
        }

        return newSnake;
      });
    }, baseSpeed);

    return () => clearInterval(interval);
  }, [
    isAlive,
    isPaused,
    isGameOver,
    isPlayingStarted,
    countdownNum,
    currentMap,
    foods,
    skin,
    isUnlimitedTime,
    speedLevel,
    getRandomFreeCoord,
    score,
  ]);

  const handleGameOver = () => {
    setIsAlive(false);
    setIsGameOver(true);
    soundManager.playDie();

    const res = StorageService.saveGameScore(currentMap.id, score, coinsEarned);
    if (res.newRecord) {
      setIsNewRecord(true);
      soundManager.playVictory();
    }
    if (res.updatedUser) {
      onUserUpdated(res.updatedUser);
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col font-mono select-none overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-40 bg-zinc-950 w-full h-[100dvh] max-h-[100dvh] p-1 sm:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          : 'p-1 sm:p-2'
      }`}
    >
      {/* 1. OFFLINE COUNTDOWN OVERLAY (3, 2, 1, CHIẾN!) */}
      {countdownNum >= 0 && !isPlayingStarted && !isGameOver && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none select-none">
          <div className="text-center space-y-3 px-4 animate-in fade-in zoom-in duration-200">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 bg-emerald-950/80 border border-emerald-500/50">
              CHẾ ĐỘ CỔ ĐIỂN • {currentMap.name}
            </span>
            <div className="text-7xl sm:text-9xl font-black text-amber-400 animate-pulse font-mono drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">
              {countdownNum === 0 ? 'CHIẾN!' : countdownNum}
            </div>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto font-mono">
              Chuẩn bị săn mồi • Sẵn sàng điều khiển!
            </p>
          </div>
        </div>
      )}

      {/* Ultra Compact Top HUD (Maximized Vertical Space) */}
      <header className="w-full flex items-center justify-between bg-zinc-900 border-2 border-zinc-700 rounded-none px-2 py-1 mb-1 text-xs gap-2 flex-shrink-0 shadow-sm">
        {/* Navigation & Map */}
        <div className="flex items-center gap-1.5">
          {onReturnToMenu && (
            <button
              id="btn-single-return-menu"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onReturnToMenu();
              }}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-none flex items-center gap-1 transition-colors"
              title="Về Menu"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Menu</span>
            </button>
          )}

          {onChangeMap && (
            <button
              id="btn-single-change-map"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onChangeMap();
              }}
              className="hidden sm:flex px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 text-xs font-bold rounded-none items-center gap-1 transition-colors"
              title="Đổi bản đồ"
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Màn</span>
            </button>
          )}

          <span className="hidden md:inline text-[11px] text-zinc-400 font-bold border-l border-zinc-700 pl-2">
            {currentMap.name} ({currentMap.gridSize}x{currentMap.gridSize})
          </span>
        </div>

        {/* Real-time Scores */}
        <div className="flex items-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 uppercase">Điểm:</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">{score}</span>
          </div>

          <div className="hidden xs:flex items-center gap-1 border-l border-zinc-800 pl-2">
            <span className="text-[10px] text-zinc-400 uppercase">Dài:</span>
            <span className="text-xs font-bold text-zinc-200">{snake.length}</span>
          </div>

          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <span className="text-[10px] text-zinc-400 uppercase">Xu:</span>
            <span className="text-xs font-bold text-amber-400">+{coinsEarned}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-zinc-800 pl-2">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-bold text-amber-300">
              {Math.max(personalHighScore, score)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Speed Adjustment Button */}
          <button
            id="btn-single-top-speed"
            type="button"
            onClick={() => {
              soundManager.playClick();
              setShowSpeedModal(true);
            }}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-none flex items-center gap-1 transition-colors"
            title="Chỉnh tốc độ của rắn"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="hidden xs:inline text-zinc-300">Tốc độ:</span>
            <span className="text-amber-300 font-bold">{getSpeedOption(speedLevel).shortLabel}</span>
            <span className="text-[10px] text-zinc-400">({getSpeedOption(speedLevel).multiplier})</span>
          </button>

          {/* Pause Button */}
          <button
            id="btn-single-top-pause"
            type="button"
            onClick={() => {
              setIsPaused((p) => !p);
              soundManager.playClick();
            }}
            className="p-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-none transition-colors"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Unlimited Time Toggle */}
          <button
            id="btn-single-top-unlimited"
            type="button"
            onClick={() => {
              setIsUnlimitedTime(!isUnlimitedTime);
              soundManager.playClick();
            }}
            className={`p-1 border rounded-none text-xs transition-colors ${
              isUnlimitedTime
                ? 'bg-purple-900 border-purple-500 text-purple-300 font-bold'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Chế độ tốc độ ổn định vô hạn"
          >
            <Infinity className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              id="btn-single-top-fullscreen"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onToggleFullscreen();
              }}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 rounded-none transition-colors"
              title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Arena: Maximized Canvas Space + Responsive Compact Controls */}
      <div
        className={`flex-1 min-h-0 w-full flex overflow-hidden items-center justify-center relative ${
          effectiveControlPosition === 'right'
            ? 'flex-row gap-2'
            : effectiveControlPosition === 'left'
            ? 'flex-row-reverse gap-2'
            : 'flex-col gap-1'
        }`}
      >
        {/* Canvas Display Stage (Dynamically Fills Maximum Area) */}
        <div className="flex-1 w-full h-full min-h-0 min-w-0 flex items-center justify-center p-0.5 relative bg-zinc-950/60 border-2 border-zinc-800 rounded-none">
          <SnakeCanvas
            gridSize={currentMap.gridSize}
            snake={snake}
            direction={direction}
            obstacles={currentMap.obstacles}
            hasBorder={currentMap.hasBorder}
            foods={foods}
            theme={theme}
            skin={skin}
            hat={currentUser.customHat}
            isAlive={isAlive}
            activeEmote={activeEmote}
            className="w-full h-full flex items-center justify-center"
          />

          {/* Pause Overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-none flex flex-col items-center justify-center space-y-3 z-30 p-4">
              <Pause className="w-10 h-10 text-amber-400 animate-pulse" />
              <span className="text-base font-bold text-zinc-100">ĐANG TẠM DỪNG</span>

              {/* Inline Quick Speed Adjustment */}
              <div className="w-full max-w-xs bg-zinc-950 border-2 border-zinc-800 p-2.5 space-y-1.5 text-center">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-current" /> Tốc Độ Rắn:
                  </span>
                  <span className="text-amber-400 font-mono">
                    {getSpeedOption(speedLevel).shortLabel} ({getSpeedOption(speedLevel).multiplier})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {SPEED_LEVELS.map((lvl) => {
                    const opt = SNAKE_SPEED_OPTIONS[lvl];
                    const isSel = speedLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          handleChangeSpeed(lvl);
                        }}
                        className={`py-1 text-[11px] font-bold border transition-colors ${
                          isSel
                            ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-sm'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500'
                        }`}
                        title={opt.label}
                      >
                        {opt.multiplier}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[10px] text-zinc-400 pt-0.5">
                  {getSpeedOption(speedLevel).description}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-resume-game"
                  type="button"
                  onClick={() => setIsPaused(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none border border-emerald-500 text-xs transition-colors shadow-md"
                >
                  Tiếp Tục Chơi
                </button>
                {onReturnToMenu && (
                  <button
                    id="btn-pause-return-menu"
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onReturnToMenu();
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-none border border-zinc-700 text-xs transition-colors"
                  >
                    Về Menu
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xs rounded-none flex flex-col items-center justify-center space-y-2 p-3 z-30 animate-fadeIn">
              {isNewRecord && (
                <div className="text-[11px] font-bold px-2.5 py-0.5 rounded-none border border-amber-400 bg-amber-500 text-zinc-950 flex items-center gap-1 animate-bounce">
                  <Sparkles className="w-3 h-3" /> KỶ LỤC MỚI!
                </div>
              )}
              <h3 className="text-xl font-black text-red-400 tracking-wider">TRÒ CHƠI KẾT THÚC</h3>

              <div className="bg-zinc-950 p-2.5 rounded-none border-2 border-zinc-800 text-xs w-full max-w-xs space-y-1 text-center">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Điểm Đạt Được:</span>
                  <span className="font-bold text-emerald-400 text-sm">{score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Độ Dài Rắn:</span>
                  <span className="font-bold text-zinc-200">{snake.length} Ô</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tốc Độ Rắn:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> {getSpeedOption(speedLevel).shortLabel} ({getSpeedOption(speedLevel).multiplier})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Xu Nhận Được:</span>
                  <span className="font-bold text-amber-400">+{coinsEarned + (isNewRecord ? 20 : 0)} 🪙</span>
                </div>
              </div>

              {/* Quick speed change before replay */}
              <button
                type="button"
                id="btn-gameover-change-speed"
                onClick={() => {
                  soundManager.playClick();
                  setShowSpeedModal(true);
                }}
                className="w-full max-w-xs py-1 px-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Đổi Tốc Độ (Hiện tại: {getSpeedOption(speedLevel).multiplier})</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs pt-1">
                <button
                  id="btn-single-replay"
                  type="button"
                  onClick={initGame}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none border border-emerald-500 text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Chơi Lại Ván Mới
                </button>

                {onReturnToMenu && (
                  <button
                    id="btn-single-gameover-menu"
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onReturnToMenu();
                    }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-none border border-zinc-700 text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Về Menu Chọn Màn
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Responsive Compact Controls on Mobile / Touch */}
        {isTouch && (
          <div
            className={`flex-shrink-0 flex items-center justify-center select-none ${
              effectiveControlPosition === 'bottom'
                ? 'w-full py-1'
                : 'h-full px-1'
            }`}
          >
            <ControlsPad
              onDirectionChange={queueDirection}
              currentDirection={direction}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((p) => !p)}
              accentColor={theme.accentColor}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Snake Speed Adjustment Modal */}
      <SpeedSettingModal
        isOpen={showSpeedModal}
        onClose={() => setShowSpeedModal(false)}
        currentSpeed={speedLevel}
        onSelectSpeed={handleChangeSpeed}
        isDynamicSpeed={!isUnlimitedTime}
        onToggleDynamicSpeed={() => setIsUnlimitedTime((prev) => !prev)}
      />
    </div>
  );
};
