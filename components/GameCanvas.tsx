'use client';

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '@/lib/gameEngine';
import { CANVAS_VIRTUAL_HEIGHT, CANVAS_VIRTUAL_WIDTH } from '@/lib/gameConstants';

interface GameCanvasProps {
  engine: GameEngine;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaMs = Math.min(currentTime - lastTime, 50); // Hindari lonjakan lag delta
      lastTime = currentTime;

      // 1. Update Game Loop
      engine.update(deltaMs);

      // 2. Render Frame
      engine.render(ctx, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_VIRTUAL_WIDTH}
        height={CANVAS_VIRTUAL_HEIGHT}
        className="w-full h-full object-contain shadow-2xl block"
        style={{
          aspectRatio: '9/16',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};
