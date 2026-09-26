/**
 * saudade — 触れようとすると消える光
 *
 * 光の粒子が「誰か」の輪郭を形づくる。
 * 手を近づけるほど光は遠のき、ピントを失う。触れた瞬間、形は散って二度と戻らない。
 * 再び現れる形は、いつも少しだけ違う。
 */

type Rgb = readonly [number, number, number];

const WARM_PALETTE: readonly Rgb[] = [
  [255, 196, 140],
  [255, 172, 118],
  [255, 222, 188],
  [244, 152, 132],
];

const BACKGROUND = "rgba(4, 3, 8, 0.22)";

type Phase = "forming" | "present" | "gone";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hx: number;
  hy: number;
  a: number;
  bright: number;
  size: number;
  color: number;
  phase: number;
  bound: boolean;
  /** 漂う粒子が消えるまでの残り時間（秒）*/
  life: number;
  maxLife: number;
};

type Form = {
  points: Float32Array;
  cx: number;
  cy: number;
  radius: number;
};

export type Hand = { x: number; y: number; strength: number };

export type EngineOptions = {
  onMoment?: (time: Date) => void;
};

function makeSprite(rgb: Rgb): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  const [r, gr, b] = rgb;
  g.addColorStop(0, `rgba(255, 250, 240, 1)`);
  g.addColorStop(0.18, `rgba(${r}, ${gr}, ${b}, 0.85)`);
  g.addColorStop(0.5, `rgba(${r}, ${gr}, ${b}, 0.18)`);
  g.addColorStop(1, `rgba(${r}, ${gr}, ${b}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/** 人の上半身のシルエット。毎回わずかに違う比率で描く。*/
function drawFigure(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  height: number,
  lean: number,
  rand: () => number,
) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.rotate(lean);

  const headR = height * 0.105 * (0.9 + rand() * 0.2);
  const headY = -height + headR;
  const headX = height * 0.02 * (rand() - 0.5);
  const shoulder = height * 0.25 * (0.88 + rand() * 0.24);
  const shoulderY = headY + headR * 2.1;

  ctx.beginPath();
  ctx.ellipse(headX, headY, headR * 0.9, headR, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(-headR * 0.42, headY, headR * 0.84, headR * 2.4);

  ctx.beginPath();
  ctx.moveTo(-shoulder * 0.3, shoulderY - headR * 0.35);
  ctx.quadraticCurveTo(-shoulder, shoulderY - headR * 0.1, -shoulder * 1.05, shoulderY + height * 0.2);
  ctx.lineTo(-shoulder * 0.98, 0);
  ctx.lineTo(shoulder * 0.98, 0);
  ctx.lineTo(shoulder * 1.05, shoulderY + height * 0.2);
  ctx.quadraticCurveTo(shoulder, shoulderY - headR * 0.1, shoulder * 0.3, shoulderY - headR * 0.35);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function sampleForm(width: number, height: number, rand: () => number): Form {
  const scale = 4;
  const sw = Math.max(1, Math.ceil(width / scale));
  const sh = Math.max(1, Math.ceil(height / scale));
  const off = document.createElement("canvas");
  off.width = sw;
  off.height = sh;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";

  const together = rand() < 0.5;
  const figH = Math.min(sh * 0.66, sw * (together ? 0.8 : 1.1));
  const baseY = sh * 0.94;
  const cx = sw / 2;

  if (together) {
    // 寄り添う二人。ほんの少しだけ、触れ合わない距離。
    const gap = figH * (0.27 + rand() * 0.05);
    drawFigure(ctx, cx - gap, baseY, figH * (0.96 + rand() * 0.06), 0.06 + rand() * 0.05, rand);
    drawFigure(ctx, cx + gap, baseY, figH * (0.88 + rand() * 0.06), -0.05 - rand() * 0.05, rand);
  } else {
    drawFigure(ctx, cx + (rand() - 0.5) * sw * 0.08, baseY, figH, (rand() - 0.5) * 0.08, rand);
  }

  const data = ctx.getImageData(0, 0, sw, sh).data;
  const pts: number[] = [];
  let minY = sh;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3] > 128) {
        pts.push(x, y);
        if (y < minY) minY = y;
      }
    }
  }

  // 足元に向かって薄れていくように間引く
  const fadeTop = minY + (baseY - minY) * 0.55;
  const points: number[] = [];
  for (let i = 0; i < pts.length; i += 2) {
    const y = pts[i + 1];
    if (rand() > 1 - smoothstep(fadeTop, baseY, y) * 0.92) continue;
    points.push(pts[i] * scale, y * scale);
  }

  const topY = minY * scale;
  const bottomY = baseY * scale;
  return {
    points: new Float32Array(points),
    cx: width / 2,
    cy: topY + (bottomY - topY) * 0.42,
    radius: Math.max((bottomY - topY) * 0.5, figH * scale * (together ? 0.55 : 0.4)),
  };
}

export class SaudadeEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites: HTMLCanvasElement[];
  private readonly options: EngineOptions;

  private width = 0;
  private height = 0;
  private dpr = 1;

  private particles: Particle[] = [];
  private dust: Particle[] = [];
  private form: Form | null = null;
  private targetCount = 0;

  private phase: Phase = "gone";
  private phaseTime = 0;
  private time = 0;
  private lastFrame = 0;

  private hand: Hand | null = null;
  private smoothHand = { x: 0, y: 0, strength: 0 };
  private nearness = 0;
  private presence = 0;
  private dwell = 0;
  private calm = 0;
  private residue = 0;
  private appliedBlur = -1;

  constructor(canvas: HTMLCanvasElement, options: EngineOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sprites = WARM_PALETTE.map(makeSprite);
    this.options = options;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(dpr, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.ctx.fillStyle = "rgb(4, 3, 8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const area = width * height;
    this.targetCount = Math.round(Math.min(4200, Math.max(1600, area / 260)));
    this.dust = Array.from({ length: Math.round(Math.min(160, area / 9000)) }, () => this.makeDust());

    // 画面サイズが変わったら、新しい形として生まれ直す
    this.particles = [];
    this.form = null;
    this.phase = "gone";
    this.phaseTime = 10;
    this.calm = 10;
  }

  setHand(hand: Hand | null) {
    this.hand = hand;
  }

  /** 触れようとした。形がそこにあれば、散っていく。*/
  touch(x: number, y: number) {
    if (!this.form || this.phase === "gone") return;
    const d = Math.hypot(x - this.form.cx, y - this.form.cy);
    if (d > this.form.radius * 1.35) return;
    this.dissolve(x, y);
  }

  frame(now: number) {
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 1 / 30) : 1 / 60;
    this.lastFrame = now;
    this.step(dt);
    this.render();
  }

  private rand = Math.random;

  private makeDust(): Particle {
    return {
      x: this.rand() * this.width,
      y: this.rand() * this.height,
      vx: (this.rand() - 0.5) * 6,
      vy: -2 - this.rand() * 6,
      hx: 0,
      hy: 0,
      a: this.rand(),
      bright: 0.08 + this.rand() * 0.16,
      size: 2 + this.rand() * 5,
      color: Math.floor(this.rand() * WARM_PALETTE.length),
      phase: this.rand() * Math.PI * 2,
      bound: false,
      life: 0,
      maxLife: 0,
    };
  }

  private pickHome(p: Particle) {
    const pts = this.form!.points;
    const n = pts.length / 2;
    const i = Math.floor(this.rand() * n) * 2;
    p.hx = pts[i] + (this.rand() - 0.5) * 5;
    p.hy = pts[i + 1] + (this.rand() - 0.5) * 5;
  }

  private makeBound(x: number, y: number): Particle {
    const bokeh = this.rand() < 0.04;
    const p: Particle = {
      x,
      y,
      vx: 0,
      vy: 0,
      hx: 0,
      hy: 0,
      a: 0,
      bright: bokeh ? 0.08 + this.rand() * 0.1 : 0.3 + this.rand() * 0.7,
      size: bokeh ? 16 + this.rand() * 18 : 3 + this.rand() * 6,
      color: Math.floor(this.rand() * WARM_PALETTE.length),
      phase: this.rand() * Math.PI * 2,
      bound: true,
      life: 0,
      maxLife: 0,
    };
    this.pickHome(p);
    return p;
  }

  /** 新しい形として生まれる。前と同じ形には、二度とならない。*/
  private reform() {
    this.form = sampleForm(this.width, this.height, this.rand);
    if (this.form.points.length === 0) return;
    const survivors = this.particles.filter((p) => !p.bound);
    const born: Particle[] = [];
    for (let i = 0; i < this.targetCount; i++) {
      const angle = this.rand() * Math.PI * 2;
      const r = this.form.radius * (0.6 + this.rand() * 1.6);
      born.push(
        this.makeBound(this.form.cx + Math.cos(angle) * r, this.form.cy + Math.sin(angle) * r),
      );
    }
    this.particles = survivors.concat(born);
    this.phase = "forming";
    this.phaseTime = 0;
  }

  private detach(p: Particle, vx: number, vy: number, life: number) {
    p.bound = false;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
  }

  private dissolve(x: number, y: number) {
    for (const p of this.particles) {
      if (!p.bound) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 30 + this.rand() * 140;
      this.detach(
        p,
        (dx / d) * speed + (this.rand() - 0.5) * 40,
        (dy / d) * speed * 0.6 - 20 - this.rand() * 50,
        2.5 + this.rand() * 5,
      );
    }
    this.phase = "gone";
    this.phaseTime = 0;
    this.calm = 0;
    this.dwell = 0;
    this.residue = 1;
    this.options.onMoment?.(new Date());
  }

  private step(dt: number) {
    this.time += dt;
    this.phaseTime += dt;
    const t = this.time;

    // 手の気配（なめらかに追従）
    const h = this.hand;
    const sh = this.smoothHand;
    if (h) {
      const k = 1 - Math.exp(-dt * 14);
      if (sh.strength < 0.01) {
        sh.x = h.x;
        sh.y = h.y;
      }
      sh.x += (h.x - sh.x) * k;
      sh.y += (h.y - sh.y) * k;
      sh.strength += (h.strength - sh.strength) * (1 - Math.exp(-dt * 6));
    } else {
      sh.strength *= Math.exp(-dt * 3);
    }

    // 手が形に近づくほど、光は遠のく
    let near = 0;
    if (this.form && sh.strength > 0.01) {
      const d = Math.hypot(sh.x - this.form.cx, sh.y - this.form.cy);
      near = clamp01(1 - (d - this.form.radius * 0.35) / (this.form.radius * 1.7)) * sh.strength;
    }
    this.nearness += (near - this.nearness) * (1 - Math.exp(-dt * 4));

    if (this.phase === "gone") {
      this.calm = this.nearness < 0.15 ? this.calm + dt : 0;
      if (this.phaseTime > 4 && this.calm > 2.5) this.reform();
    } else {
      if (this.phase === "forming" && this.phaseTime > 4.5) this.phase = "present";
      // センサー越しの手が、形の中心にとどまったら「触れた」とみなす
      if (this.hand && this.hand.strength < 1 && this.nearness > 0.75) {
        this.dwell += dt;
        if (this.dwell > 0.7) this.dissolve(sh.x, sh.y);
      } else {
        this.dwell = Math.max(0, this.dwell - dt);
      }
    }

    const fadeIn = this.phase === "forming" ? smoothstep(0, 4.5, this.phaseTime) : 1;
    const targetPresence = this.phase === "gone" ? 0 : fadeIn * (1 - 0.85 * Math.pow(this.nearness, 1.2));
    this.presence += (targetPresence - this.presence) * (1 - Math.exp(-dt * 5));
    this.residue = Math.max(0, this.residue - dt / 18);

    const blur = this.phase === "gone" ? 0 : Math.pow(this.nearness, 1.5) * 18;
    if (Math.abs(blur - this.appliedBlur) > 0.15) {
      this.appliedBlur = blur;
      this.canvas.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";
    }

    const forming = this.phase === "forming";
    const spring = forming ? 2.2 + this.phaseTime * 3 : 16;
    const damping = forming ? 2.4 : 6;
    const breath = 1 + Math.sin(t * 0.4) * 0.01;
    const erosion = this.phase === "present" ? 0.012 : 0;
    const handR = 110 + this.nearness * 80;
    const cx = this.form?.cx ?? 0;
    const cy = this.form?.cy ?? 0;

    const next: Particle[] = [];
    for (const p of this.particles) {
      if (p.bound) {
        // いまこの瞬間にも、少しずつこぼれ落ちていく
        if (this.rand() < erosion * dt) {
          this.detach(p, (this.rand() - 0.5) * 20, -10 - this.rand() * 25, 3 + this.rand() * 3);
          const q = this.makeBound(0, 0);
          q.x = q.hx + (this.rand() - 0.5) * 80;
          q.y = q.hy + (this.rand() - 0.5) * 80;
          next.push(q);
        } else {
          const hx = cx + (p.hx - cx) * breath + Math.sin(t * 0.7 + p.phase) * 1.6;
          const hy = cy + (p.hy - cy) * breath + Math.cos(t * 0.6 + p.phase * 1.3) * 1.6;
          let ax = (hx - p.x) * spring - p.vx * damping;
          let ay = (hy - p.y) * spring - p.vy * damping;
          if (sh.strength > 0.01) {
            const dx = p.x - sh.x;
            const dy = p.y - sh.y;
            const d = Math.hypot(dx, dy);
            if (d < handR && d > 0.001) {
              const f = (1 - d / handR) ** 2 * 2600 * sh.strength;
              ax += (dx / d) * f;
              ay += (dy / d) * f;
            }
          }
          p.vx += ax * dt;
          p.vy += ay * dt;
          p.a = Math.min(1, p.a + dt * 0.8);
        }
      }
      if (!p.bound) {
        p.vx += Math.sin(p.y * 0.012 + t * 0.7 + p.phase) * 14 * dt;
        p.vy -= 10 * dt;
        p.vx *= Math.exp(-dt * 0.6);
        p.vy *= Math.exp(-dt * 0.6);
        p.life -= dt;
        if (p.life <= 0) continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      next.push(p);
    }
    this.particles = next;

    for (const d of this.dust) {
      d.x += (d.vx + Math.sin(t * 0.3 + d.phase) * 4) * dt;
      d.y += d.vy * dt;
      d.a = 0.5 + 0.5 * Math.sin(t * 0.5 + d.phase);
      if (d.y < -20) {
        d.y = this.height + 20;
        d.x = this.rand() * this.width;
      }
      if (d.x < -20) d.x = this.width + 20;
      if (d.x > this.width + 20) d.x = -20;
    }
  }

  private render() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.globalCompositeOperation = "lighter";

    // かつてそこにいた、という温もりだけが残る
    if (this.form) {
      const glow = this.residue * 0.14 + this.presence * 0.07;
      if (glow > 0.003) {
        const r = this.form.radius * 1.5 * dpr;
        const g = ctx.createRadialGradient(
          this.form.cx * dpr,
          this.form.cy * dpr,
          0,
          this.form.cx * dpr,
          this.form.cy * dpr,
          r,
        );
        g.addColorStop(0, `rgba(255, 150, 90, ${glow})`);
        g.addColorStop(1, "rgba(255, 150, 90, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    for (const d of this.dust) {
      ctx.globalAlpha = d.a * d.bright;
      const s = d.size * dpr;
      ctx.drawImage(this.sprites[d.color], d.x * dpr - s / 2, d.y * dpr - s / 2, s, s);
    }

    for (const p of this.particles) {
      let alpha: number;
      if (p.bound) {
        alpha = p.a * p.bright * this.presence;
      } else {
        const lifeT = p.life / p.maxLife;
        alpha = p.bright * lifeT * lifeT;
      }
      if (alpha < 0.01) continue;
      ctx.globalAlpha = Math.min(1, alpha);
      const s = p.size * dpr;
      ctx.drawImage(this.sprites[p.color], p.x * dpr - s / 2, p.y * dpr - s / 2, s, s);
    }

    // 鑑賞者の手の気配
    const sh = this.smoothHand;
    if (sh.strength > 0.02) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.18 * sh.strength;
      ctx.strokeStyle = "rgb(200, 215, 255)";
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.arc(sh.x * dpr, sh.y * dpr, (14 + Math.sin(this.time * 2) * 2) * dpr, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
