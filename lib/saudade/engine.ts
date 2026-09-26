/**
 * saudade — 触れようとすると消える光
 *
 * 光の粒子が「誰か」の輪郭を形づくる。その人は、記憶の回廊の中に立っている。
 * 手を近づけるほど光は遠のき、ピントを失う。触れた瞬間、形は散って二度と戻らない。
 * 再び現れる形は、いつも少しだけ違い、少しだけ遠く、少しだけ色褪せている。
 * 何度も失ううちに、その人はもう戻らなくなる。回廊には、静けさだけが残る。
 */

import type { MemoryVeil } from "./memory";

type Rgb = readonly [number, number, number];

const WARM_PALETTE: readonly Rgb[] = [
  [255, 196, 140],
  [255, 172, 118],
  [255, 222, 188],
  [244, 152, 132],
];

/** 遠い記憶ほど、温度を失っていく */
const COOL_PALETTE: readonly Rgb[] = [
  [196, 206, 236],
  [214, 204, 226],
  [226, 228, 240],
  [180, 196, 222],
];

/** 残像を少しずつ消す。背景色は CSS 側で重ねる（キャンバスは純粋な黒）*/
const FADE = "rgba(0, 0, 0, 0.22)";
/**
 * 8bit の半透明塗りだけでは暗い残像が 1〜2 階調残り続け、線の跡になる。
 * 毎フレーム 1 階調ずつ差し引いて、完全な黒まで戻す。
 */
const FLOOR = "rgb(1, 1, 1)";

type Phase = "forming" | "present" | "gone";

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  hx: number;
  hy: number;
  /** 体の厚みの中での前後位置 */
  dz: number;
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
  /** x, y, 体の厚みの半分 — の三つ組 */
  points: Float32Array;
  cx: number;
  cy: number;
  radius: number;
  floorY: number;
  twin: boolean;
};

/** 回廊を見るカメラ。z は奥行き（画面の奥が正）*/
export type Camera = {
  /** 視点のずれ（奥のものほど、この分だけずれて見える）*/
  x: number;
  y: number;
  /** 焦点距離。大きいほど遠近が穏やか */
  depth: number;
  /** 消失点 */
  cx: number;
  horizon: number;
};

export type Projected = { x: number; y: number; s: number };

export function project(cam: Camera, x: number, y: number, z: number): Projected {
  const s = cam.depth / (cam.depth + Math.max(z, -cam.depth * 0.85));
  return {
    x: cam.cx + (x - cam.cx) * s + cam.x * (1 - s),
    y: cam.horizon + (y - cam.horizon) * s + cam.y * (1 - s),
    s,
  };
}

export type Hand = { x: number; y: number; strength: number };

