/**
 * 記憶の帳（とばり）— 光の人の背後に吊るされた和紙。
 *
 * 夕暮れの部屋の記憶が、何枚もの紙に分かれて透けている。
 * 誰かが消えるたび、近くの紙から記憶が霧のように抜け落ちる。
 * しばらくすると像はまた浮かぶが、それはもう、少しずれた別の断片になっている。
 */

import type { Hand } from "./engine";

export type Light = { x: number; y: number; radius: number; intensity: number };

type Sheet = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 映っている記憶の断片（シーン上の位置）*/
  sx: number;
  sy: number;
  memory: number;
  target: number;
  blank: number;
  mist: number;
  angle: number;
  tilt: number;
  spin: number;
  phase: number;
  paper: number;
};

const BG = "rgb(4, 3, 8)";

function paintPaper(rand: () => number): HTMLCanvasElement {
  const w = 120;
  const h = 160;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(222, 204, 172)";
  ctx.fillRect(0, 0, w, h);
  // しみ
  for (let i = 0; i < 26; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 8 + rand() * 42;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(140, 100, 55, ${0.06 + rand() * 0.16})`);
    g.addColorStop(1, "rgba(140, 100, 55, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // 繊維
  ctx.strokeStyle = "rgba(255, 250, 240, 0.18)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const a = rand() * Math.PI;
    const l = 3 + rand() * 10;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  // 縁の焼け
  const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  edge.addColorStop(0, "rgba(120, 85, 45, 0)");
  edge.addColorStop(1, "rgba(120, 85, 45, 0.45)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  return c;
}

function paintFog(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(250, 226, 190, 0.9)");
  g.addColorStop(0.45, "rgba(240, 212, 175, 0.35)");
  g.addColorStop(1, "rgba(240, 212, 175, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

/** 夕暮れの部屋。窓、レースのカーテン、差しこむ光、椅子、花の置かれた小さなテーブル。*/
function paintRoom(w: number, h: number, rand: () => number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d")!;
  const u = Math.min(w, h * 1.4);

  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, "rgb(96, 74, 54)");
  wall.addColorStop(1, "rgb(62, 46, 34)");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (rand() < 0.5) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  const floorY = h * 0.72;
  ctx.fillStyle = "rgb(46, 33, 24)";
  ctx.fillRect(0, floorY, w, h - floorY);
  ctx.strokeStyle = "rgba(120, 90, 60, 0.25)";
  ctx.lineWidth = Math.max(1, u * 0.002);
  for (let y = floorY + (h - floorY) * 0.12; y < h; y += (h - floorY) * 0.16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 窓と、その向こうの光
  const wx = w * (0.08 + rand() * 0.06);
  const wy = h * 0.1;
  const ww = w * 0.26;
  const wh = h * 0.56;
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, "rgb(255, 238, 205)");
  sky.addColorStop(1, "rgb(248, 205, 145)");
  ctx.fillStyle = sky;
  ctx.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(80, 66, 40, ${0.12 + rand() * 0.2})`;
    ctx.beginPath();
    ctx.arc(wx + rand() * ww * 0.7, wy + wh * (0.55 + rand() * 0.45), u * (0.01 + rand() * 0.03), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgb(58, 42, 30)";
  ctx.lineWidth = u * 0.008;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 3);
  ctx.lineTo(wx + ww, wy + wh / 3);
  ctx.moveTo(wx, wy + (wh * 2) / 3);
  ctx.lineTo(wx + ww, wy + (wh * 2) / 3);
  ctx.stroke();

  // 風にふくらむレースのカーテン
  for (let s = 0; s < 6; s++) {
    const left = wx + ww * (0.35 + s * 0.13);
    const width = ww * 0.16;
    ctx.beginPath();
    ctx.moveTo(left, wy - h * 0.03);
    for (let y = wy; y <= floorY; y += h * 0.02) {
      const t = (y - wy) / (floorY - wy);
      ctx.lineTo(left + Math.sin(t * 5 + s) * width * 0.25 + t * t * ww * 0.18, y);
    }
    for (let y = floorY; y >= wy; y -= h * 0.02) {
      const t = (y - wy) / (floorY - wy);
      ctx.lineTo(left + width + Math.sin(t * 5 + s + 0.6) * width * 0.25 + t * t * ww * 0.22, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 246, 228, 0.32)";
    ctx.fill();
  }
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = "rgba(255, 255, 250, 0.28)";
    ctx.fillRect(wx + ww * (0.35 + rand() * 0.95), wy + rand() * (floorY - wy), u * 0.003, u * 0.003);
  }

  // 差しこむ光
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255, 196, 120, 0.1)";
  ctx.beginPath();
  ctx.moveTo(wx + ww * 0.2, wy + wh);
  ctx.lineTo(wx + ww, wy + wh * 0.2);
  ctx.lineTo(wx + ww + w * 0.34, h * 0.96);
  ctx.lineTo(wx + ww * 0.2 + w * 0.12, h * 0.98);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255, 205, 140, 0.22)";
  ctx.beginPath();
  ctx.moveTo(wx + ww * 0.5, floorY + (h - floorY) * 0.25);
  ctx.lineTo(wx + ww * 1.2, floorY + (h - floorY) * 0.25);
  ctx.lineTo(wx + ww * 1.6, h * 0.95);
  ctx.lineTo(wx + ww * 0.8, h * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // 壁の額
  ctx.fillStyle = "rgba(150, 118, 84, 0.5)";
  ctx.fillRect(w * 0.6, h * 0.2, w * 0.12, h * 0.16);

  // 椅子
  const cx = w * (0.62 + rand() * 0.06);
  const cw = u * 0.07;
  ctx.strokeStyle = "rgb(34, 23, 15)";
  ctx.lineWidth = u * 0.006;
  ctx.beginPath();
  ctx.moveTo(cx, floorY + h * 0.08);
  ctx.lineTo(cx, floorY - h * 0.3);
  ctx.moveTo(cx + cw, floorY + h * 0.06);
  ctx.lineTo(cx + cw, floorY - h * 0.3);
  ctx.moveTo(cx - cw * 0.1, floorY - h * 0.08);
  ctx.lineTo(cx + cw * 1.3, floorY - h * 0.06);
  ctx.moveTo(cx + cw * 0.3, floorY + h * 0.1);
  ctx.lineTo(cx + cw * 0.3, floorY - h * 0.07);
  ctx.moveTo(cx + cw * 1.3, floorY + h * 0.09);
  ctx.lineTo(cx + cw * 1.3, floorY - h * 0.06);
  for (let i = 1; i < 4; i++) {
    const y = floorY - h * (0.3 - i * 0.05);
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
  }
  ctx.stroke();

  // 花の置かれた小さなテーブル
  const tx = cx + cw * 2.2;
  const tw = u * 0.13;
  const ty = floorY - h * 0.14;
  ctx.fillStyle = "rgba(232, 214, 186, 0.85)";
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + tw, ty);
  ctx.lineTo(tx + tw * 1.08, ty + h * 0.1);
  ctx.lineTo(tx - tw * 0.08, ty + h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(40, 28, 19)";
  ctx.fillRect(tx + tw * 0.05, ty + h * 0.1, u * 0.005, h * 0.12);
  ctx.fillRect(tx + tw * 0.92, ty + h * 0.1, u * 0.005, h * 0.12);
  const vx = tx + tw * 0.5;
  ctx.fillStyle = "rgba(190, 200, 190, 0.6)";
  ctx.beginPath();
  ctx.ellipse(vx, ty - h * 0.03, u * 0.012, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(70, 70, 40, 0.8)";
  ctx.lineWidth = u * 0.002;
  for (let i = 0; i < 9; i++) {
    const fx = vx + (rand() - 0.5) * u * 0.06;
    const fy = ty - h * (0.08 + rand() * 0.07);
    ctx.beginPath();
    ctx.moveTo(vx, ty - h * 0.05);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.fillStyle = `rgba(${200 + rand() * 50}, ${150 + rand() * 60}, ${120 + rand() * 40}, 0.85)`;
    ctx.beginPath();
    ctx.arc(fx, fy, u * (0.004 + rand() * 0.005), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // セピアに褪せさせる
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgb(255, 222, 176)";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, "rgba(0, 0, 0, 0)");
  vig.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // 記憶は、くっきりとは思い出せない
  const soft = document.createElement("canvas");
  soft.width = c.width;
  soft.height = c.height;
  const sctx = soft.getContext("2d")!;
  sctx.filter = `blur(${Math.max(1.5, u * 0.004).toFixed(1)}px)`;
  sctx.drawImage(c, 0, 0);
  return soft;
}

export class MemoryVeil {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly rand = Math.random;
  private readonly papers: HTMLCanvasElement[];
  private readonly fog: HTMLCanvasElement;
  private scene: HTMLCanvasElement | null = null;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private sheets: Sheet[] = [];
  private columns: number[] = [];
  private region = { x: 0, y: 0, w: 0, h: 0 };
  private floorY = 0;
  private lastHand: { x: number; y: number } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.papers = [0, 1, 2, 3].map(() => paintPaper(this.rand));
    this.fog = paintFog();
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(dpr, 1.5);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);

    const portrait = height > width;
    const r = {
      x: width * 0.05,
      y: height * 0.05,
      w: width * 0.9,
      h: height * (portrait ? 0.7 : 0.74),
    };
    this.region = r;
    this.floorY = r.y + r.h;
    this.scene = paintRoom(r.w, r.h, this.rand);

    const gap = Math.max(4, width * 0.0045);
    let cols = Math.max(4, Math.round(r.w / 105));
    // 横長の画面では、真ん中に通り道を空ける（光の人が立つ場所）
    const aisle = !portrait && cols >= 6;
    if (aisle && cols % 2 === 0) cols += 1;
    const sw = (r.w - gap * (cols - 1)) / cols;
    const sh = sw / 0.72;
    const rows = Math.max(2, Math.floor((r.h + gap) / (sh + gap)));
    const top = r.y + r.h - rows * (sh + gap) + gap;

    this.sheets = [];
    this.columns = [];
    for (let i = 0; i < cols; i++) {
      if (aisle && i === (cols - 1) / 2) continue;
      const x = r.x + i * (sw + gap);
      this.columns.push(x + sw / 2);
      for (let j = 0; j < rows; j++) {
        // 手漉きの紙は、一枚ずつ大きさも吊られ方も少し違う
        const k = 0.86 + this.rand() * 0.14;
        const w = sw * k;
        const h = sh * (0.86 + this.rand() * 0.14);
        const y = top + j * (sh + gap) + (this.rand() - 0.5) * gap;
        this.sheets.push({
          x: x + (sw - w) / 2 + (this.rand() - 0.5) * gap,
          y,
          w,
          h,
          sx: x - r.x,
          sy: y - r.y,
          memory: 0,
          target: 1,
          blank: 0,
          mist: 0,
          angle: 0,
          tilt: (this.rand() - 0.5) * 0.05,
          spin: 0,
          phase: this.rand() * Math.PI * 2,
          paper: Math.floor(this.rand() * this.papers.length),
        });
      }
    }
  }

  /** 誰かが消えた。その近くの紙から、記憶が抜け落ちる。*/
  erode(x: number, y: number) {
    const ranked = this.sheets
      .filter((s) => s.target > 0)
      .map((s) => ({ s, d: Math.hypot(s.x + s.w / 2 - x, s.y + s.h / 2 - y) * (0.6 + this.rand() * 0.8) }))
      .sort((a, b) => a.d - b.d);
    const count = Math.ceil(this.sheets.length * (0.18 + this.rand() * 0.12));
    for (const { s } of ranked.slice(0, count)) {
      s.target = 0;
      s.mist = 1;
      s.blank = 20 + this.rand() * 40;
      s.spin += (this.rand() - 0.5) * 0.6;
    }
  }

  render(dt: number, t: number, light: Light, hand: Hand | null, blow: number) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    const scene = this.scene;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!scene) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 手が動くと、その風で紙が揺れる
    let hvx = 0;
    if (hand && hand.strength > 0.01) {
      if (this.lastHand && dt > 0) hvx = (hand.x - this.lastHand.x) / dt;
      this.lastHand = { x: hand.x, y: hand.y };
    } else {
      this.lastHand = null;
    }

    // 吊り糸
    ctx.strokeStyle = "rgba(210, 190, 160, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const x of this.columns) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.floorY);
    }
    ctx.stroke();

    for (const s of this.sheets) {
      // 抜け落ちた記憶は、しばらくして別の断片として浮かびなおす
      if (s.target === 0 && s.memory < 0.01) {
        s.blank -= dt;
        if (s.blank <= 0) {
          s.sx = Math.min(Math.max(0, s.sx + (this.rand() - 0.5) * s.w * 2.5), this.region.w - s.w);
          s.sy = Math.min(Math.max(0, s.sy + (this.rand() - 0.5) * s.h * 1.5), this.region.h - s.h);
          s.target = 1;
        }
      }
      const rate = s.target > s.memory ? dt / 14 : dt / 2.5;
      s.memory += Math.max(-rate, Math.min(rate, s.target - s.memory));
      s.mist = Math.max(0, s.mist - dt / 4);

      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      let push = blow * Math.sin(t * 7 + s.phase) * 3;
      if (hand && hand.strength > 0.01) {
        const d2 = (cx - hand.x) ** 2 + (cy - hand.y) ** 2;
        push += hvx * 0.0035 * Math.exp(-d2 / (2 * 170 * 170)) * hand.strength;
      }
      s.spin += (-s.angle * 7 - s.spin * 1.6 + push) * dt;
      s.angle += s.spin * dt;
    }

    const reach = Math.min(light.radius * 2.4, Math.max(this.width, this.height) * 0.42);
    const lit = (s: Sheet) => {
      const d = Math.hypot(s.x + s.w / 2 - light.x, s.y + s.h / 2 - light.y) / reach;
      // 光の人に照らされた紙だけが、記憶を浮かびあがらせる
      return 0.1 + light.intensity * 1.35 * Math.max(0, 1 - d * d);
    };

    const drawSheets = (alphaScale: number) => {
      for (const s of this.sheets) {
        const l = lit(s) * alphaScale;
        const angle = s.tilt + s.angle + Math.sin(t * 0.5 + s.phase) * 0.012;
        ctx.save();
        ctx.translate(s.x + s.w / 2, s.y);
        ctx.rotate(angle);
        ctx.globalAlpha = Math.min(1, 0.17 * l);
        ctx.drawImage(this.papers[s.paper], -s.w / 2, 0, s.w, s.h);
        if (s.memory > 0.01) {
          ctx.globalAlpha = Math.min(1, 0.62 * l * s.memory);
          ctx.drawImage(scene, s.sx, s.sy, s.w, s.h, -s.w / 2, 0, s.w, s.h);
        }
        if (s.mist > 0.01) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = s.mist * s.mist * 0.35 * l;
          ctx.drawImage(this.fog, -s.w, -s.h * 0.2 - (1 - s.mist) * s.h * 0.4, s.w * 2, s.h * 1.4);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.restore();
      }
    };

    drawSheets(1);

    // 濡れた床に、ぼんやりと映りこむ
    const floor = this.floorY;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, floor, this.width, this.height - floor);
    ctx.clip();
    ctx.translate(0, floor * 2);
    ctx.scale(1, -1);
    drawSheets(0.22);
    ctx.restore();
    const fade = ctx.createLinearGradient(0, floor, 0, floor + (this.height - floor) * 0.9);
    fade.addColorStop(0, "rgba(4, 3, 8, 0.2)");
    fade.addColorStop(1, "rgba(4, 3, 8, 1)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = fade;
    ctx.fillRect(0, floor, this.width, this.height - floor);
  }
}
