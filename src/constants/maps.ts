import { Coordinate, GridSize, MapObstacleConfig } from '../types';

// Generates 7 obstacle patterns scaled cleanly to any given grid size
export function generateMapsForSize(size: GridSize): MapObstacleConfig[] {
  const mid = Math.floor(size / 2);
  const q1 = Math.floor(size / 4);
  const q3 = Math.floor((3 * size) / 4);

  // 1. Tự do (No obstacles)
  const map1Obstacles: Coordinate[] = [];

  // 2. Rào bao xung quanh (Full perimeter border)
  const map2Obstacles: Coordinate[] = [];
  for (let i = 0; i < size; i++) {
    map2Obstacles.push({ x: i, y: 0 });
    map2Obstacles.push({ x: i, y: size - 1 });
    if (i > 0 && i < size - 1) {
      map2Obstacles.push({ x: 0, y: i });
      map2Obstacles.push({ x: size - 1, y: i });
    }
  }

  // 3. Mê cung chữ thập (Cross/Plus shape in center with openings)
  const map3Obstacles: Coordinate[] = [];
  const crossOffset = Math.max(1, Math.floor(size / 5));
  for (let i = crossOffset; i < size - crossOffset; i++) {
    if (Math.abs(i - mid) > 1) {
      map3Obstacles.push({ x: mid, y: i });
      map3Obstacles.push({ x: i, y: mid });
    }
  }

  // 4. Đường hầm song song (Twin corridors)
  const map4Obstacles: Coordinate[] = [];
  const corridorStart = Math.max(1, Math.floor(size / 4));
  const corridorEnd = size - corridorStart;
  for (let y = corridorStart; y < corridorEnd; y++) {
    map4Obstacles.push({ x: q1, y });
    map4Obstacles.push({ x: q3, y });
  }

  // 5. Pháo đài trung tâm (Center box bunker)
  const map5Obstacles: Coordinate[] = [];
  const boxRadius = Math.max(1, Math.floor(size / 6));
  for (let x = mid - boxRadius; x <= mid + boxRadius; x++) {
    for (let y = mid - boxRadius; y <= mid + boxRadius; y++) {
      // Hollow box with corner/side passages
      if (x === mid - boxRadius || x === mid + boxRadius || y === mid - boxRadius || y === mid + boxRadius) {
        if (x !== mid && y !== mid) {
          map5Obstacles.push({ x, y });
        }
      }
    }
  }

  // 6. Răng cưa góc đối xứng (Zigzag/corner baffles)
  const map6Obstacles: Coordinate[] = [];
  const cornerLen = Math.max(2, Math.floor(size / 3.5));
  for (let i = 0; i < cornerLen; i++) {
    // Top-left
    map6Obstacles.push({ x: i + 1, y: 2 });
    map6Obstacles.push({ x: 2, y: i + 1 });
    // Bottom-right
    map6Obstacles.push({ x: size - 2 - i, y: size - 3 });
    map6Obstacles.push({ x: size - 3, y: size - 2 - i });
  }

  // 7. Ma trận đấu trường (Scattered arena pillars)
  const map7Obstacles: Coordinate[] = [];
  const points = [
    { x: q1, y: q1 },
    { x: q3, y: q1 },
    { x: q1, y: q3 },
    { x: q3, y: q3 },
  ];
  points.forEach((pt) => {
    map7Obstacles.push({ x: pt.x, y: pt.y });
    if (size >= 15) {
      map7Obstacles.push({ x: pt.x + 1, y: pt.y });
      map7Obstacles.push({ x: pt.x, y: pt.y + 1 });
    }
  });

  return [
    {
      id: `${size}_1`,
      gridSize: size,
      layoutIndex: 1,
      layoutName: 'Tự Do (Vô Tận)',
      name: `${size}x${size} - Tự Do`,
      hasBorder: false,
      description: 'Không chướng ngại vật, xuyên màn hình tự do như Nokia nguyên bản.',
      obstacles: map1Obstacles,
    },
    {
      id: `${size}_2`,
      gridSize: size,
      layoutIndex: 2,
      layoutName: 'Rào Bao Quanh',
      name: `${size}x${size} - Rào Bao Quanh`,
      hasBorder: true,
      description: 'Bao bọc bởi tường kiên cố bốn phía, chạm viền sẽ bị xử thua.',
      obstacles: map2Obstacles,
    },
    {
      id: `${size}_3`,
      gridSize: size,
      layoutIndex: 3,
      layoutName: 'Mê Cung Chữ Thập',
      name: `${size}x${size} - Chữ Thập`,
      hasBorder: false,
      description: 'Thanh chắn chữ thập chia sàn đấu thành bốn khu vực điều hướng.',
      obstacles: map3Obstacles,
    },
    {
      id: `${size}_4`,
      gridSize: size,
      layoutIndex: 4,
      layoutName: 'Đường Hầm Song Song',
      name: `${size}x${size} - Song Song`,
      hasBorder: false,
      description: 'Hai hành lang chướng ngại vật thử thách phản xạ luồn lách.',
      obstacles: map4Obstacles,
    },
    {
      id: `${size}_5`,
      gridSize: size,
      layoutIndex: 5,
      layoutName: 'Pháo Đài Trung Tâm',
      name: `${size}x${size} - Pháo Đài`,
      hasBorder: false,
      description: 'Khối chướng ngại vật kiên cố án ngữ ngay tâm bản đồ.',
      obstacles: map5Obstacles,
    },
    {
      id: `${size}_6`,
      gridSize: size,
      layoutIndex: 6,
      layoutName: 'Răng Cưa Góc Đối Xứng',
      name: `${size}x${size} - Răng Cưa`,
      hasBorder: false,
      description: 'Cạm bẫy góc đối xứng hẹp, đòi hỏi người chơi quay đầu chính xác.',
      obstacles: map6Obstacles,
    },
    {
      id: `${size}_7`,
      gridSize: size,
      layoutIndex: 7,
      layoutName: 'Ma Trận Đấu Trường',
      name: `${size}x${size} - Ma Trận`,
      hasBorder: false,
      description: 'Các cụm trụ cản rải đều toàn sàn đấu theo phong cách Arcade.',
      obstacles: map7Obstacles,
    },
  ];
}

// All 28 Maps (4 sizes x 7 layouts)
export const ALL_MAPS: MapObstacleConfig[] = [
  ...generateMapsForSize(10),
  ...generateMapsForSize(12),
  ...generateMapsForSize(15),
  ...generateMapsForSize(20),
];

export const GRID_SIZES: GridSize[] = [10, 12, 15, 20];
export const LAYOUT_NAMES = [
  'Tự Do (Vô Tận)',
  'Rào Bao Quanh',
  'Mê Cung Chữ Thập',
  'Đường Hầm Song Song',
  'Pháo Đài Trung Tâm',
  'Răng Cưa Đối Xứng',
  'Ma Trận Đấu Trường',
];

export function getMapById(id: string): MapObstacleConfig {
  const found = ALL_MAPS.find((m) => m.id === id);
  return found || ALL_MAPS[0];
}

export function getMapsByGridSize(size: GridSize): MapObstacleConfig[] {
  return ALL_MAPS.filter((m) => m.gridSize === size);
}
