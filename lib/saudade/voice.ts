/**
 * マイクの音を「声」と「息」に聞き分ける簡易センサー。
 * 声は倍音があり、スペクトルに山がある。息は「サー」「ボッ」という雑音で、平らか低音に偏る。
 * 音は端末の外へ送信しない。
 */

import type { Sound } from "./engine";

export type VoiceDebug = Sound & { level: number; noisiness: number };

export class VoiceSensor {
  private readonly context: AudioContext;
  private readonly stream: MediaStream;
  private readonly analyser: AnalyserNode;
  private readonly wave: Float32Array<ArrayBuffer>;
  private readonly spectrum: Float32Array<ArrayBuffer>;
  /** 部屋の静けさ（dB）。周囲の音に合わせて少しずつ学習する */
  private floor = -55;
  private level = 0;
  private noisiness = 0;

  private constructor(context: AudioContext, stream: MediaStream) {
    this.context = context;
    this.stream = stream;
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.5;
    context.createMediaStreamSource(stream).connect(this.analyser);
    this.wave = new Float32Array(this.analyser.fftSize);
    this.spectrum = new Float32Array(this.analyser.frequencyBinCount);
  }

  static async start(): Promise<VoiceSensor> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "このページではマイクを使えません。http://localhost:3000 で開いているか確認してください。",
      );
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      // 息の「サー」という音を雑音として消されないよう、補正はすべて切る
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
    const context = new AudioContext();
    await context.resume();
    return new VoiceSensor(context, stream);
  }

  read(dt: number): VoiceDebug {
    const a = this.analyser;
    a.getFloatTimeDomainData(this.wave);
    let sum = 0;
    for (const v of this.wave) sum += v * v;
    const db = 10 * Math.log10(sum / this.wave.length + 1e-12);

    // 静かなときは素早く、音があるときはごくゆっくり床を上げる
    this.floor = db < this.floor ? this.floor + (db - this.floor) * Math.min(1, dt * 2) : this.floor + dt * 0.3;
    const target = Math.min(1, Math.max(0, (db - this.floor - 8) / 28));
    this.level += (target - this.level) * Math.min(1, dt * (target > this.level ? 20 : 6));

    a.getFloatFrequencyData(this.spectrum);
    const hz = this.context.sampleRate / a.fftSize;
    const lo = Math.round(150 / hz);
    const hi = Math.round(5000 / hz);
    const bass = Math.round(150 / hz);
    let logSum = 0;
    let linSum = 0;
    let bassSum = 0;
    let total = 0;
    for (let i = 1; i < hi; i++) {
      const m = Math.pow(10, this.spectrum[i] / 20);
      total += m;
      if (i < bass) bassSum += m;
      if (i >= lo) {
        logSum += Math.log(m + 1e-12);
        linSum += m;
      }
    }
    const n = hi - lo;
    const flatness = Math.exp(logSum / n) / (linSum / n + 1e-12);
    const rumble = bassSum / (total + 1e-12);
    const noisy = Math.max(
      Math.min(1, Math.max(0, (flatness - 0.22) / 0.3)),
      Math.min(1, Math.max(0, (rumble - 0.45) / 0.3)),
    );
    this.noisiness += (noisy - this.noisiness) * Math.min(1, dt * 8);

    return {
      voice: this.level * (1 - this.noisiness),
      breath: this.level * this.noisiness,
      level: this.level,
      noisiness: this.noisiness,
    };
  }

  stop() {
    for (const track of this.stream.getTracks()) track.stop();
    void this.context.close();
  }
}
