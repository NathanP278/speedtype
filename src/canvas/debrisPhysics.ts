export interface AsciiParticle {
  active: boolean;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  bounce: number;
}

const MAX_PARTICLES = 150;
const GRAVITY = 950; // px / sec^2
const FLOOR_FRICTION = 0.72;

export class DebrisPhysicsPool {
  private pool: AsciiParticle[] = [];
  public activeCount: number = 0;

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push({
        active: false,
        char: '',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        vRot: 0,
        alpha: 1,
        color: '#00FF66',
        size: 18,
        life: 0,
        maxLife: 1.2,
        bounce: 0.55,
      });
    }
  }

  public spawn(word: string, originX: number, originY: number, color: string = '#00FF66') {
    const chars = word.split('');
    const stepX = 14;

    chars.forEach((char, idx) => {
      // Find inactive particle in pool
      const p = this.pool.find(item => !item.active);
      if (!p) return;

      const angle = (Math.random() * Math.PI) + Math.PI; // Upward hemisphere
      const speed = 180 + Math.random() * 260;

      p.active = true;
      p.char = char;
      p.x = originX + (idx - chars.length / 2) * stepX;
      p.y = originY;
      p.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 80;
      p.vy = Math.sin(angle) * speed;
      p.rotation = (Math.random() - 0.5) * 0.5;
      p.vRot = (Math.random() - 0.5) * 8.0;
      p.alpha = 1.0;
      p.color = color;
      p.size = 18 + Math.floor(Math.random() * 6);
      p.life = 0;
      p.maxLife = 1.0 + Math.random() * 0.4;
      p.bounce = 0.52 + Math.random() * 0.12;

      this.activeCount++;
    });
  }

  public update(dt: number, boundsWidth: number, boundsHeight: number) {
    if (this.activeCount === 0) return;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.activeCount--;
        continue;
      }

      // Physics integration
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1.0 - (p.life / p.maxLife));

      // Floor collision
      const floorY = boundsHeight - 30;
      if (p.y >= floorY) {
        p.y = floorY;
        p.vy = -p.vy * p.bounce;
        p.vx *= FLOOR_FRICTION;
        p.vRot *= 0.6;
      }

      // Wall boundaries
      if (p.x <= 20) {
        p.x = 20;
        p.vx = -p.vx * 0.7;
      } else if (p.x >= boundsWidth - 20) {
        p.x = boundsWidth - 20;
        p.vx = -p.vx * 0.7;
      }
    }
  }

  public getActiveParticles(): AsciiParticle[] {
    return this.pool.filter(p => p.active);
  }

  public clear() {
    this.pool.forEach(p => { p.active = false; });
    this.activeCount = 0;
  }
}
