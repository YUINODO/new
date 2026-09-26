"use client";

import { useEffect, useRef } from "react";
import { InstanteEngine } from "@/lib/saudade/instante";

export default function InstanteExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InstanteEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new InstanteEngine(canvas);
    engineRef.current = engine;
    const resize = () => engine.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    resize();
    window.addEventListener("resize", resize);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f") return;
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);

    let raf = 0;
    const loop = (now: number) => {
      engine.frame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] cursor-none touch-none select-none overflow-hidden bg-[rgb(5,5,9)]"
      onPointerMove={(e) => engineRef.current?.setPointer({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => {
        engineRef.current?.setPointer(null);
        engineRef.current?.setHolding(false);
      }}
      onPointerDown={(e) => {
        engineRef.current?.setPointer({ x: e.clientX, y: e.clientY });
        engineRef.current?.setHolding(true);
      }}
      onPointerUp={() => engineRef.current?.setHolding(false)}
      onPointerCancel={() => engineRef.current?.setHolding(false)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      <h1 className="sr-only">instante — 見つめるほど、時間は止まりかける</h1>
    </div>
  );
}
