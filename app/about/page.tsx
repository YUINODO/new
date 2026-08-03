import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "会社概要",
  description: "会社概要、ビジョン・ミッション、会社情報を掲載しています。",
};

const companyInfo = [
  { label: "会社名", value: siteConfig.nameJa },
  { label: "設立", value: "2026年◯月◯日" },
  { label: "代表者", value: "代表取締役 ◯◯ ◯◯" },
  { label: "所在地", value: "東京都◯◯区◯◯ 1-1-1" },
  { label: "資本金", value: "◯◯◯万円" },
  { label: "事業内容", value: "AIを活用したソフトウェアの開発・提供" },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          会社概要
        </h1>

        <div className="mt-12">
          <h2 className="text-xl font-semibold">ビジョン・ミッション</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            私たちは、AI技術によって誰もが質の高い意思決定を行える社会を目指しています。
            経験や勘に頼っていた判断を、データとAIの力で再現可能なものへと変え、
            あらゆる組織の意思決定スピードを加速させます。
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold">代表メッセージ</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            「AIの力で、意思決定という最も難しい仕事をもっとシンプルにしたい」。
            そんな想いから私たちは創業しました。現場で本当に使われるプロダクトを、
            誠実に作り続けます。
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            代表取締役 ◯◯ ◯◯
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold">会社情報</h2>
          <dl className="mt-4 divide-y divide-black/5 dark:divide-white/10">
            {companyInfo.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-4"
              >
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </dt>
                <dd className="sm:col-span-3">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
