import type { Metadata } from "next";
import Link from "next/link";
import CtaSection from "@/components/sections/CtaSection";

export const metadata: Metadata = {
  title: "サービス",
  description: "サービスの概要、特徴、導入までの流れをご紹介します。",
};

const features = [
  {
    title: "データ統合",
    description:
      "社内外に散らばるデータソースを自動で収集・統合し、常に最新の状態を保ちます。",
  },
  {
    title: "AI分析",
    description:
      "機械学習モデルが傾向やリスクを検知し、意思決定に必要な示唆をわかりやすく提示します。",
  },
  {
    title: "レポート自動生成",
    description:
      "分析結果を自然言語のレポートとして自動出力し、関係者への共有を効率化します。",
  },
  {
    title: "API連携",
    description:
      "既存の業務システムとAPIで連携し、日々のワークフローにそのまま組み込めます。",
  },
];

const steps = [
  {
    step: "01",
    title: "お問い合わせ・ヒアリング",
    description: "現状の課題や利用中のツールについてヒアリングします。",
  },
  {
    step: "02",
    title: "トライアル導入",
    description: "実データを用いた小規模なトライアルで効果を検証します。",
  },
  {
    step: "03",
    title: "本導入・運用開始",
    description: "本格導入後も、専任担当者が運用をサポートします。",
  },
];

export default function ServicePage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          サービス紹介
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          データ収集からAI分析、レポーティングまでを一気通貫で行うプロダクトです。
          専門知識がなくても、誰もが高速に意思決定できる環境を提供します。
        </p>

        <div className="mt-16">
          <h2 className="text-xl font-semibold">機能・特徴</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-black/5 p-6 dark:border-white/10"
              >
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-semibold">導入までの流れ</h2>
          <div className="mt-6 space-y-6">
            {steps.map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="text-xl font-bold text-indigo-500">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-semibold">料金体系</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            ご利用規模・データ量に応じたプランをご用意しています。詳細は
            <Link href="/contact" className="mx-1 underline underline-offset-2">
              お問い合わせフォーム
            </Link>
            よりお気軽にご相談ください。
          </p>
        </div>
      </section>

      <CtaSection
        title="サービスについて詳しく知りたい方へ"
        description="トライアル導入や料金体系など、詳しい資料をご案内します。"
      />
    </>
  );
}
