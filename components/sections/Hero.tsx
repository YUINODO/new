import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-black">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24 sm:py-32">
        <p className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
          AI Startup
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          {siteConfig.tagline}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          私たちは、現場の意思決定をAIで支援するプロダクトを開発しています。
          データに基づいた判断を、もっと速く、もっと簡単に。
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            お問い合わせはこちら
          </Link>
          <Link
            href="/service"
            className="rounded-full border border-zinc-300 px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            サービスを見る
          </Link>
        </div>
      </div>
    </section>
  );
}
