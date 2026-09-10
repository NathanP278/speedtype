import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { DebrisPhysicsPool } from './debrisPhysics.ts';

export interface AsciiDebrisCanvasHandle {
  spawnWordExplosion: (word: string, x: number, y: number, color?: string) => void;
}

export const AsciiDebrisCanvas = forwardRef<AsciiDebrisCanvasHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poolRef = useRef<DebrisPhysicsPool>(new DebrisPhysicsPool());
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isLoopingRef = useRef<boolean>(false);

  const startRenderLoop = () => {
    if (isLoopingRef.current) return;
    isLoopingRef.current = true;
    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05); // Cap delta to 50ms
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pool = poolRef.current;
      pool.update(dt, canvas.width, canvas.height);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = pool.getActiveParticles();
      if (particles.length > 0) {
        ctx.font = 'bold 20px "IBM Plex Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillText(p.char, 0, 0);
          ctx.restore();
        }

        animFrameIdRef.current = requestAnimationFrame(loop);
      } else {
        // Sleep animation loop when zero active particles
        isLoopingRef.current = false;
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  useImperativeHandle(ref, () => ({
    spawnWordExplosion: (word: string, x: number, y: number, color: string = '#00FF66') => {
      poolRef.current.spawn(word, x, y, color);
      startRenderLoop();
    },
  }));

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
});

AsciiDebrisCanvas.displayName = 'AsciiDebrisCanvas';