/** マイクから届く音。どちらも 0..1 */
export type Sound = { voice: number; breath: number };

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
  const figH = Math.min(sh * 0.62, sw * (together ? 0.8 : 1.1));
  const baseY = Math.min(sh * 0.92, sh / 2 + figH * 0.62);
  const cx = sw / 2;
  const axes: number[] = [];

  if (together) {
    // 寄り添う二人。ほんの少しだけ、触れ合わない距離。
    const gap = figH * (0.27 + rand() * 0.05);
    drawFigure(ctx, cx - gap, baseY, figH * (0.96 + rand() * 0.06), 0.06 + rand() * 0.05, rand);
    drawFigure(ctx, cx + gap, baseY, figH * (0.88 + rand() * 0.06), -0.05 - rand() * 0.05, rand);
    axes.push(cx - gap, cx + gap);
  } else {
    const x = cx + (rand() - 0.5) * sw * 0.08;
    drawFigure(ctx, x, baseY, figH, (rand() - 0.5) * 0.08, rand);
    axes.push(x);
  }

  const data = ctx.getImageData(0, 0, sw, sh).data;
  const pts: number[] = [];
  let minY = sh;
  // 行ごと・人ごとの左右の広がり。体の厚みを見積もるのに使う
  const extents = new Map<number, [number, number]>();
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3] > 128) {
        pts.push(x, y);
        if (y < minY) minY = y;
        const a = axes.length > 1 && Math.abs(x - axes[1]) < Math.abs(x - axes[0]) ? 1 : 0;
        const key = y * 2 + a;
        const e = extents.get(key);
        if (e) {
          e[0] = Math.min(e[0], x);
          e[1] = Math.max(e[1], x);
        } else {
          extents.set(key, [x, x]);
        }
      }
    }
  }

  // 足元に向かって薄れていくように間引く
  const fadeTop = minY + (baseY - minY) * 0.55;
  const points: number[] = [];
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i];
    const y = pts[i + 1];
    if (rand() > 1 - smoothstep(fadeTop, baseY, y) * 0.92) continue;
    const a = axes.length > 1 && Math.abs(x - axes[1]) < Math.abs(x - axes[0]) ? 1 : 0;
    const e = extents.get(y * 2 + a)!;
    // 胴は横幅の半分ほど、頭は丸く — 体の断面をゆるい楕円とみなす
    const half = (e[1] - e[0]) / 2;
    const off = x - (e[0] + e[1]) / 2;
    const depth = Math.sqrt(Math.max(0, half * half - off * off)) * 0.62;
    points.push(x * scale, y * scale, depth * scale);
  }

  const topY = minY * scale;
  const bottomY = baseY * scale;
  return {
    points: new Float32Array(points),
    cx: width / 2,
    cy: topY + (bottomY - topY) * 0.42,
    radius: Math.max((bottomY - topY) * 0.5, figH * scale * (together ? 0.55 : 0.4)),
    floorY: bottomY,
    twin: together,
  };
}

