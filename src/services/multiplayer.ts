import { Coordinate, Direction, DuelPlayerData, GridSize, MapObstacleConfig } from '../types';

export interface RoomBroadcastEvent {
  type: 'ROOM_CREATED' | 'PLAYER_JOINED' | 'MATCH_FOUND' | 'PLAYER_MOVE' | 'PLAYER_DIED' | 'EMOTE_SENT' | 'ROOM_CHAT' | 'ROOM_CLOSED';
  roomCode: string;
  senderId: string;
  payload: any;
}

export class DuelManager {
  private channel: BroadcastChannel | null = null;
  private onEventCallback: ((event: RoomBroadcastEvent) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('retro_snake_duel_channel');
      this.channel.onmessage = (ev) => {
        if (this.onEventCallback) {
          this.onEventCallback(ev.data);
        }
      };
    }
  }

  public subscribe(callback: (event: RoomBroadcastEvent) => void) {
    this.onEventCallback = callback;
  }

  public unsubscribe() {
    this.onEventCallback = null;
  }

  public broadcast(event: RoomBroadcastEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {}
    }
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const duelManager = new DuelManager();

// Intelligent Retro AI Opponent Logic for 1v1 Duel Mode
export class BotOpponent {
  public snake: Coordinate[] = [];
  public direction: Direction = 'RIGHT';
  public alive: boolean = true;
  public score: number = 0;
  public username: string = 'Bot Nokia AI';
  public skinId: string = 'cyber_ruby';
  private gridSize: GridSize = 15;
  private obstacles: Coordinate[] = [];
  private hasBorder: boolean = false;

  constructor(gridSize: GridSize, map: MapObstacleConfig, botName: string = 'Bot Cao Thủ Nokia') {
    this.gridSize = gridSize;
    this.obstacles = map.obstacles;
    this.hasBorder = map.hasBorder;
    this.username = botName;

    // Place bot initial snake near bottom/middle
    const startY = Math.min(gridSize - 3, Math.max(2, Math.floor(gridSize * 0.75)));
    const startX = 3;
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = 'RIGHT';
    this.alive = true;
    this.score = 0;
  }

  public step(foodTarget: Coordinate | null): { newHead: Coordinate; ate: boolean; dead: boolean; reason?: 'wall' | 'obstacle' | 'self' } {
    if (!this.alive) return { newHead: this.snake[0], ate: false, dead: true };

    const head = this.snake[0];
    const possibleMoves: { dir: Direction; pos: Coordinate }[] = [
      { dir: 'UP', pos: { x: head.x, y: head.y - 1 } },
      { dir: 'DOWN', pos: { x: head.x, y: head.y + 1 } },
      { dir: 'LEFT', pos: { x: head.x - 1, y: head.y } },
      { dir: 'RIGHT', pos: { x: head.x + 1, y: head.y } },
    ];

    // Filter opposite direction
    const validMoves = possibleMoves.filter((m) => {
      if (this.direction === 'UP' && m.dir === 'DOWN') return false;
      if (this.direction === 'DOWN' && m.dir === 'UP') return false;
      if (this.direction === 'LEFT' && m.dir === 'RIGHT') return false;
      if (this.direction === 'RIGHT' && m.dir === 'LEFT') return false;
      return true;
    });

    // Check collision safety
    const safeMoves = validMoves.filter((m) => {
      let targetX = m.pos.x;
      let targetY = m.pos.y;

      if (!this.hasBorder) {
        targetX = (targetX + this.gridSize) % this.gridSize;
        targetY = (targetY + this.gridSize) % this.gridSize;
      } else {
        if (targetX < 0 || targetX >= this.gridSize || targetY < 0 || targetY >= this.gridSize) {
          return false;
        }
      }

      // Check obstacle
      if (this.obstacles.some((o) => o.x === targetX && o.y === targetY)) return false;

      // Check self body (except tail which moves forward)
      const bodyHits = this.snake.slice(0, -1).some((s) => s.x === targetX && s.y === targetY);
      return !bodyHits;
    });

    let chosenMove = safeMoves[0];

    if (safeMoves.length > 0) {
      // Dynamic mistake chance: as snake grows longer or moves around, occasional human-like suboptimal turns
      const mistakeChance = Math.min(0.08, 0.01 + this.snake.length * 0.003);
      const makesMistake = Math.random() < mistakeChance && safeMoves.length > 1;

      if (foodTarget && !makesMistake) {
        // Find safe move that minimizes Manhattan distance to food
        safeMoves.sort((a, b) => {
          const ax = !this.hasBorder ? (a.pos.x + this.gridSize) % this.gridSize : a.pos.x;
          const ay = !this.hasBorder ? (a.pos.y + this.gridSize) % this.gridSize : a.pos.y;
          const bx = !this.hasBorder ? (b.pos.x + this.gridSize) % this.gridSize : b.pos.x;
          const by = !this.hasBorder ? (b.pos.y + this.gridSize) % this.gridSize : b.pos.y;

          const distA = Math.abs(ax - foodTarget.x) + Math.abs(ay - foodTarget.y);
          const distB = Math.abs(bx - foodTarget.x) + Math.abs(by - foodTarget.y);
          return distA - distB;
        });
        chosenMove = safeMoves[0];
      } else {
        // Keep current direction if safe, otherwise first safe move
        const keepCurrent = safeMoves.find((m) => m.dir === this.direction);
        chosenMove = keepCurrent || safeMoves[Math.floor(Math.random() * safeMoves.length)];
      }
    } else {
      // No safe move available -> will crash into obstacle or own tail
      chosenMove = validMoves[0] || { dir: this.direction, pos: { x: head.x, y: head.y } };
    }

    this.direction = chosenMove.dir;
    let nextX = chosenMove.pos.x;
    let nextY = chosenMove.pos.y;

    if (!this.hasBorder) {
      nextX = (nextX + this.gridSize) % this.gridSize;
      nextY = (nextY + this.gridSize) % this.gridSize;
    } else {
      if (nextX < 0 || nextX >= this.gridSize || nextY < 0 || nextY >= this.gridSize) {
        this.alive = false;
        return { newHead: head, ate: false, dead: true, reason: 'wall' };
      }
    }

    // Check collision with obstacles
    if (this.obstacles.some((o) => o.x === nextX && o.y === nextY)) {
      this.alive = false;
      return { newHead: head, ate: false, dead: true, reason: 'obstacle' };
    }

    // Check self collision (bites own tail)
    if (this.snake.some((s) => s.x === nextX && s.y === nextY)) {
      this.alive = false;
      return { newHead: head, ate: false, dead: true, reason: 'self' };
    }

    const newHead = { x: nextX, y: nextY };
    let ate = false;
    if (foodTarget && nextX === foodTarget.x && nextY === foodTarget.y) {
      ate = true;
      this.score += 10;
      this.snake.unshift(newHead);
    } else {
      this.snake.unshift(newHead);
      this.snake.pop();
    }

    return { newHead, ate, dead: false };
  }
}
