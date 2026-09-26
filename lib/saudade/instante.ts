/**
 * instante — 一瞬
 *
 * ガラスの器が落ち、割れる。その 1 秒にも満たない時間を、極端に引き延ばして見せる。
 * 見つめている（手を止めている）間だけ、時間はほとんど止まる。押さえつければ、さらに遅くなる。
 * けれど決して止まりはしない。同じ割れ方は、二度と起きない。
 */

type Pt = { x: number; y: number };
type Poly = Pt[];

type Kind = "vase" | "cup" | "bottle" | "wine";

type Vessel = {
  kind: Kind;
  poly: Poly;
  height: number;
  waterLo: number;
  waterHi: number;
  flower: boolean;
  image: HTMLCanvasElement;
  /** 画像の中で、器の足元（ローカル原点）がある位置 */
  ox: number;
  oy: number;
};

type Shard = {
  poly: Poly;
  /** 器ローカル座標での重心 */
  lx: number;
  ly: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  radius: number;
  release: number;
  released: boolean;
  resting: boolean;
  glint: number;
  impactDist: number;
};

/** 過去に割れた器の破片。消えずに床に残り、少しずつ暗くなっていく */
type Remains = { vessel: Vessel; shards: Shard[]; age: number };

type Drop = { x: number; y: number; vx: number; vy: number; r: number };
type Petal = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; tone: number };
type Mote = { x: number; y: number; vx: number; vy: number; phase: number; size: number };

type Phase = "falling" | "breaking" | "fading";

const BG = "rgb(5, 5, 9)";

const PROFILES: Record<Kind, [number, number][]> = {
  vase: [[0, 0.3], [0.08, 0.42], [0.35, 0.62], [0.62, 0.45], [0.82, 0.2], [0.94, 0.22], [1, 0.3]],
  cup: [[0, 0.36], [0.04, 0.4], [1, 0.5]],
  bottle: [[0, 0.4], [0.55, 0.42], [0.7, 0.2], [0.95, 0.13], [1, 0.15]],
  wine: [[0, 0.36], [0.02, 0.36], [0.035, 0.05], [0.45, 0.04], [0.5, 0.18], [0.66, 0.42], [0.86, 0.44], [1, 0.4]],
};

const WATER: Record<Kind, [number, number]> = {
  vase: [0.04, 0.5],
  cup: [0.04, 0.62],
  bottle: [0.04, 0.42],
  wine: [0.5, 0.72],
};

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function profileRadius(keys: [number, number][], t: number) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, r0] = keys[i];
    const [t1, r1] = keys[i + 1];
    if (t <= t1) {
      const u = clamp01((t - t0) / (t1 - t0 || 1));
      return r0 + (r1 - r0) * (0.5 - 0.5 * Math.cos(Math.PI * u));
    }
  }
  return keys[keys.length - 1][1];
}

