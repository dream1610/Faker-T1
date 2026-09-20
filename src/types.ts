export type GridSize = 10 | 12 | 15 | 20;

export interface Coordinate {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type FoodType = 'REGULAR' | 'SPECIAL_GROW' | 'SPECIAL_SHRINK';

export interface FoodItem {
  id: string;
  x: number;
  y: number;
  type: FoodType;
  timer?: number; // duration left in seconds for special foods
}

export interface MapObstacleConfig {
  id: string;
  name: string;
  gridSize: GridSize;
  layoutIndex: number; // 1 to 7
  layoutName: string;
  hasBorder: boolean;
  description: string;
  obstacles: Coordinate[];
}

export interface GameTheme {
  id: string;
  name: string;
  bg: string;
  gridBg: string;
  gridLine: string;
  snakeDefault: string;
  snakeHeadDefault: string;
  foodColor: string;
  specialGrowColor: string;
  shrinkColor: string;
  obstacleColor: string;
  textColor: string;
  accentColor: string;
}

export type SkinRarity = 'classic' | 'rare' | 'epic' | 'mythic';
export type SkinEffect = 'none' | 'spark' | 'fade' | 'electric';
export type SoundProfile = 'classic' | 'arcade' | 'fire' | 'ghost' | 'lightning';

export interface SnakeSkin {
  id: string;
  name: string;
  price: number;
  rarity: SkinRarity;
  effect: SkinEffect;
  headColor: string;
  bodyColor: string;
  tailColor: string;
  pattern: 'solid' | 'stripes' | 'dots' | 'glow' | 'checker';
  soundVariant: SoundProfile;
  description: string;
  hat?: 'none' | 'crown' | 'glasses' | 'cap' | 'horns';
}

export interface UserAccount {
  id: string;
  username: string;
  avatarIcon: string;
  coins: number;
  highScores: Record<string, number>; // key: `${gridSize}_${layoutIndex}` -> high score
  currentSkinId: string;
  ownedSkinIds: string[];
  currentThemeId: string;
  rankPoints: number;
  dailyStreak: number;
  lastDailyClaim: string; // YYYY-MM-DD
  friends: string[];
  customHat: 'none' | 'crown' | 'glasses' | 'cap' | 'horns';
  createdAt: string;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  mapTitle: string;
  skinId: string;
  rankTitle: string;
  isCurrentUser?: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'global' | 'room' | 'system';
  emote?: string;
}

export interface DuelPlayerData {
  id: string;
  username: string;
  score: number;
  snakeLength: number;
  snake: Coordinate[];
  alive: boolean;
  skinId: string;
  currentEmote?: { emote: string; time: number };
}

export interface DuelRoomState {
  roomCode: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  countdown: number;
  gridSize: GridSize;
  layoutIndex: number;
  host: DuelPlayerData;
  guest?: DuelPlayerData;
  winnerId?: string;
  foods: FoodItem[];
}
