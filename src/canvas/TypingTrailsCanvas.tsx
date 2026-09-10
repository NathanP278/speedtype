import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TrailRenderer } from './trailShaders.ts';

export interface TypingTrailsHandle {
  addKeystroke: (x: number, y: number, char: string) => void;
}

interface TypingTrailsCanvasProps {
  trailType: string;
  themeColor?: string;
}

export const TypingTrailsCanvas = forwardRef<TypingTrailsHandle, TypingTrailsCanvasProps>(
  ({ trailType, themeColor = '#00FF66' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<TrailRenderer>(new TrailRenderer());
    const animIdRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      addKeystroke: (x: number, y: number, char: string) => {
        rendererRef.current.addKeystroke(x, y, char, trailType);
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const loop = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          rendererRef.current.render(ctx, canvas.width, canvas.height, trailType, themeColor);
        }
        animIdRef.current = requestAnimationFrame(loop);
      };

      animIdRef.current = requestAnimationFrame(loop);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      };
    }, [trailType, themeColor]);

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-30"
        style={{ width: '100vw', height: '100vh' }}
      />
    );
  }
);

TypingTrailsCanvas.displayName = 'TypingTrailsCanvas';
