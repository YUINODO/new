/**
 * Webカメラのフレーム差分から「手を伸ばす動き」を検出する簡易センサー。
 * 外部ライブラリなしで動く。映像は端末の外へ送信しない。
 */

const W = 64;
const H = 48;
const THRESHOLD = 30;
const MIN_PIXELS = 18;

export type MotionReading = {
  /** 0..1（鏡像）*/
  x: number;
  y: number;
  /** 0..0.95 — マウス（1）と区別するため 1 未満に抑える */
  strength: number;
};

export class MotionSensor {
  private readonly video: HTMLVideoElement;
  private readonly stream: MediaStream;
  private readonly ctx: CanvasRenderingContext2D;
  private prev: Uint8Array | null = null;
  private readonly gray = new Uint8Array(W * H);

  private constructor(video: HTMLVideoElement, stream: MediaStream) {
    this.video = video;
    this.stream = stream;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  }

  static async start(): Promise<MotionSensor> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "このページではカメラを使えません。http://localhost:3000 で開いているか確認してください（http://172.… などのアドレスでは使えません）。",
      );
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: "user" },
      audio: false,
    });
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    return new MotionSensor(video, stream);
  }

  read(): MotionReading | null {
    if (this.video.readyState < 2) return null;
    this.ctx.drawImage(this.video, 0, 0, W, H);
    const data = this.ctx.getImageData(0, 0, W, H).data;
    const gray = this.gray;
    for (let i = 0; i < W * H; i++) {
      gray[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
    }

    const prev = this.prev;
    this.prev = gray.slice();
    if (!prev) return null;

    let count = 0;
    let sx = 0;
    let sy = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (Math.abs(gray[i] - prev[i]) > THRESHOLD) {
          count++;
          sx += x;
          sy += y;
        }
      }
    }
    if (count < MIN_PIXELS) return null;

    return {
      x: 1 - sx / count / W,
      y: sy / count / H,
      strength: Math.min(0.95, count / 260),
    };
  }

  stop() {
    for (const track of this.stream.getTracks()) track.stop();
    this.video.srcObject = null;
  }
}
