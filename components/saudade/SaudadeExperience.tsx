"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SaudadeEngine } from "@/lib/saudade/engine";
import { MotionSensor } from "@/lib/saudade/motion";

type CameraState = "off" | "starting" | "on" | "error";
type Moment = { id: number; label: string };

const MAX_MOMENTS = 7;
/** カメラの動きが途切れても、手の気配をしばらく保つ（秒）*/
const CAMERA_HOLD = 0.5;

function formatMoment(date: Date) {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

export default function SaudadeExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SaudadeEngine | null>(null);
  const sensorRef = useRef<MotionSensor | null>(null);
  const momentId = useRef(0);

  const [moments, setMoments] = useState<Moment[]>([]);
  const [touched, setTouched] = useState(false);
  const [camera, setCamera] = useState<CameraState>("off");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SaudadeEngine(canvas, {
      onMoment: (time) => {
        setTouched(true);
        setMoments((prev) =>
          [{ id: momentId.current++, label: formatMoment(time) }, ...prev].slice(0, MAX_MOMENTS),
        );
      },
    });
    engineRef.current = engine;

    const resize = () => engine.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    resize();
    window.addEventListener("resize", resize);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let raf = 0;
    let lastSeen = -Infinity;
    const loop = (now: number) => {
      const sensor = sensorRef.current;
      if (sensor) {
        const reading = sensor.read();
        if (reading) {
          lastSeen = now;
          engine.setHand({
            x: reading.x * window.innerWidth,
            y: reading.y * window.innerHeight,
            strength: reading.strength,
          });
        } else if (now - lastSeen > CAMERA_HOLD * 1000) {
          engine.setHand(null);
        }
      }
      engine.frame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.body.style.overflow = previousOverflow;
      sensorRef.current?.stop();
      sensorRef.current = null;
      engineRef.current = null;
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (sensorRef.current) return;
    engineRef.current?.setHand({ x: e.clientX, y: e.clientY, strength: 1 });
  }, []);

  const onPointerLeave = useCallback(() => {
    if (sensorRef.current) return;
    engineRef.current?.setHand(null);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    engineRef.current?.setHand({ x: e.clientX, y: e.clientY, strength: 1 });
    engineRef.current?.touch(e.clientX, e.clientY);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (sensorRef.current) {
      sensorRef.current.stop();
      sensorRef.current = null;
      engineRef.current?.setHand(null);
      setCamera("off");
      return;
    }
    setCamera("starting");
    try {
      sensorRef.current = await MotionSensor.start();
      setCamera("on");
    } catch {
      setCamera("error");
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] cursor-none touch-none select-none overflow-hidden bg-[rgb(4,3,8)] text-[rgb(236,222,205)]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6 sm:p-8">
        <div>
          <h1 className="font-serif text-lg italic tracking-[0.2em] text-white/70">saudade</h1>
          <p className="mt-1 text-[11px] tracking-[0.25em] text-white/35">もう二度と戻らないものへ</p>
        </div>
        <div className="pointer-events-auto flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={toggleCamera}
            disabled={camera === "starting"}
            className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-[11px] tracking-widest text-white/50 transition-colors hover:border-white/40 hover:text-white/80"
          >
            {camera === "on" ? "カメラ停止" : camera === "starting" ? "起動中…" : "カメラで体験"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-[11px] tracking-widest text-white/50 transition-colors hover:border-white/40 hover:text-white/80"
          >
            全画面
          </button>
        </div>
      </div>

      <p
        className={`pointer-events-none absolute inset-x-0 bottom-10 text-center text-xs tracking-[0.4em] text-white/40 transition-opacity duration-[3000ms] ${touched ? "opacity-0" : "opacity-100"}`}
      >
        {camera === "on" ? "カメラに向かって、手を伸ばしてみてください" : "手を伸ばして、触れてみてください"}
      </p>
      {camera === "error" && (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[11px] text-white/40">
          カメラを利用できませんでした
        </p>
      )}

      <ol className="pointer-events-none absolute bottom-6 right-6 text-right font-mono text-[11px] leading-6 sm:bottom-8 sm:right-8">
        {moments.map((m, i) => (
          <li key={m.id} style={{ opacity: 0.55 * (1 - i / MAX_MOMENTS) }} className="animate-[saudade-in_2s_ease-out]">
            {m.label} <span className="font-sans tracking-widest">— もう戻らない</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