function inside(poly: Poly, x: number, y: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** 半平面 nx*x + ny*y <= c で多角形を切る（Sutherland–Hodgman）*/
function clipHalf(poly: Poly, nx: number, ny: number, c: number): Poly {
  const out: Poly = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = nx * a.x + ny * a.y - c;
    const db = nx * b.x + ny * b.y - c;
    if (da <= 0) out.push(a);
    if (da <= 0 !== db <= 0) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

function centroid(poly: Poly) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  a /= 2;
  if (Math.abs(a) < 1e-6) return null;
  return { x: cx / (6 * a), y: cy / (6 * a), area: Math.abs(a) };
}

function rotate(x: number, y: number, r: number): Pt {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
}

function tracePath(ctx: CanvasRenderingContext2D, poly: Poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
}

/** ガラスの器をひとつ吹く。比率も、水の量も、毎回少しずつ違う。*/
function blowVessel(height: number, rand: () => number): Vessel {
  const kinds: Kind[] = ["vase", "vase", "cup", "bottle", "wine"];
  const kind = kinds[Math.floor(rand() * kinds.length)];
  const h = height * (0.85 + rand() * 0.25) * (kind === "cup" ? 0.62 : 1);
  const w = height * 0.5 * (0.88 + rand() * 0.24);
  const keys = PROFILES[kind].map(([t, r]) => [t, r * (0.92 + rand() * 0.16)] as [number, number]);

  const n = 48;
  const right: Poly = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    right.push({ x: profileRadius(keys, t) * w, y: -t * h });
  }
  const poly = right.concat(right.slice().reverse().map((p) => ({ x: -p.x, y: p.y })));
  const [waterLo, waterHi] = WATER[kind];
  const waterTop = waterHi * (0.8 + rand() * 0.3);

  const maxR = Math.max(...right.map((p) => p.x));
  const pad = 8;
  const img = document.createElement("canvas");
  img.width = Math.ceil(maxR * 2 + pad * 2);
  img.height = Math.ceil(h + pad * 2);
  const ctx = img.getContext("2d")!;
  const ox = img.width / 2;
  const oy = h + pad;
  ctx.translate(ox, oy);

  // ガラスの肌：縁ほど光を返し、中心は透ける
  tracePath(ctx, poly);
  const body = ctx.createLinearGradient(-maxR, 0, maxR, 0);
  body.addColorStop(0, "rgba(215, 230, 255, 0.34)");
  body.addColorStop(0.18, "rgba(200, 220, 250, 0.08)");
  body.addColorStop(0.55, "rgba(200, 220, 250, 0.03)");
  body.addColorStop(0.85, "rgba(200, 220, 250, 0.1)");
  body.addColorStop(1, "rgba(215, 230, 255, 0.3)");
  ctx.fillStyle = body;
  ctx.fill();

  // 水
  ctx.save();
  tracePath(ctx, poly.map((p) => ({ x: p.x * 0.9, y: p.y })));
  ctx.clip();
  const top = -waterTop * h;
  const bottom = -waterLo * h;
  const water = ctx.createLinearGradient(0, top, 0, bottom);
  water.addColorStop(0, kind === "wine" ? "rgba(150, 40, 60, 0.4)" : "rgba(170, 205, 225, 0.2)");
  water.addColorStop(1, kind === "wine" ? "rgba(90, 20, 35, 0.5)" : "rgba(120, 160, 190, 0.14)");
  ctx.fillStyle = water;
  ctx.fillRect(-maxR, top, maxR * 2, bottom - top);
  const surfaceR = profileRadius(keys, waterTop) * w * 0.9;
  ctx.strokeStyle = "rgba(235, 245, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, top, surfaceR, surfaceR * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 映りこみの筋
  ctx.lineCap = "round";
  for (const [side, alpha, width] of [
    [-0.55, 0.55, 2.2],
    [0.62, 0.22, 1.2],
  ] as const) {
    ctx.strokeStyle = `rgba(255, 252, 245, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 4; i <= n - 4; i++) {
      const t = i / n;
      const x = profileRadius(keys, t) * w * side;
      if (i === 4) ctx.moveTo(x, -t * h);
      else ctx.lineTo(x, -t * h);
    }
    ctx.stroke();
  }

  // 輪郭と口
  tracePath(ctx, poly);
  ctx.strokeStyle = "rgba(230, 240, 255, 0.4)";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  const lip = profileRadius(keys, 1) * w;
  ctx.strokeStyle = "rgba(245, 250, 255, 0.5)";
  ctx.beginPath();
  ctx.ellipse(0, -h, lip, lip * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();

  return {
    kind,
    poly,
    height: h,
    waterLo: waterLo,
    waterHi: waterTop,
    flower: kind === "vase" || kind === "bottle",
    image: img,
    ox,
    oy,
  };
}

export class InstanteEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly rand = Math.random;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private floorY = 0;
  /** 1 メートルあたりのピクセル数 */
  private ppm = 1000;

  private phase: Phase = "fading";
  private fade = 0;
  private vessel: Vessel | null = null;
  private pos = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0 };
  private shards: Shard[] = [];
  private drops: Drop[] = [];
  private petals: Petal[] = [];
  private motes: Mote[] = [];
  private remains: Remains[] = [];
  private stem = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, len: 0, attached: true };
  private impact = { x: 0, y: 0, lx: 0, ly: 0, time: 0 };
  private puddle = 0;
  private simTime = 0;
  private appear = 0;

  // 時間の流れ
  private logScale = Math.log(1 / 45);
  private pointer: Pt | null = null;
  private lastMove = { x: 0, y: 0, t: 0 };
  private motion = 0;
  private holding = false;
  private lastFrame = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  /** いま、現実の 1 秒が何秒に引き延ばされているか */
  get timeScale() {
    return Math.exp(this.logScale);
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(dpr, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.floorY = height * 0.78;
    const vesselPx = Math.min(width, height) * 0.3;
    this.ppm = vesselPx / 0.22;
    this.remains = [];
    this.motes = Array.from({ length: Math.round(Math.min(180, (width * height) / 7000)) }, () => ({
      x: this.rand() * width,
      y: this.rand() * this.floorY,
      vx: (this.rand() - 0.5) * 0.12,
      vy: (this.rand() - 0.5) * 0.08,
      phase: this.rand() * Math.PI * 2,
      size: 0.6 + this.rand() * 1.6,
    }));
    this.spawn();
  }

  setPointer(p: Pt | null) {
    const now = performance.now();
    if (p && this.pointer) {
      const dt = Math.max(1, now - this.lastMove.t) / 1000;
      const speed = Math.hypot(p.x - this.lastMove.x, p.y - this.lastMove.y) / dt;
      this.motion = Math.max(this.motion, clamp01(speed / 1400));
    }
    if (p) this.lastMove = { x: p.x, y: p.y, t: now };
    this.pointer = p;
  }

  setHolding(holding: boolean) {
    this.holding = holding;
  }

  frame(now: number) {
    const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 1 / 20) : 1 / 60;
    this.lastFrame = now;

    // 見つめている間は遅く、目をそらすと流れ出す。誰もいなければ、世界は勝手に進む
    this.motion *= Math.exp(-dt * 2.5);
    const still = 1 / 300;
    const moving = 1 / 8;
    let target = this.pointer ? Math.exp(Math.log(still) + (Math.log(moving) - Math.log(still)) * Math.pow(this.motion, 0.6)) : 1 / 45;
    if (this.holding) target = 1 / 3000;
    this.logScale += (Math.log(target) - this.logScale) * (1 - Math.exp(-dt * (this.holding ? 6 : 1.6)));

    const simDt = dt * this.timeScale;
    this.step(simDt, dt);
    this.render();
  }

  private spawn() {
    // 割れたものは片づけない。床に残したまま、次の一瞬を迎える
    if (this.vessel && this.shards.length) {
      for (const r of this.remains) r.age++;
      this.remains.unshift({ vessel: this.vessel, shards: this.shards, age: 0 });
      this.remains = this.remains.slice(0, 5);
    }
    this.vessel = blowVessel(Math.min(this.width, this.height) * 0.3, this.rand);
    const v = this.vessel;
    this.phase = "falling";
    this.fade = 1;
    this.appear = 0;
    this.simTime = 0;
    this.shards = [];
    this.drops = [];
    this.petals = [];
    this.puddle = 0;
    // 机から滑り落ちた直後。すでに落ちはじめている
    this.pos = {
      x: this.width * (0.5 + (this.rand() - 0.5) * 0.08),
      y: this.floorY - this.ppm * (0.2 + this.rand() * 0.08),
      vx: (this.rand() - 0.5) * 0.25 * this.ppm,
      vy: (1.1 + this.rand() * 0.5) * this.ppm,
      rot: (this.rand() - 0.5) * 0.5,
      vr: (this.rand() - 0.5) * 2.4,
    };
    this.stem = { x: 0, y: 0, vx: 0, vy: 0, rot: (this.rand() - 0.5) * 0.3, vr: 0, len: v.height * 0.55, attached: v.flower };
    if (v.flower) {
      const n = 9 + Math.floor(this.rand() * 5);
      const tone = this.rand();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + this.rand() * 0.3;
        this.petals.push({
          x: Math.cos(a) * v.height * 0.06,
          y: Math.sin(a) * v.height * 0.035,
          vx: 0,
          vy: 0,
          rot: a,
          vr: 0,
          size: v.height * (0.045 + this.rand() * 0.025),
          tone: tone + (this.rand() - 0.5) * 0.2,
        });
      }
    }
  }

  private toWorld(lx: number, ly: number): Pt {
    const r = rotate(lx, ly, this.pos.rot);
    return { x: this.pos.x + r.x, y: this.pos.y + r.y };
  }

  private shatter(impactWorld: Pt, impactLocal: Pt) {
    const v = this.vessel!;
    this.phase = "breaking";
    this.impact = { x: impactWorld.x, y: impactWorld.y, lx: impactLocal.x, ly: impactLocal.y, time: this.simTime };

    // ひびの種。当たったところほど細かく砕ける
    const maxR = Math.max(...v.poly.map((p) => Math.abs(p.x)));
    const seeds: Pt[] = [];
    let guard = 0;
    while (seeds.length < 110 && guard++ < 20000) {
      const x = (this.rand() * 2 - 1) * maxR;
      const y = -this.rand() * v.height;
      if (!inside(v.poly, x, y)) continue;
      const d = Math.hypot(x - impactLocal.x, y - impactLocal.y) / v.height;
      if (this.rand() > Math.exp(-d * 3.2) + 0.12) continue;
      seeds.push({ x, y });
    }

    const speed = Math.hypot(this.pos.vx, this.pos.vy);
    for (let i = 0; i < seeds.length; i++) {
      let cell = v.poly;
      const s = seeds[i];
      for (let j = 0; j < seeds.length && cell.length > 2; j++) {
        if (i === j) continue;
        const o = seeds[j];
        const nx = o.x - s.x;
        const ny = o.y - s.y;
        cell = clipHalf(cell, nx, ny, nx * (s.x + o.x) * 0.5 + ny * (s.y + o.y) * 0.5);
      }
      if (cell.length < 3) continue;
      const c = centroid(cell);
      if (!c || c.area < 4) continue;
      const local = cell.map((p) => ({ x: p.x - c.x, y: p.y - c.y }));
      const world = this.toWorld(c.x, c.y);
      const dx = c.x - impactLocal.x;
      const dy = c.y - impactLocal.y;
      const dist = Math.hypot(dx, dy);
      const dir = rotate(dx / (dist || 1), dy / (dist || 1), this.pos.rot);
      const near = clamp01(1 - dist / v.height);
      // 机ほどの高さから落ちた器は、爆ぜずに、床を這うように散る
      const burst = (0.25 + this.rand() * 1.1) * (0.2 + near) * this.ppm;
      this.shards.push({
        poly: local,
        lx: c.x,
        ly: c.y,
        x: world.x,
        y: world.y,
        vx: this.pos.vx * 0.3 + dir.x * burst,
        vy: -speed * (0.05 + this.rand() * 0.2) + Math.min(0, dir.y) * burst * 0.35,
        rot: this.pos.rot,
        vr: (this.rand() - 0.5) * 30 * (0.3 + near),
        radius: Math.sqrt(c.area / Math.PI),
        // ひびがそこまで走ってから、はじめて離れる
        release: dist / (26 * this.ppm) + this.rand() * 0.004,
        released: false,
        resting: false,
        glint: this.rand() * Math.PI * 2,
        impactDist: dist,
      });
    }

    // 水は冠のようにはねる
    const lo = -v.waterHi * v.height;
    const hi = -v.waterLo * v.height;
    let guard2 = 0;
    const water: Drop[] = [];
    while (water.length < 320 && guard2++ < 20000) {
      const x = (this.rand() * 2 - 1) * maxR;
      const y = lo + this.rand() * (hi - lo);
      if (!inside(v.poly, x * 1.1, y)) continue;
      const w = this.toWorld(x, y);
      const out = x / maxR;
      water.push({
        x: w.x,
        y: w.y,
        vx: this.pos.vx * 0.2 + (out * (0.6 + this.rand() * 2.2) + (this.rand() - 0.5) * 0.4) * this.ppm,
        vy: -(0.4 + this.rand() * 1.8) * this.ppm * (0.4 + Math.abs(out)),
        r: 0.6 + this.rand() * 2.4,
      });
    }
    this.drops = water;

    // 花は器を離れ、ゆっくり宙を舞う
    if (v.flower) {
      const top = this.toWorld(0, -v.height);
      const tip = rotate(0, -this.stem.len, this.pos.rot + this.stem.rot);
      this.stem = {
        ...this.stem,
        x: top.x,
        y: top.y,
        vx: this.pos.vx * 0.4 + (this.rand() - 0.5) * 0.4 * this.ppm,
        vy: -(0.2 + this.rand() * 0.4) * this.ppm,
        rot: this.pos.rot + this.stem.rot,
        vr: (this.rand() - 0.5) * 6,
        attached: false,
      };
      for (const p of this.petals) {
        p.x += top.x + tip.x;
        p.y += top.y + tip.y;
        p.vx = (this.rand() - 0.5) * 1.2 * this.ppm;
        p.vy = -(0.2 + this.rand() * 1) * this.ppm;
        p.vr = (this.rand() - 0.5) * 10;
      }
    }
  }

  private step(dt: number, realDt: number) {
    const g = 9.8 * this.ppm;
    this.simTime += dt;
    this.appear = Math.min(1, this.appear + realDt / 2.5);

    // 宙のちり。時間と一緒に、止まり、流れる
    for (const m of this.motes) {
      m.x += (m.vx * this.ppm + Math.sin(this.simTime * 0.8 + m.phase) * 0.05 * this.ppm) * dt;
      m.y += (m.vy * this.ppm + Math.cos(this.simTime * 0.6 + m.phase) * 0.04 * this.ppm) * dt;
      if (m.x < 0) m.x += this.width;
      if (m.x > this.width) m.x -= this.width;
      if (m.y < 0) m.y += this.floorY;
      if (m.y > this.floorY) m.y -= this.floorY;
    }

    if (this.phase === "fading") {
      this.fade -= realDt / 6;
      if (this.fade <= 0) this.spawn();
      return;
    }

    const v = this.vessel!;
    if (this.phase === "falling") {
      const p = this.pos;
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      let low: Pt | null = null;
      let lowLocal: Pt | null = null;
      for (const q of v.poly) {
        const w = this.toWorld(q.x, q.y);
        if (!low || w.y > low.y) {
          low = w;
          lowLocal = q;
        }
      }
      if (low && lowLocal && low.y >= this.floorY) {
        p.y -= low.y - this.floorY;
        this.shatter({ x: low.x, y: this.floorY }, lowLocal);
      }
      if (v.flower) this.stem.vr += (-this.stem.rot * 40 - this.stem.vr * 4) * dt;
      if (v.flower) this.stem.rot += this.stem.vr * dt;
      return;
    }

    // breaking
    const since = this.simTime - this.impact.time;
    let active = false;
    for (const s of this.shards) {
      if (!s.released) {
        if (since >= s.release) s.released = true;
        else continue;
      }
      if (s.resting) continue;
      active = true;
      s.vy += g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      const bottom = this.floorY - s.radius * 0.35;
      if (s.y > bottom) {
        s.y = bottom;
        if (Math.abs(s.vy) < 0.25 * this.ppm) {
          s.vy = 0;
          s.vx *= Math.exp(-dt * 10);
          s.vr *= Math.exp(-dt * 10);
          if (Math.abs(s.vx) < 0.01 * this.ppm) s.resting = true;
        } else {
          s.vy = -s.vy * 0.25;
          s.vx *= 0.7;
          s.vr *= 0.5;
        }
      }
    }

    const next: Drop[] = [];
    for (const d of this.drops) {
      d.vy += g * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= this.floorY) {
        if (d.r > 1.4 && d.vy > 1.2 * this.ppm && this.rand() < 0.5) {
          for (let k = 0; k < 2; k++) {
            next.push({ x: d.x, y: this.floorY - 1, vx: d.vx * 0.4 + (this.rand() - 0.5) * 0.6 * this.ppm, vy: -d.vy * (0.15 + this.rand() * 0.2), r: d.r * 0.5 });
          }
        }
        this.puddle += d.r * d.r;
        continue;
      }
      next.push(d);
    }
    this.drops = next;
    if (this.drops.length) active = true;

    if (v.flower) {
      const st = this.stem;
      st.vy += g * 0.9 * dt;
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      st.rot += st.vr * dt;
      if (st.y > this.floorY - 2) {
        st.y = this.floorY - 2;
        st.vy = -st.vy * 0.2;
        st.vx *= 0.6;
        st.vr *= 0.5;
      }
      for (const p of this.petals) {
        // 花びらは空気に支えられ、ゆっくり落ちる
        p.vx *= Math.exp(-dt * 3.5);
        p.vy *= Math.exp(-dt * 3.5);
        p.vy += g * 0.12 * dt;
        p.vx += Math.sin(this.simTime * 7 + p.rot) * 0.15 * this.ppm * dt;
        p.x += p.vx * dt;
        p.y = Math.min(this.floorY - 1, p.y + p.vy * dt);
        p.rot += p.vr * dt;
      }
    }

    if (since > 3 || (!active && since > 0.6)) {
      this.phase = "fading";
      this.fade = 1;
    }
  }

  private drawRemains(ctx: CanvasRenderingContext2D, alpha: number) {
    for (const r of this.remains) {
      const a = alpha * 0.55 * Math.pow(0.55, r.age);
      if (a < 0.01) continue;
      for (const s of r.shards) {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        tracePath(ctx, s.poly);
        ctx.save();
        ctx.clip();
        ctx.drawImage(r.vessel.image, -s.lx - r.vessel.ox, -s.ly - r.vessel.oy);
        ctx.restore();
        ctx.strokeStyle = "rgba(250, 250, 255, 0.3)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private drawVesselScene(ctx: CanvasRenderingContext2D, alpha: number, remainsAlpha: number) {
    this.drawRemains(ctx, remainsAlpha);
    const v = this.vessel;
    if (!v) return;
    const since = this.simTime - this.impact.time;

    // 床の水たまり
    if (this.puddle > 0) {
      const r = Math.sqrt(this.puddle) * 1.6;
      const g = ctx.createRadialGradient(this.impact.x, this.floorY, 0, this.impact.x, this.floorY, r);
      g.addColorStop(0, `rgba(180, 200, 220, ${0.1 * alpha})`);
      g.addColorStop(1, "rgba(180, 200, 220, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(this.impact.x, this.floorY, r, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.phase === "falling") {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.pos.rot);
      if (v.flower) this.drawFlowerAttached(ctx, v);
      ctx.drawImage(v.image, -v.ox, -v.oy);
      ctx.restore();
      return;
    }

    // 花と茎
    if (v.flower) {
      const st = this.stem;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.translate(st.x, st.y);
      ctx.rotate(st.rot);
      ctx.strokeStyle = "rgb(120, 140, 96)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(st.len * 0.15, -st.len * 0.5, 0, -st.len);
      ctx.stroke();
      ctx.restore();
      for (const p of this.petals) this.drawPetal(ctx, p.x, p.y, p.rot, p.size, p.tone, alpha);
    }

    // 破片
    const front = since * 26 * this.ppm;
    for (const s of this.shards) {
      const glint = Math.pow(Math.max(0, Math.cos(s.rot * 2 + s.glint)), 18);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      tracePath(ctx, s.poly);
      ctx.save();
      ctx.clip();
      ctx.drawImage(v.image, -s.lx - v.ox, -s.ly - v.oy);
      if (glint > 0.02) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255, 246, 228, ${0.45 * glint})`;
        ctx.fill();
      }
      ctx.restore();
      // ひびは、走ったところにだけ見える
      if (s.released || s.impactDist < front) {
        ctx.strokeStyle = `rgba(250, 250, 255, ${Math.min(1, 0.35 + glint * 0.65) * alpha})`;
        ctx.lineWidth = 0.8 + glint;
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const d of this.drops) {
      ctx.globalAlpha = 0.55 * alpha;
      ctx.fillStyle = v.kind === "wine" ? "rgb(170, 60, 80)" : "rgb(200, 222, 240)";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8 * alpha;
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 当たった瞬間の、かすかな光
    const flash = Math.max(0, 1 - since / 0.012);
    if (flash > 0) {
      const r = v.height * 0.6;
      const g = ctx.createRadialGradient(this.impact.x, this.impact.y, 0, this.impact.x, this.impact.y, r);
      g.addColorStop(0, `rgba(255, 250, 240, ${0.5 * flash * alpha})`);
      g.addColorStop(1, "rgba(255, 250, 240, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.fillRect(this.impact.x - r, this.impact.y - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  private drawFlowerAttached(ctx: CanvasRenderingContext2D, v: Vessel) {
    ctx.save();
    ctx.translate(0, -v.height);
    ctx.rotate(this.stem.rot);
    const len = this.stem.len;
    ctx.strokeStyle = "rgb(120, 140, 96)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, v.height * 0.4);
    ctx.quadraticCurveTo(len * 0.15, -len * 0.5, 0, -len);
    ctx.stroke();
    ctx.translate(0, -len);
    for (const p of this.petals) this.drawPetal(ctx, p.x, p.y, p.rot, p.size, p.tone, ctx.globalAlpha);
    ctx.restore();
  }

  private drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, size: number, tone: number, alpha: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha * 0.85;
    const t = clamp01(tone);
    ctx.fillStyle = `rgb(${Math.round(245 - t * 10)}, ${Math.round(228 - t * 60)}, ${Math.round(222 - t * 50)})`;
    ctx.beginPath();
    ctx.ellipse(size * 0.5, 0, size * 0.55, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private render() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    const w = this.width;
    const h = this.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // 天井からの一灯
    const cx = w / 2;
    const cone = ctx.createRadialGradient(cx, this.floorY, 0, cx, this.floorY, Math.max(w, h) * 0.6);
    cone.addColorStop(0, "rgba(120, 110, 100, 0.22)");
    cone.addColorStop(1, "rgba(120, 110, 100, 0)");
    ctx.fillStyle = cone;
    ctx.fillRect(0, 0, w, h);

    // 割れたあとは消えない。過去の破片と同じ暗さまで沈んでいくだけ
    const alpha = this.appear * (this.phase === "fading" ? 0.55 + 0.45 * clamp01(this.fade) : 1);

    // 床に映りこむ
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.floorY, w, h - this.floorY);
    ctx.clip();
    ctx.translate(0, this.floorY * 2);
    ctx.scale(1, -1);
    this.drawVesselScene(ctx, alpha * 0.2, 0.2);
    ctx.restore();
    const floorFade = ctx.createLinearGradient(0, this.floorY, 0, h);
    floorFade.addColorStop(0, "rgba(5, 5, 9, 0.2)");
    floorFade.addColorStop(1, "rgba(5, 5, 9, 1)");
    ctx.fillStyle = floorFade;
    ctx.fillRect(0, this.floorY, w, h - this.floorY);
    const line = ctx.createLinearGradient(0, 0, w, 0);
    line.addColorStop(0, "rgba(200, 190, 175, 0)");
    line.addColorStop(0.5, "rgba(200, 190, 175, 0.18)");
    line.addColorStop(1, "rgba(200, 190, 175, 0)");
    ctx.fillStyle = line;
    ctx.fillRect(0, this.floorY, w, 1);

    this.drawVesselScene(ctx, alpha, 1);

    // ちり
    for (const m of this.motes) {
      const lit = Math.max(0, 1 - Math.abs(m.x - cx) / (w * 0.45));
      ctx.globalAlpha = (0.08 + 0.3 * lit) * (0.6 + 0.4 * Math.sin(m.phase + this.simTime * 3));
      ctx.fillStyle = "rgb(235, 225, 210)";
      ctx.fillRect(m.x, m.y, m.size, m.size);
    }
    ctx.globalAlpha = 1;

    // 見る人の気配
    if (this.pointer) {
      const r = this.holding ? 9 : 14;
      ctx.strokeStyle = "rgba(200, 215, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.pointer.x, this.pointer.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
