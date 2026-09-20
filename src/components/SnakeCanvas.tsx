import React, { useEffect, useRef } from 'react';
import { Coordinate, FoodItem, GameTheme, GridSize, SnakeSkin } from '../types';

interface SnakeCanvasProps {
  gridSize: GridSize;
  snake: Coordinate[];
  direction: string;
  obstacles: Coordinate[];
  hasBorder: boolean;
  foods: FoodItem[];
  theme: GameTheme;
  skin: SnakeSkin;
  hat?: string;
  isAlive: boolean;
  activeEmote?: string;
  sizePx?: number; // optional fixed size, otherwise auto-fill
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  gridSize,
  snake,
  direction,
  obstacles,
  hasBorder,
  foods,
  theme,
  skin,
  hat,
  isAlive,
  activeEmote,
  sizePx,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Animation and particle tick
  useEffect(() => {
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const w = canvas.clientWidth || (canvas.width / pixelRatio);
      const h = canvas.clientHeight || (canvas.height / pixelRatio);
      const cellSize = w / gridSize;

      // 1. Draw Background
      ctx.fillStyle = theme.gridBg;
      ctx.fillRect(0, 0, w, h);

      // 2. Draw Subtle Grid Lines (Nokia LCD Matrix)
      ctx.strokeStyle = theme.gridLine;
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(w, i * cellSize);
        ctx.stroke();
      }

      // 3. Draw Border if hasBorder
      if (hasBorder) {
        ctx.strokeStyle = theme.obstacleColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
      }

      // 4. Draw Obstacles (Brick blocks)
      ctx.fillStyle = theme.obstacleColor;
      obstacles.forEach((obs) => {
        const ox = obs.x * cellSize;
        const oy = obs.y * cellSize;
        // Draw brick pattern
        ctx.fillRect(ox + 1, oy + 1, cellSize - 2, cellSize - 2);

        // Brick inner highlight/shadow for retro look
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(ox + 1, oy + 1, cellSize - 2, 2);
        ctx.fillRect(ox + 1, oy + 1, 2, cellSize - 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(ox + cellSize - 3, oy + 1, 2, cellSize - 2);
        ctx.fillRect(ox + 1, oy + cellSize - 3, cellSize - 2, 2);

        ctx.fillStyle = theme.obstacleColor;
      });

      // 5. Draw Foods
      const pulse = (Math.sin(time / 150) + 1) / 2; // 0..1 for pulsing glow
      foods.forEach((food) => {
        const fx = food.x * cellSize;
        const fy = food.y * cellSize;
        const cx = fx + cellSize / 2;
        const cy = fy + cellSize / 2;

        if (food.type === 'REGULAR') {
          // Circular Food (Mồi thông thường là hình tròn)
          const radius = Math.max(3, (cellSize / 2) - 2);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = theme.foodColor;
          ctx.fill();

          // Subtle retro dot in center
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1.5, radius * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
        } else if (food.type === 'SPECIAL_GROW') {
          // Special Food +3: Square, larger, flashes/pulses with map accent color
          const baseSize = cellSize - 2;
          const growPulse = 2 + pulse * 3;
          const boxSize = Math.min(cellSize + 2, baseSize + growPulse);
          const bx = cx - boxSize / 2;
          const by = cy - boxSize / 2;

          // Outer pulsing glow
          ctx.fillStyle = theme.accentColor;
          ctx.fillRect(bx - 1, by - 1, boxSize + 2, boxSize + 2);

          // Inner square
          ctx.fillStyle = theme.specialGrowColor || '#ffffff';
          ctx.fillRect(bx + 1, by + 1, boxSize - 2, boxSize - 2);

          // Center "+3" or icon badge
          ctx.fillStyle = theme.bg;
          ctx.font = `bold ${Math.max(9, Math.floor(cellSize * 0.45))}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+3', cx, cy);
        } else if (food.type === 'SPECIAL_SHRINK') {
          // Shrink Food: Diamond/triangle retro shape, warns challenging shrink
          const r = (cellSize / 2) - 2;
          ctx.fillStyle = theme.shrinkColor || '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r, cy);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.max(8, Math.floor(cellSize * 0.4))}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('-', cx, cy);
        }
      });

      // 6. Draw Snake
      if (snake.length > 0) {
        const totalLen = snake.length;

        // Mythic Particle Emitters
        if (isAlive && (skin.effect === 'spark' || skin.effect === 'electric')) {
          const head = snake[0];
          const hx = head.x * cellSize + cellSize / 2;
          const hy = head.y * cellSize + cellSize / 2;

          if (skin.effect === 'spark') {
            // Spawn 1-2 fire spark particles
            if (Math.random() < 0.6) {
              particlesRef.current.push({
                x: hx + (Math.random() - 0.5) * cellSize,
                y: hy + (Math.random() - 0.5) * cellSize,
                vx: (Math.random() - 0.5) * 35,
                vy: -20 - Math.random() * 30,
                life: 0.5,
                maxLife: 0.5,
                color: Math.random() > 0.4 ? '#ff5500' : '#ffcc00',
                size: 2 + Math.random() * 3,
              });
            }
          } else if (skin.effect === 'electric') {
            // Electric spark arc
            if (Math.random() < 0.7) {
              particlesRef.current.push({
                x: hx + (Math.random() - 0.5) * cellSize * 1.5,
                y: hy + (Math.random() - 0.5) * cellSize * 1.5,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                life: 0.25,
                maxLife: 0.25,
                color: Math.random() > 0.5 ? '#facc15' : '#38bdf8',
                size: 1.5 + Math.random() * 2.5,
              });
            }
          }
        }

        // Draw segments from tail to head
        for (let i = totalLen - 1; i >= 0; i--) {
          const seg = snake[i];
          const sx = seg.x * cellSize;
          const sy = seg.y * cellSize;
          const isHead = i === 0;
          const isTail = i === totalLen - 1;

          // Fade effect calculation for mythic ghost skin
          let alpha = 1;
          if (skin.effect === 'fade') {
            // Ethereal gradient alpha towards tail
            alpha = Math.max(0.25, 1 - (i / totalLen) * 0.75);
          }

          ctx.save();
          ctx.globalAlpha = alpha;

          if (isHead) {
            // Head block
            ctx.fillStyle = isAlive ? skin.headColor : '#71717a';
            ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

            // Head inner border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3);

            // Eyes based on direction
            const eyeSize = Math.max(2, Math.floor(cellSize * 0.22));
            ctx.fillStyle = isAlive ? '#ffffff' : '#000000';

            let eye1 = { x: sx + cellSize * 0.25, y: sy + cellSize * 0.25 };
            let eye2 = { x: sx + cellSize * 0.75, y: sy + cellSize * 0.25 };

            if (direction === 'DOWN') {
              eye1 = { x: sx + cellSize * 0.25, y: sy + cellSize * 0.75 };
              eye2 = { x: sx + cellSize * 0.75, y: sy + cellSize * 0.75 };
            } else if (direction === 'LEFT') {
              eye1 = { x: sx + cellSize * 0.25, y: sy + cellSize * 0.25 };
              eye2 = { x: sx + cellSize * 0.25, y: sy + cellSize * 0.75 };
            } else if (direction === 'RIGHT') {
              eye1 = { x: sx + cellSize * 0.75, y: sy + cellSize * 0.25 };
              eye2 = { x: sx + cellSize * 0.75, y: sy + cellSize * 0.75 };
            }

            ctx.fillRect(eye1.x - eyeSize / 2, eye1.y - eyeSize / 2, eyeSize, eyeSize);
            ctx.fillRect(eye2.x - eyeSize / 2, eye2.y - eyeSize / 2, eyeSize, eyeSize);

            // Pupil
            ctx.fillStyle = isAlive ? '#000000' : '#ef4444';
            const pupilSize = Math.max(1, eyeSize / 2);
            ctx.fillRect(eye1.x - pupilSize / 2, eye1.y - pupilSize / 2, pupilSize, pupilSize);
            ctx.fillRect(eye2.x - pupilSize / 2, eye2.y - pupilSize / 2, pupilSize, pupilSize);

            // Draw Hat / Accessory if equipped
            const activeHat = hat || skin.hat;
            if (activeHat && activeHat !== 'none' && isAlive) {
              const hx = sx + cellSize / 2;
              const hy = sy + cellSize * 0.15;
              ctx.font = `${Math.floor(cellSize * 0.55)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              let emoji = '';
              if (activeHat === 'crown') emoji = '👑';
              else if (activeHat === 'glasses') emoji = '🕶️';
              else if (activeHat === 'cap') emoji = '🧢';
              else if (activeHat === 'horns') emoji = '😈';
              if (emoji) {
                ctx.fillText(emoji, hx, hy);
              }
            }
          } else {
            // Body / Tail segments
            ctx.fillStyle = isAlive ? (isTail ? skin.tailColor : skin.bodyColor) : '#52525b';
            ctx.fillRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3);

            // Body pattern
            if (skin.pattern === 'stripes' && i % 2 === 0) {
              ctx.fillStyle = 'rgba(0,0,0,0.2)';
              ctx.fillRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3);
            } else if (skin.pattern === 'dots') {
              ctx.fillStyle = 'rgba(255,255,255,0.25)';
              ctx.beginPath();
              ctx.arc(sx + cellSize / 2, sy + cellSize / 2, cellSize * 0.18, 0, Math.PI * 2);
              ctx.fill();
            } else if (skin.pattern === 'glow') {
              ctx.strokeStyle = 'rgba(255,255,255,0.4)';
              ctx.lineWidth = 1;
              ctx.strokeRect(sx + 2.5, sy + 2.5, cellSize - 5, cellSize - 5);
            }
          }

          ctx.restore();
        }

        // Draw Mythic Electric Bolts between segments if electric skin
        if (isAlive && skin.effect === 'electric') {
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < Math.min(snake.length - 1, 8); i++) {
            const s1 = snake[i];
            const s2 = snake[i + 1];
            const jitterX = (Math.random() - 0.5) * (cellSize * 0.35);
            const jitterY = (Math.random() - 0.5) * (cellSize * 0.35);
            ctx.moveTo(s1.x * cellSize + cellSize / 2, s1.y * cellSize + cellSize / 2);
            ctx.lineTo(
              (s1.x + s2.x) * cellSize * 0.5 + cellSize / 2 + jitterX,
              (s1.y + s2.y) * cellSize * 0.5 + cellSize / 2 + jitterY
            );
            ctx.lineTo(s2.x * cellSize + cellSize / 2, s2.y * cellSize + cellSize / 2);
          }
          ctx.stroke();
        }
      }

      // 7. Update and Draw Particles
      for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
        const p = particlesRef.current[pIdx];
        p.life -= dt;
        if (p.life <= 0) {
          particlesRef.current.splice(pIdx, 1);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
      }

      // 8. Draw Active Emote Overlay if present
      if (activeEmote && snake.length > 0) {
        const head = snake[0];
        const hx = head.x * cellSize + cellSize / 2;
        const hy = head.y * cellSize - 6;

        ctx.font = `${Math.max(16, Math.floor(cellSize * 1.2))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(activeEmote, hx, hy);
        ctx.shadowBlur = 0;
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gridSize, snake, direction, obstacles, hasBorder, foods, theme, skin, hat, isAlive, activeEmote]);

  // Handle canvas sizing dynamically without overflowing mobile viewports
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;

      // Available square dimension inside container with small margin for crisp border
      const availableSize = Math.floor(Math.min(w, h)) - 4;
      if (availableSize <= 0) return;

      const targetSize = sizePx || Math.max(30, availableSize);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      // Set actual canvas pixels with devicePixelRatio for crisp retro pixels
      canvas.width = Math.floor(targetSize * pixelRatio);
      canvas.height = Math.floor(targetSize * pixelRatio);
      canvas.style.width = `${targetSize}px`;
      canvas.style.height = `${targetSize}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false; // authentic pixel crispness!
      }
    };

    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, [sizePx]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="rounded-none shadow-inner border border-black/30"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
