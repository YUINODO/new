"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SaudadeEngine } from "@/lib/saudade/engine";
import { MotionSensor } from "@/lib/saudade/motion";

type CameraState = "off" | "starting" | "on" | "error";

/** カメラの動きが途切れても、手の気配をしばらく保つ（秒）*/
const CAMERA_HOLD = 0.5;
/** 右上のこの範囲に手が来たときだけ、操作アイコンが浮かぶ（px）*/
const CONTROLS_ZONE = 160;

export default function SaudadeExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SaudadeEngine | null>(null);
  const sensorRef = useRef<MotionSensor | null>(null);

  const [camera, setCamera] = useState<CameraState>("off");
  const [controlsVisible, setControlsVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SaudadeEngine(canvas);
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

  const revealControls = useCallback((e: React.PointerEvent) => {
    setControlsVisible(e.clientX > window.innerWidth - CONTROLS_ZONE && e.clientY < CONTROLS_ZONE);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    revealControls(e);
    if (sensorRef.current) return;
    engineRef.current?.setHand({ x: e.clientX, y: e.clientY, strength: 1 });
  }, [revealControls]);

  const onPointerLeave = useCallback(() => {
    setControlsVisible(false);
    if (sensorRef.current) return;
    engineRef.current?.setHand(null);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    revealControls(e);
    engineRef.current?.setHand({ x: e.clientX, y: e.clientY, strength: 1 });
    engineRef.current?.touch(e.clientX, e.clientY);
  }, [revealControls]);

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
    } catch (error) {
      // 画面には文字を出さず、理由は開発者ツールのコンソールに残す
      console.warn("[saudade] カメラを起動できませんでした:", error);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "c" || e.key === "C") void toggleCamera();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCamera, toggleFullscreen]);

  const iconButton =
    "cursor-pointer rounded-full p-2 text-white/40 transition-colors hover:text-white/80 disabled:opacity-40";

  return (
    <div
      className="fixed inset-0 z-[100] cursor-none touch-none select-none overflow-hidden bg-[rgb(4,3,8)]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {/* キャンバスの純粋な黒に、夜の色味をのせる */}
      <div className="pointer-events-none absolute inset-0 bg-[rgb(4,3,8)] mix-blend-lighten" aria-hidden />
      <h1 className="sr-only">saudade — 触れようとすると消える光</h1>

      <div
        className={`absolute right-4 top-4 flex gap-1 transition-opacity duration-700 ${controlsVisible ? "cursor-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleCamera}
          disabled={camera === "starting"}
          aria-label={camera === "on" ? "カメラを止める" : "カメラで体験する"}
          aria-pressed={camera === "on"}
          className={`${iconButton} ${camera === "on" ? "text-[rgb(255,196,140)]/80" : ""}`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
            <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
            <circle cx="12" cy="13" r="3.5" />
            {camera === "error" && <path d="M4 4l16 16" />}
          </svg>
        </button>
        <button type="button" onClick={toggleFullscreen} aria-label="全画面" className={iconButton}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
