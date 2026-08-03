const services = [
  {
    title: "データ統合",
    description: "散在するデータソースを自動で集約し、常に最新の状態を保ちます。",
  },
  {
    title: "AI分析",
    description: "機械学習モデルが傾向を検知し、意思決定に必要な示唆を提示します。",
  },
  {
    title: "レポート自動生成",
    description: "分析結果を自然言語のレポートとして自動出力し、共有を効率化します。",
  },
  {
    title: "API連携",
    description: "既存の業務システムとAPIで連携し、ワークフローに組み込めます。",
  },
];

export default function ServiceCards() {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          サービスの特徴
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-black"
            >
              <h3 className="text-base font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
