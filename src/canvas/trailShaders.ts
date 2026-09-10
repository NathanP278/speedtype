export interface TrailPoint {
  x: number;
  y: number;
  time: number;
  char: string;
}

export interface MatrixColumn {
  x: number;
  y: number;
  chars: string[];
  speed: number;
  alpha: number;
}

const MATRIX_CHARS = '0123456789ABCDEF01アイウエオカキクケコサシスセソタチツテト';

export class TrailRenderer {
  private trailPoints: TrailPoint[] = [];
  private matrixColumns: MatrixColumn[] = [];

  public addKeystroke(x: number, y: number, char: string, trailType: string) {
    const now = performance.now();
    this.trailPoints.push({ x, y, time: now, char });

    if (this.trailPoints.length > 20) {
      this.trailPoints.shift();
    }

    if (trailType === 'matrix') {
      const colChars: string[] = [];
      for (let i = 0; i < 8; i++) {
        colChars.push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
      }
      this.matrixColumns.push({
        x,
        y,
        chars: colChars,
        speed: 120 + Math.random() * 80,
        alpha: 1.0,
      });

      if (this.matrixColumns.length > 25) {
        this.matrixColumns.shift();
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    _width: number,
    height: number,
    trailType: string,
    color: string = '#00FF66'
  ) {
    const now = performance.now();

    // Clean old points
    this.trailPoints = this.trailPoints.filter(p => now - p.time < 600);

    if (trailType === 'lightning') {
      this.renderLightning(ctx, color);
    } else if (trailType === 'matrix') {
      this.renderMatrix(ctx, height, color);
    } else {
      // Default: Neon Ghost
      this.renderNeonGhost(ctx, now, color);
    }
  }

  private renderNeonGhost(ctx: CanvasRenderingContext2D, now: number, color: string) {
    ctx.save();
    ctx.font = 'bold 24px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < this.trailPoints.length; i++) {
      const p = this.trailPoints[i];
      const age = now - p.time;
      const alpha = Math.max(0, 1 - age / 500);

      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      // Chromatic ghost offset
      ctx.fillText(p.char, p.x, p.y - (age * 0.08));
      ctx.fillStyle = '#00FFFF';
      ctx.fillText(p.char, p.x - 2, p.y - (age * 0.08));
      ctx.restore();
    }
    ctx.restore();
  }

  private renderLightning(ctx: CanvasRenderingContext2D, color: string) {
    if (this.trailPoints.length < 2) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];

      // Draw fractal lightning bolt with midpoint displacement
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);

      const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 30;
      const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 30;

      ctx.lineTo(midX, midY);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderMatrix(ctx: CanvasRenderingContext2D, height: number, color: string) {
    ctx.save();
    ctx.font = '14px "IBM Plex Mono", monospace';

    for (let i = this.matrixColumns.length - 1; i >= 0; i--) {
      const col = this.matrixColumns[i];
      col.y += col.speed * 0.016;
      col.alpha -= 0.012;

      if (col.alpha <= 0 || col.y > height) {
        this.matrixColumns.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.textAlign = 'center';

      for (let j = 0; j < col.chars.length; j++) {
        const charY = col.y - (j * 16);
        const charAlpha = Math.max(0, col.alpha * (1 - j / col.chars.length));
        ctx.globalAlpha = charAlpha;

        if (j === 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = color;
          ctx.shadowBlur = 4;
        }

        ctx.fillText(col.chars[j], col.x, charY);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
