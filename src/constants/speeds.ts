import { SnakeSpeedLevel, SnakeSpeedOption } from '../types';

export const SNAKE_SPEED_OPTIONS: Record<SnakeSpeedLevel, SnakeSpeedOption> = {
  1: {
    level: 1,
    label: 'Cấp 1: Rất Chậm (Dễ)',
    shortLabel: 'Rất chậm',
    multiplier: '0.7x',
    delayFactor: 1.45,
    color: 'text-sky-400 border-sky-500 bg-sky-950/60',
    description: 'Bò chậm rãi, lý tưởng cho người mới chơi hoặc bản đồ hẹp nhiều tường.',
  },
  2: {
    level: 2,
    label: 'Cấp 2: Chậm',
    shortLabel: 'Chậm',
    multiplier: '0.85x',
    delayFactor: 1.2,
    color: 'text-emerald-400 border-emerald-500 bg-emerald-950/60',
    description: 'Tốc độ vừa phải, dễ dàng xoay sở và tính toán hướng đi.',
  },
  3: {
    level: 3,
    label: 'Cấp 3: Tiêu Chuẩn (Nokia 3310)',
    shortLabel: 'Chuẩn',
    multiplier: '1.0x',
    delayFactor: 1.0,
    color: 'text-amber-400 border-amber-500 bg-amber-950/60',
    description: 'Tốc độ cân bằng chuẩn xác của game rắn săn mồi cổ điển nguyên bản.',
  },
  4: {
    level: 4,
    label: 'Cấp 4: Nhanh (Thử Thách)',
    shortLabel: 'Nhanh',
    multiplier: '1.3x',
    delayFactor: 0.78,
    color: 'text-orange-400 border-orange-500 bg-orange-950/60',
    description: 'Nhanh hơn rõ rệt, thử thách phản xạ và kỹ năng bẻ lái.',
  },
  5: {
    level: 5,
    label: 'Cấp 5: Siêu Tốc (Hardcore)',
    shortLabel: 'Siêu tốc',
    multiplier: '1.7x',
    delayFactor: 0.6,
    color: 'text-rose-400 border-rose-500 bg-rose-950/60',
    description: 'Tốc độ thần tốc cực đại, yêu cầu phản ứng chớp nhoáng của cao thủ.',
  },
};

export const SPEED_LEVELS: SnakeSpeedLevel[] = [1, 2, 3, 4, 5];

export function getSpeedOption(level: SnakeSpeedLevel): SnakeSpeedOption {
  return SNAKE_SPEED_OPTIONS[level] || SNAKE_SPEED_OPTIONS[3];
}