export class SaudadeEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites: HTMLCanvasElement[];
  private readonly veil: MemoryVeil | null;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private cam: Camera = { x: 0, y: 0, depth: 1000, cx: 0, horizon: 0 };

  private particles: Particle[] = [];
  private dust: Particle[] = [];
  private form: Form | null = null;
  private targetCount = 0;

  private phase: Phase = "gone";
  private phaseTime = 0;
  private time = 0;
  private lastFrame = 0;

  /** その人が立っている奥行き。戻るたびに、少しずつ遠くなる */
  private formZ = 0;
  private baseZ = 0;
  private returns = 0;
  private maxReturns = 5;
  /** 温度。戻るたびに、色が褪せていく（1 → 0）*/
  private warmth = 1;
  private angle = 0;

  private hand: Hand | null = null;
  private smoothHand = { x: 0, y: 0, strength: 0 };
  private nearness = 0;
  private presence = 0;
  private dwell = 0;
  private calm = 0;
  private residue = 0;
  private appliedBlur = -1;

  private sound: Sound = { voice: 0, breath: 0 };
  private voice = 0;
  private blow = 0;
  /** 呼びかけるほど回廊の奥へ歩き去る（0..1）。静かにしていると、ゆっくり戻る */
  private recede = 0;
  private blowTime = 0;

  constructor(canvas: HTMLCanvasElement, veil: MemoryVeil | null = null) {
    this.canvas = canvas;
    this.veil = veil;
    this.ctx = canvas.getContext("2d")!;
    this.sprites = WARM_PALETTE.concat(COOL_PALETTE).map(makeSprite);
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(dpr, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.cam = { x: 0, y: 0, depth: Math.max(width, height) * 1.1, cx: width / 2, horizon: height * 0.42 };
    this.veil?.resize(width, height, dpr, this.cam);
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const area = width * height;
    this.targetCount = Math.round(Math.min(4200, Math.max(1600, area / 260)));
    this.dust = Array.from({ length: Math.round(Math.min(220, area / 6000)) }, () => this.makeDust());

    // 画面サイズが変わったら、はじめからやり直す
    this.particles = [];
    this.form = null;
    this.phase = "gone";
    this.phaseTime = 10;
    this.calm = 10;
    this.returns = 0;
    this.warmth = 1;
    this.baseZ = 0;
    this.formZ = 0;
  }

  setHand(hand: Hand | null) {
    this.hand = hand;
  }

  setSound(sound: Sound | null) {
    this.sound = sound ?? { voice: 0, breath: 0 };
  }

  private formCenter(): Projected | null {
    if (!this.form) return null;
    return project(this.cam, this.form.cx, this.form.cy, this.formZ);
  }

  /** 触れようとした。形がそこにあれば、散っていく。*/
  touch(x: number, y: number) {
    const c = this.formCenter();
    if (!c || !this.form || this.phase === "gone") return;
    const d = Math.hypot(x - c.x, y - c.y);
    if (d > this.form.radius * c.s * 1.35) return;
    this.dissolve(x, y);
  }

  frame(now: number) {
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 1 / 15) : 1 / 60;
    this.lastFrame = now;
    this.step(dt);
    if (this.veil) {
      const f = this.form;
      this.veil.render(
        dt,
        this.time,
        this.cam,
        {
          x: f?.cx ?? this.width / 2,
          y: f?.cy ?? this.height / 2,
          z: this.formZ,
          radius: f?.radius ?? Math.min(this.width, this.height) * 0.3,
          // 人がそこにいる間だけ、記憶は照らされる。消えたあとは温もりの分だけ
          intensity: this.presence + this.residue * 0.5,
          warmth: this.warmth,
        },
        this.smoothHand.strength > 0.01 ? this.smoothHand : null,
        this.blow,
      );
    }
    this.render();
  }

  private rand = Math.random;

  private makeDust(): Particle {
    const d = this.cam.depth;
    return {
      x: (this.rand() * 1.6 - 0.3) * this.width,
      y: this.rand() * this.height,
      z: -d * 0.6 + this.rand() * d * 3.4,
      vx: (this.rand() - 0.5) * 6,
      vy: -2 - this.rand() * 6,
      vz: (this.rand() - 0.5) * 8,
      hx: 0,
      hy: 0,
      dz: 0,
      a: this.rand(),
      bright: 0.06 + this.rand() * 0.14,
      size: 2 + this.rand() * 4,
      color: Math.floor(this.rand() * WARM_PALETTE.length),
      phase: this.rand() * Math.PI * 2,
      bound: false,
      life: 0,
      maxLife: 0,
    };
  }

  private pickHome(p: Particle) {
    const pts = this.form!.points;
    const n = pts.length / 3;
    const i = Math.floor(this.rand() * n) * 3;
    p.hx = pts[i] + (this.rand() - 0.5) * 5;
    p.hy = pts[i + 1] + (this.rand() - 0.5) * 5;
    // 光は体の表面に多く、内側にはまばらに
    const half = pts[i + 2];
    const r = this.rand();
    p.dz = r < 0.7 ? (this.rand() < 0.5 ? -1 : 1) * half * (0.75 + this.rand() * 0.25) : (r * 2 - 1) * half;
  }

  private makeBound(x: number, y: number, z: number): Particle {
    const bokeh = this.rand() < 0.04;
    const p: Particle = {
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      hx: 0,
      hy: 0,
      dz: 0,
      a: 0,
      bright: bokeh ? 0.08 + this.rand() * 0.1 : 0.3 + this.rand() * 0.7,
      size: bokeh ? 16 + this.rand() * 18 : 3 + this.rand() * 6,
      // 戻るたびに、冷たい色の粒が増えていく
      color: Math.floor(this.rand() * 4) + (this.rand() < this.warmth ? 0 : 4),
      phase: this.rand() * Math.PI * 2,
      bound: true,
      life: 0,
      maxLife: 0,
    };
    this.pickHome(p);
    return p;
  }

  /** 新しい形として生まれる。前と同じ形には、二度とならない。そして、前より少し遠い。*/
  private reform() {
    if (this.returns >= this.maxReturns) {
      // もう戻らない。長い静けさのあと、手前に、別の誰かが現れる
      this.returns = 0;
      this.maxReturns = 4 + Math.floor(this.rand() * 3);
      this.baseZ = 0;
    } else if (this.form) {
      this.baseZ += this.cam.depth * (0.35 + this.rand() * 0.25);
    }
    this.warmth = 1 - (this.returns / this.maxReturns) * 0.85;
    this.returns++;
    this.formZ = this.baseZ;

    this.form = sampleForm(this.width, this.height, this.rand);
    if (this.form.points.length === 0) return;
    const survivors = this.particles.filter((p) => !p.bound);
    const born: Particle[] = [];
    const count = Math.round(this.targetCount * Math.max(0.35, 1 - (this.returns - 1) * 0.14));
    for (let i = 0; i < count; i++) {
      const angle = this.rand() * Math.PI * 2;
      const r = this.form.radius * (0.6 + this.rand() * 1.6);
      born.push(
        this.makeBound(
          this.form.cx + Math.cos(angle) * r,
          this.form.cy + Math.sin(angle) * r,
          this.formZ + (this.rand() - 0.5) * this.form.radius * 2,
        ),
      );
    }
    this.particles = survivors.concat(born);
    this.phase = "forming";
    this.phaseTime = 0;
  }

  private detach(p: Particle, vx: number, vy: number, vz: number, life: number) {
    p.bound = false;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.life = life;
    p.maxLife = life;
  }

  private dissolve(x: number, y: number) {
    for (const p of this.particles) {
      if (!p.bound) continue;
      const pr = project(this.cam, p.x, p.y, p.z);
      const dx = pr.x - x;
      const dy = pr.y - y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = (30 + this.rand() * 140) / pr.s;
      this.detach(
        p,
        (dx / d) * speed + (this.rand() - 0.5) * 40,
        (dy / d) * speed * 0.6 - 20 - this.rand() * 50,
        (this.rand() - 0.5) * 160,
        2.5 + this.rand() * 5,
      );
    }
    this.phase = "gone";
    this.phaseTime = 0;
    this.calm = 0;
    this.dwell = 0;
    this.residue = 1;
    this.veil?.erode(x, y);
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

    // 視点。見る人の手の位置に合わせて、わずかに回りこむ。手がなくても、呼吸のように揺れる
    const reach = Math.min(this.width, this.height) * 0.12;
    const tx = (sh.strength > 0.01 ? ((sh.x - this.width / 2) / (this.width / 2)) * reach * sh.strength : 0) +
      Math.sin(t * 0.07) * reach * 0.35;
    const ty = (sh.strength > 0.01 ? ((sh.y - this.height / 2) / (this.height / 2)) * reach * 0.4 * sh.strength : 0) +
      Math.sin(t * 0.05 + 1) * reach * 0.12;
    const ck = 1 - Math.exp(-dt * 1.5);
    this.cam.x += (tx - this.cam.x) * ck;
    this.cam.y += (ty - this.cam.y) * ck;

    // 手が形に近づくほど、光は遠のく
    let near = 0;
    const center = this.formCenter();
    if (this.form && center && sh.strength > 0.01) {
      const r = this.form.radius * center.s;
      const d = Math.hypot(sh.x - center.x, sh.y - center.y);
      near = clamp01(1 - (d - r * 0.35) / (r * 1.7)) * sh.strength;
    }
    this.nearness += (near - this.nearness) * (1 - Math.exp(-dt * 4));

    // 声と息（すばやく立ち上がり、ゆっくり消える）
    const follow = (cur: number, target: number) =>
      cur + (target - cur) * (1 - Math.exp(-dt * (target > cur ? 12 : 3)));
    this.voice = follow(this.voice, this.sound.voice);
    this.blow = follow(this.blow, this.sound.breath);
    const hushed = this.voice < 0.1 && this.blow < 0.1;

    // 呼んでも、届かない。呼ぶほどに回廊の奥へ歩き去り、静けさの中でだけ戻ってくる
    if (this.phase !== "gone") this.recede += this.voice * dt * 0.5;
    this.recede = Math.min(1, Math.max(0, this.recede - (hushed ? dt * 0.06 : 0)));
    const zTarget = this.baseZ + this.recede * this.cam.depth * 1.6;
    this.formZ += (zTarget - this.formZ) * (1 - Math.exp(-dt * 0.6));

    if (this.phase === "gone") {
      this.calm = this.nearness < 0.15 && hushed ? this.calm + dt : 0;
      // 最後に消えたあとは、長く、誰も戻らない
      const wait = this.returns >= this.maxReturns ? 40 : 4;
      if (this.phaseTime > wait && this.calm > 2.5) this.reform();
    } else {
      if (this.phase === "forming" && this.phaseTime > 4.5) this.phase = "present";
      // センサー越しの手が、形の中心にとどまったら「触れた」とみなす
      if (this.hand && this.hand.strength < 1 && this.nearness > 0.75) {
        this.dwell += dt;
        if (this.dwell > 0.7) this.dissolve(sh.x, sh.y);
      } else {
        this.dwell = Math.max(0, this.dwell - dt);
      }
      // 息を吹きかけ続けると、ろうそくの火のように消える
      this.blowTime = this.blow > 0.45 ? this.blowTime + dt : Math.max(0, this.blowTime - dt * 2);
      if (this.blowTime > 0.9 && center) {
        this.blowTime = 0;
        this.dissolve(center.x, center.y + (this.form?.radius ?? 0) * center.s * 1.2);
      }
    }

    const fadeIn = this.phase === "forming" ? smoothstep(0, 4.5, this.phaseTime) : 1;
    const flicker = 1 - this.blow * 0.45 * (0.5 + 0.5 * Math.sin(t * 31) * Math.sin(t * 17));
    const targetPresence =
      this.phase === "gone" ? 0 : fadeIn * (1 - 0.85 * Math.pow(this.nearness, 1.2)) * flicker;
    this.presence += (targetPresence - this.presence) * (1 - Math.exp(-dt * 5));
    this.residue = Math.max(0, this.residue - dt / 18);

    const blur = this.phase === "gone" ? 0 : Math.pow(this.nearness, 1.5) * 18;
    if (Math.abs(blur - this.appliedBlur) > 0.15) {
      this.appliedBlur = blur;
      this.canvas.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : "none";
    }

    // ゆっくりと体の向きを変える。厚みがあることが、そこで分かる
    this.angle = Math.sin(t * 0.11) * (this.form?.twin ? 0.22 : 0.42) + Math.sin(t * 0.037) * 0.12;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    const forming = this.phase === "forming";
    const spring = forming ? 2.2 + this.phaseTime * 3 : 16;
    const damping = forming ? 2.4 : 6;
    const breath = 1 + Math.sin(t * 0.4) * 0.01;
    const gust = this.blow * 900;
    const erosion = this.phase === "present" ? 0.012 : 0;
    const handR = 110 + this.nearness * 80;
    const cx = this.form?.cx ?? 0;
    const cy = this.form?.cy ?? 0;
    const fz = this.formZ;

    const next: Particle[] = [];
    for (const p of this.particles) {
      if (p.bound) {
        // いまこの瞬間にも、少しずつこぼれ落ちていく
        if (this.rand() < erosion * dt) {
          this.detach(p, (this.rand() - 0.5) * 20, -10 - this.rand() * 25, (this.rand() - 0.5) * 20, 3 + this.rand() * 3);
          const q = this.makeBound(0, 0, 0);
          q.x = q.hx + (this.rand() - 0.5) * 80;
          q.y = q.hy + (this.rand() - 0.5) * 80;
          q.z = fz + q.dz;
          next.push(q);
        } else {
          const lx = (p.hx - cx) * breath;
          const hx = cx + lx * ca + p.dz * sa + Math.sin(t * 0.7 + p.phase) * 1.6;
          const hz = fz - lx * sa + p.dz * ca;
          const hy = cy + (p.hy - cy) * breath + Math.cos(t * 0.6 + p.phase * 1.3) * 1.6;
          let ax = (hx - p.x) * spring - p.vx * damping;
          let ay = (hy - p.y) * spring - p.vy * damping;
          const az = (hz - p.z) * spring - p.vz * damping;
          if (gust > 1) {
            ax += Math.sin(p.phase * 7 + t * 9 + p.hy * 0.03) * gust;
            ay -= (0.4 + 0.6 * Math.abs(Math.sin(p.phase * 5 + t * 6))) * gust;
          }
          if (sh.strength > 0.01) {
            const pr = project(this.cam, p.x, p.y, p.z);
            const dx = pr.x - sh.x;
            const dy = pr.y - sh.y;
            const d = Math.hypot(dx, dy);
            if (d < handR && d > 0.001) {
              const f = ((1 - d / handR) ** 2 * 2600 * sh.strength) / pr.s;
              ax += (dx / d) * f;
              ay += (dy / d) * f;
            }
          }
          p.vx += ax * dt;
          p.vy += ay * dt;
          p.vz += az * dt;
          p.a = Math.min(1, p.a + dt * 0.8);
        }
      }
      if (!p.bound) {
        p.vx += Math.sin(p.y * 0.012 + t * 0.7 + p.phase) * 14 * dt;
        p.vy -= 10 * dt;
        p.vx *= Math.exp(-dt * 0.6);
        p.vy *= Math.exp(-dt * 0.6);
        p.vz *= Math.exp(-dt * 0.6);
        p.life -= dt;
        if (p.life <= 0) continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      next.push(p);
    }
    this.particles = next;

    const d = this.cam.depth;
    for (const m of this.dust) {
      m.x += (m.vx + Math.sin(t * 0.3 + m.phase) * 4) * dt;
      m.y += m.vy * dt;
      m.z += m.vz * dt;
      m.a = 0.5 + 0.5 * Math.sin(t * 0.5 + m.phase);
      if (m.y < -40) {
        m.y = this.height + 40;
        m.x = (this.rand() * 1.6 - 0.3) * this.width;
      }
      if (m.z < -d * 0.6) m.z += d * 3.4;
      if (m.z > d * 2.8) m.z -= d * 3.4;
    }
  }

  /** ピントの外れた粒は大きくにじみ、薄くなる。遠い粒は霞む */
  private lens(z: number) {
    const coc = Math.abs(z - this.formZ) / this.cam.depth;
    const grow = 1 + coc * 3.2;
    const fog = Math.exp(-Math.max(0, z) / (this.cam.depth * 2.6));
    return { grow, fade: fog / (grow * grow) };
  }

  private render() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = FADE;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.globalCompositeOperation = "lighter";

    // かつてそこにいた、という温もりだけが残る
    const c = this.formCenter();
    if (this.form && c) {
      const glow = (this.residue * 0.14 + this.presence * 0.07) * (0.4 + 0.6 * this.warmth);
      if (glow > 0.003) {
        const r = this.form.radius * c.s * 1.5 * dpr;
        const g = ctx.createRadialGradient(c.x * dpr, c.y * dpr, 0, c.x * dpr, c.y * dpr, r);
        g.addColorStop(0, `rgba(255, 150, 90, ${glow})`);
        g.addColorStop(1, "rgba(255, 150, 90, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    for (const m of this.dust) {
      const pr = project(this.cam, m.x, m.y, m.z);
      const l = this.lens(m.z);
      ctx.globalAlpha = Math.min(1, m.a * m.bright * l.fade * 1.6);
      if (ctx.globalAlpha < 0.004) continue;
      const s = m.size * pr.s * l.grow * dpr;
      ctx.drawImage(this.sprites[m.color], pr.x * dpr - s / 2, pr.y * dpr - s / 2, s, s);
    }

    for (const p of this.particles) {
      let alpha: number;
      if (p.bound) {
        alpha = p.a * p.bright * this.presence;
        if (this.voice > 0.02 && this.form) {
          const d = Math.hypot(p.hx - this.form.cx, p.hy - this.form.cy);
          alpha *= 1 + this.voice * 1.4 * Math.max(0, Math.sin(d * 0.035 - this.time * 7));
        }
      } else {
        const lifeT = p.life / p.maxLife;
        alpha = p.bright * lifeT * lifeT;
      }
      const l = this.lens(p.z);
      alpha *= l.fade * (1 + (l.grow - 1) * 0.6);
      if (alpha < 0.01) continue;
      const pr = project(this.cam, p.x, p.y, p.z);
      ctx.globalAlpha = Math.min(1, alpha);
      const s = p.size * pr.s * l.grow * dpr;
      ctx.drawImage(this.sprites[p.color], pr.x * dpr - s / 2, pr.y * dpr - s / 2, s, s);
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
