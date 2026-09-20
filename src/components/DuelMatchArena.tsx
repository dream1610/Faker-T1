import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Coordinate,
  Direction,
  FoodItem,
  GameTheme,
  GridSize,
  MapObstacleConfig,
  SnakeSkin,
  UserAccount,
} from '../types';
import { SnakeCanvas } from './SnakeCanvas';
import { ControlsPad } from './ControlsPad';
import { BotOpponent, duelManager } from '../services/multiplayer';
import { soundManager } from '../services/sound';
import { StorageService } from '../services/storage';
import { getSkinById } from '../constants/skins';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { Swords, Trophy, RotateCcw, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

interface DuelMatchArenaProps {
  currentUser: UserAccount;
  currentMap: MapObstacleConfig;
  theme: GameTheme;
  skin: SnakeSkin;
  isBotOpponent: boolean;
  opponentName: string;
  opponentSkinId: string;
  roomCode: string;
  onExitDuel: () => void;
  onUserUpdated: (u: UserAccount) => void;
  activeEmote?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const DuelMatchArena: React.FC<DuelMatchArenaProps> = ({
  currentUser,
  currentMap,
  theme,
  skin,
  isBotOpponent,
  opponentName,
  opponentSkinId,
  roomCode,
  onExitDuel,
  onUserUpdated,
  activeEmote,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const { isTouch, isLandscape, effectiveControlPosition } = useScreenLayout();

  // Match Phases
  const [matchPhase, setMatchPhase] = useState<'match_found' | 'countdown' | 'playing' | 'game_over'>('match_found');
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Auto-activate fullscreen on mobile phones when entering duel arena
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

  // Player 1 (Local You)
  const [p1Snake, setP1Snake] = useState<Coordinate[]>([
    { x: 3, y: Math.floor(currentMap.gridSize / 3) },
    { x: 2, y: Math.floor(currentMap.gridSize / 3) },
    { x: 1, y: Math.floor(currentMap.gridSize / 3) },
  ]);
  const [p1Dir, setP1Dir] = useState<Direction>('RIGHT');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p1Alive, setP1Alive] = useState<boolean>(true);

  // High-performance Input Queue for Player 1
  const p1InputQueueRef = useRef<Direction[]>([]);
  const p1CurrentDirRef = useRef<Direction>('RIGHT');

  // Player 2 (Opponent)
  const opponentSkin = getSkinById(opponentSkinId);
  const [p2Snake, setP2Snake] = useState<Coordinate[]>([
    { x: 3, y: Math.min(currentMap.gridSize - 3, Math.floor((2 * currentMap.gridSize) / 3)) },
    { x: 2, y: Math.min(currentMap.gridSize - 3, Math.floor((2 * currentMap.gridSize) / 3)) },
    { x: 1, y: Math.min(currentMap.gridSize - 3, Math.floor((2 * currentMap.gridSize) / 3)) },
  ]);
  const [p2Dir, setP2Dir] = useState<Direction>('RIGHT');
  const [p2Score, setP2Score] = useState<number>(0);
  const [p2Alive, setP2Alive] = useState<boolean>(true);
  const [p2Emote, setP2Emote] = useState<string | undefined>(undefined);

  // INDEPENDENT FOODS: Player 1 has their own food, Player 2 has their own food
  const [p1Foods, setP1Foods] = useState<FoodItem[]>([]);
  const [p2Foods, setP2Foods] = useState<FoodItem[]>([]);

  // Winner declaration and cause of death tracking
  const [winnerMessage, setWinnerMessage] = useState<string>('');
  const [defeatReason, setDefeatReason] = useState<string>('');
  const botRef = useRef<BotOpponent | null>(null);

  // Helper: Random coord generator for a specific board
  const getRandomFreeCoord = useCallback(
    (targetSnake: Coordinate[], existingFoods: FoodItem[]): Coordinate => {
      const size = currentMap.gridSize;
      let attempts = 0;
      while (attempts < 500) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);

        const hitObstacle = currentMap.obstacles.some((o) => o.x === x && o.y === y);
        const hitSnake = targetSnake.some((s) => s.x === x && s.y === y);
        const hitFood = existingFoods.some((f) => f.x === x && f.y === y);

        if (!hitObstacle && !hitSnake && !hitFood) {
          return { x, y };
        }
        attempts++;
      }
      return { x: 1, y: 1 };
    },
    [currentMap]
  );

  // Helper to spawn new independent food for Player 1
  const spawnP1Food = useCallback(
    (currentSnake: Coordinate[]) => {
      const coord = getRandomFreeCoord(currentSnake, []);
      setP1Foods([
        {
          id: 'p1_f_' + Date.now(),
          x: coord.x,
          y: coord.y,
          type: 'REGULAR',
        },
      ]);
    },
    [getRandomFreeCoord]
  );

  // Helper to spawn new independent food for Player 2
  const spawnP2Food = useCallback(
    (currentSnake: Coordinate[]) => {
      const coord = getRandomFreeCoord(currentSnake, []);
      setP2Foods([
        {
          id: 'p2_f_' + Date.now(),
          x: coord.x,
          y: coord.y,
          type: 'REGULAR',
        },
      ]);
    },
    [getRandomFreeCoord]
  );

  // Initial Match Found sequence
  useEffect(() => {
    soundManager.playMatchFound();
    const timer = setTimeout(() => {
      setMatchPhase('countdown');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // 5-second countdown loop
  useEffect(() => {
    if (matchPhase !== 'countdown') return;

    soundManager.playCountdown(countdownNum);

    if (countdownNum > 0) {
      const timer = setTimeout(() => {
        setCountdownNum((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      soundManager.playCountdown(0);
      const timer = setTimeout(() => {
        setMatchPhase('playing');
        initGameRound();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [matchPhase, countdownNum]);

  // Init Match Round & Independent Foods
  const initGameRound = useCallback(() => {
    const initP1: Coordinate[] = [
      { x: 3, y: Math.floor(currentMap.gridSize / 3) },
      { x: 2, y: Math.floor(currentMap.gridSize / 3) },
      { x: 1, y: Math.floor(currentMap.gridSize / 3) },
    ];
    const initP2: Coordinate[] = [
      { x: 3, y: Math.min(currentMap.gridSize - 3, Math.floor((2 * currentMap.gridSize) / 3)) },
      { x: 2, y: Math.min(currentMap.gridSize - 3, Math.floor((2 * currentMap.gridSize) / 3)) },
      { x: 1, y: Math.min(currentMap.gridSize - 3, Math.floor((2 * currentMap.gridSize) / 3)) },
    ];

    setP1Snake(initP1);
    setP2Snake(initP2);
    setP1Dir('RIGHT');
    setP2Dir('RIGHT');
    p1CurrentDirRef.current = 'RIGHT';
    p1InputQueueRef.current = [];
    setP1Score(0);
    setP2Score(0);
    setP1Alive(true);
    setP2Alive(true);
    setDefeatReason('');

    // Initial independent foods
    spawnP1Food(initP1);
    spawnP2Food(initP2);

    if (isBotOpponent) {
      botRef.current = new BotOpponent(currentMap.gridSize, currentMap, opponentName);
      botRef.current.snake = [...initP2];
    }
  }, [currentMap, isBotOpponent, opponentName, spawnP1Food, spawnP2Food]);

  // Queue Direction Input for Player 1 (instant zero lag)
  const queueP1Direction = useCallback(
    (newDir: Direction) => {
      if (matchPhase !== 'playing' || !p1Alive) return;

      const baseDir =
        p1InputQueueRef.current.length > 0
          ? p1InputQueueRef.current[p1InputQueueRef.current.length - 1]
          : p1CurrentDirRef.current;

      const isOpposite =
        (newDir === 'UP' && baseDir === 'DOWN') ||
        (newDir === 'DOWN' && baseDir === 'UP') ||
        (newDir === 'LEFT' && baseDir === 'RIGHT') ||
        (newDir === 'RIGHT' && baseDir === 'LEFT');

      if (newDir !== baseDir && !isOpposite) {
        if (p1InputQueueRef.current.length < 3) {
          p1InputQueueRef.current.push(newDir);
        }
      }
    },
    [matchPhase, p1Alive]
  );

  // Keyboard controls for Player 1
  useEffect(() => {
    if (matchPhase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
      }

      if (key === 'w' || key === 'arrowup') {
        soundManager.playMove();
        queueP1Direction('UP');
      } else if (key === 's' || key === 'arrowdown') {
        soundManager.playMove();
        queueP1Direction('DOWN');
      } else if (key === 'a' || key === 'arrowleft') {
        soundManager.playMove();
        queueP1Direction('LEFT');
      } else if (key === 'd' || key === 'arrowright') {
        soundManager.playMove();
        queueP1Direction('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchPhase, queueP1Direction]);

  // Broadcast channel subscriber for peer events
  useEffect(() => {
    if (isBotOpponent) return;

    const handleBroadcast = (ev: any) => {
      if (ev.roomCode !== roomCode || ev.senderId === currentUser.id) return;

      if (ev.type === 'PLAYER_MOVE') {
        setP2Snake(ev.payload.snake);
        setP2Score(ev.payload.score);
        setP2Dir(ev.payload.direction);
        if (ev.payload.foods) {
          setP2Foods(ev.payload.foods);
        }
      } else if (ev.type === 'PLAYER_DIED') {
        setP2Alive(false);
        const reason = ev.payload?.reason;
        if (reason === 'self') {
          setDefeatReason(`${opponentName} đã tự cắn vào đuôi!`);
        } else if (reason === 'obstacle') {
          setDefeatReason(`${opponentName} đã va vào chướng ngại vật!`);
        } else if (reason === 'wall') {
          setDefeatReason(`${opponentName} đã đâm vào tường viền!`);
        } else {
          setDefeatReason(`${opponentName} đã thất bại do va chạm!`);
        }
      } else if (ev.type === 'EMOTE_SENT') {
        setP2Emote(ev.payload.emote);
        setTimeout(() => setP2Emote(undefined), 3000);
      }
    };

    duelManager.subscribe(handleBroadcast);
    return () => duelManager.unsubscribe();
  }, [isBotOpponent, roomCode, currentUser.id]);

  // Main Match Game Loop (Fixed step interval, 60fps tick resolution)
  useEffect(() => {
    if (matchPhase !== 'playing') return;

    const stepInterval = currentMap.gridSize <= 10 ? 170 : currentMap.gridSize <= 15 ? 150 : 135;

    const interval = setInterval(() => {
      // 1. Step Player 1 (Local)
      if (p1Alive) {
        let stepDir = p1CurrentDirRef.current;
        if (p1InputQueueRef.current.length > 0) {
          stepDir = p1InputQueueRef.current.shift()!;
          p1CurrentDirRef.current = stepDir;
          setP1Dir(stepDir);
        }

        setP1Snake((prevSnake) => {
          const head = prevSnake[0];
          let nextX = head.x;
          let nextY = head.y;

          if (stepDir === 'UP') nextY -= 1;
          if (stepDir === 'DOWN') nextY += 1;
          if (stepDir === 'LEFT') nextX -= 1;
          if (stepDir === 'RIGHT') nextX += 1;

          // Boundary check
          if (!currentMap.hasBorder) {
            nextX = (nextX + currentMap.gridSize) % currentMap.gridSize;
            nextY = (nextY + currentMap.gridSize) % currentMap.gridSize;
          } else {
            if (nextX < 0 || nextX >= currentMap.gridSize || nextY < 0 || nextY >= currentMap.gridSize) {
              handlePlayer1Died('wall');
              return prevSnake;
            }
          }

          // Obstacle check
          if (currentMap.obstacles.some((o) => o.x === nextX && o.y === nextY)) {
            handlePlayer1Died('obstacle');
            return prevSnake;
          }

          // Self collision check (bites own tail)
          if (prevSnake.slice(0, -1).some((s) => s.x === nextX && s.y === nextY)) {
            handlePlayer1Died('self');
            return prevSnake;
          }

          const newHead = { x: nextX, y: nextY };
          const newSnake = [newHead, ...prevSnake];

          // INDEPENDENT FOOD CHECK FOR P1
          const eatenFoodIdx = p1Foods.findIndex((f) => f.x === nextX && f.y === nextY);
          let newFoods = p1Foods;

          if (eatenFoodIdx >= 0) {
            soundManager.playEat(skin.soundVariant);
            setP1Score((s) => s + 10);
            // Spawn new independent food for Player 1
            const coord = getRandomFreeCoord(newSnake, []);
            newFoods = [
              {
                id: 'p1_f_' + Date.now(),
                x: coord.x,
                y: coord.y,
                type: 'REGULAR',
              },
            ];
            setP1Foods(newFoods);
          } else {
            newSnake.pop();
          }

          // Broadcast local player move to peer
          if (!isBotOpponent) {
            duelManager.broadcast({
              type: 'PLAYER_MOVE',
              roomCode,
              senderId: currentUser.id,
              payload: {
                snake: newSnake,
                score: p1Score + (eatenFoodIdx >= 0 ? 10 : 0),
                direction: stepDir,
                foods: newFoods,
              },
            });
          }

          return newSnake;
        });
      }

      // 2. Step Bot Player 2 if in Bot Opponent Mode
      if (isBotOpponent && botRef.current && p2Alive) {
        // Bot targets its own independent food!
        const targetFood = p2Foods[0] || null;
        const botStep = botRef.current.step(targetFood);

        if (botStep.dead) {
          setP2Alive(false);
          soundManager.playDie();
          if (botStep.reason === 'self') {
            setDefeatReason(`${opponentName} đã tự cắn vào đuôi!`);
          } else if (botStep.reason === 'obstacle') {
            setDefeatReason(`${opponentName} đã va vào chướng ngại vật!`);
          } else {
            setDefeatReason(`${opponentName} đã đâm vào tường!`);
          }
        } else {
          setP2Snake([...botRef.current.snake]);
          setP2Score(botRef.current.score);
          setP2Dir(botRef.current.direction);

          if (botStep.ate) {
            // Respawn independent food for Bot Player 2
            spawnP2Food(botRef.current.snake);
          }
        }
      }
    }, stepInterval);

    return () => clearInterval(interval);
  }, [
    matchPhase,
    p1Alive,
    p2Alive,
    currentMap,
    p1Foods,
    p2Foods,
    skin,
    isBotOpponent,
    roomCode,
    currentUser.id,
    getRandomFreeCoord,
    spawnP2Food,
    p1Score,
  ]);

  // Check Game Over Condition: Match continues until ONE fails by hitting obstacle/wall or biting self!
  useEffect(() => {
    if (matchPhase !== 'playing') return;

    if (!p1Alive && !p2Alive) {
      setMatchPhase('game_over');
      setWinnerMessage('HÒA TRẬN! Cả hai người chơi đều va chạm!');
      soundManager.playDie();
    } else if (!p1Alive) {
      setMatchPhase('game_over');
      setWinnerMessage(`${opponentName} CHIẾN THẮNG! 🏆`);
      soundManager.playDie();
    } else if (!p2Alive) {
      setMatchPhase('game_over');
      setWinnerMessage(`CHIẾN THẮNG! ${currentUser.username} GIÀNH THẮNG LỢI! 🏆`);
      soundManager.playVictory();

      const res = StorageService.saveGameScore(currentMap.id, p1Score, 35, true);
      if (res.updatedUser) {
        onUserUpdated(res.updatedUser);
      }
    }
  }, [p1Alive, p2Alive, matchPhase, opponentName, currentUser.username, currentMap.id, p1Score, onUserUpdated]);

  const handlePlayer1Died = (reason?: 'wall' | 'obstacle' | 'self') => {
    setP1Alive(false);
    soundManager.playDie();
    if (reason === 'self') {
      setDefeatReason('Bạn đã tự cắn vào đuôi!');
    } else if (reason === 'obstacle') {
      setDefeatReason('Bạn đã va phải chướng ngại vật!');
    } else if (reason === 'wall') {
      setDefeatReason('Bạn đã đâm vào tường viền!');
    } else {
      setDefeatReason('Va chạm tử thương!');
    }

    if (!isBotOpponent) {
      duelManager.broadcast({
        type: 'PLAYER_DIED',
        roomCode,
        senderId: currentUser.id,
        payload: { reason },
      });
    }
  };

  const restartDuel = () => {
    soundManager.playClick();
    setCountdownNum(3);
    setMatchPhase('countdown');
  };

  return (
    <div
      className={`w-full h-full flex flex-col font-mono select-none overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-40 bg-zinc-950 w-full h-[100dvh] max-h-[100dvh] p-1 sm:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          : 'p-1 sm:p-2'
      }`}
    >
      {/* 1. MATCH FOUND OVERLAY */}
      {matchPhase === 'match_found' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="text-center space-y-3 animate-bounce">
            <span className="text-5xl">⚔️</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-amber-400 tracking-wider">
              MATCH FOUND!
            </h2>
            <p className="text-xs text-zinc-300">Đã tìm thấy đối thủ: {opponentName}</p>
          </div>
        </div>
      )}

      {/* 2. COUNTDOWN OVERLAY */}
      {matchPhase === 'countdown' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center space-y-3 px-4">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              RIVAL 1V1
            </span>
            <div className="text-7xl sm:text-9xl font-black text-amber-400 animate-pulse font-mono">
              {countdownNum === 0 ? 'CHIẾN!' : countdownNum}
            </div>
            <div className="text-xs text-zinc-300">
              {currentUser.username} <span className="text-red-400 font-bold">VS</span> {opponentName}
            </div>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              Ai va vào tường, chướng ngại vật hoặc tự cắn vào đuôi trước sẽ THUA!
            </p>
          </div>
        </div>
      )}

      {/* Top Real-Time Duel HUD (Ultra Slim to Maximize Vertical Space) */}
      <header className="w-full flex items-center justify-between bg-zinc-900 border-2 border-zinc-700 rounded-none px-2 py-1 mb-1 text-xs gap-2 flex-shrink-0 shadow-sm">
        {/* Player 1 Info */}
        <div className="flex items-center gap-2">
          {onExitDuel && (
            <button
              id="btn-duel-exit"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onExitDuel();
              }}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 text-xs font-bold rounded-none flex items-center gap-1 transition-colors"
              title="Thoát phòng"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Menu</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-400">{currentUser.username}</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 font-bold">
              {p1Score} ĐIỂM
            </span>
          </div>
        </div>

        {/* Center VS Indicator with Survival rule badge */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Swords className="w-3.5 h-3.5" />
            <span className="text-xs">RIVAL 1V1</span>
          </div>
          <span className="text-[10px] text-zinc-400">
            Đấu đến khi 1 bên va chạm
          </span>
        </div>

        {/* Player 2 Info & Fullscreen Toggle */}
        <div className="flex items-center gap-2 text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-cyan-400">{opponentName}</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 font-bold">
              {p2Score} ĐIỂM
            </span>
          </div>

          {onToggleFullscreen && (
            <button
              id="btn-duel-top-fullscreen"
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

      {/* MAIN DUAL GAME ARENA: Maximizes Screen Space for Both Boards */}
      <div
        className={`flex-1 min-h-0 w-full flex overflow-hidden items-center justify-center relative ${
          effectiveControlPosition === 'right'
            ? 'flex-row gap-2'
            : effectiveControlPosition === 'left'
            ? 'flex-row-reverse gap-2'
            : 'flex-col gap-1'
        }`}
      >
        {/* Dual Boards Container (Side-by-Side in Landscape or 2-up in Portrait) */}
        <div className={`flex-1 w-full h-full min-h-0 min-w-0 grid gap-1.5 items-center justify-center p-0.5 ${
          isLandscape ? 'grid-cols-2 grid-rows-1' : 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1'
        }`}>
          {/* Left Board: Player 1 (You) with Independent Foods */}
          <div className="w-full h-full min-h-0 min-w-0 flex flex-col items-center justify-center p-1 bg-zinc-950/70 border-2 border-emerald-600 rounded-none relative">
            <div className="w-full flex items-center justify-between text-[11px] text-zinc-400 px-1 mb-0.5 flex-shrink-0">
              <span className="font-bold text-emerald-400 truncate max-w-[120px]">Bạn: {currentUser.username}</span>
              <span className={p1Alive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {p1Alive ? 'Đang Sống' : 'Đã Thua!'}
              </span>
            </div>

            <SnakeCanvas
              gridSize={currentMap.gridSize}
              snake={p1Snake}
              direction={p1Dir}
              obstacles={currentMap.obstacles}
              hasBorder={currentMap.hasBorder}
              foods={p1Foods}
              theme={theme}
              skin={skin}
              hat={currentUser.customHat}
              isAlive={p1Alive}
              activeEmote={activeEmote}
              className="w-full h-full flex items-center justify-center flex-1 min-h-0"
            />
          </div>

          {/* Right Board: Player 2 (Opponent) with Independent Foods */}
          <div className="w-full h-full min-h-0 min-w-0 flex flex-col items-center justify-center p-1 bg-zinc-950/70 border-2 border-cyan-600 rounded-none relative">
            <div className="w-full flex items-center justify-between text-[11px] text-zinc-400 px-1 mb-0.5 flex-shrink-0">
              <span className="font-bold text-cyan-400 truncate max-w-[120px]">Đối thủ: {opponentName}</span>
              <span className={p2Alive ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                {p2Alive ? 'Đang Sống' : 'Đã Thua!'}
              </span>
            </div>

            <SnakeCanvas
              gridSize={currentMap.gridSize}
              snake={p2Snake}
              direction={p2Dir}
              obstacles={currentMap.obstacles}
              hasBorder={currentMap.hasBorder}
              foods={p2Foods}
              theme={theme}
              skin={opponentSkin}
              isAlive={p2Alive}
              activeEmote={p2Emote}
              className="w-full h-full flex items-center justify-center flex-1 min-h-0"
            />
          </div>
        </div>

        {/* Responsive Compact Controls for Player 1 on Mobile/Touch */}
        {isTouch && (
          <div
            className={`flex-shrink-0 flex items-center justify-center select-none ${
              effectiveControlPosition === 'bottom'
                ? 'w-full py-0.5 sm:py-1'
                : 'h-full px-0.5 sm:px-1'
            }`}
          >
            <ControlsPad
              onDirectionChange={queueP1Direction}
              currentDirection={p1Dir}
              isPaused={false}
              onTogglePause={() => {}}
              accentColor={theme.accentColor}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Game Over Modal in Duel Mode */}
      {matchPhase === 'game_over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border-4 border-zinc-700 rounded-none p-5 text-center space-y-3 shadow-2xl">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-base sm:text-lg font-black text-zinc-100">{winnerMessage}</h3>

            {defeatReason && (
              <div className="bg-red-950/60 border border-red-800 text-red-200 text-xs py-1.5 px-2.5 rounded-none font-medium flex items-center justify-center gap-1.5">
                <span>⚠️</span>
                <span>{defeatReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-2.5 rounded-none border-2 border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500">Điểm của bạn:</span>
                <div className="text-lg font-bold text-emerald-400">{p1Score}</div>
              </div>
              <div>
                <span className="text-zinc-500">Điểm đối thủ:</span>
                <div className="text-lg font-bold text-cyan-400">{p2Score}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={restartDuel}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none text-xs flex items-center justify-center gap-1 shadow-md border border-emerald-500"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đấu Lại
              </button>
              <button
                type="button"
                onClick={onExitDuel}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-none text-xs flex items-center justify-center gap-1 border border-zinc-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Rời Phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
