const problems = [
  {
    title: "情報が散らばっている",
    description:
      "必要なデータが複数のツールに分散し、意思決定に時間がかかっている。",
  },
  {
    title: "属人化した判断",
    description:
      "経験や勘に頼った判断がブラックボックス化し、再現性がない。",
  },
  {
    title: "スピード不足",
    description:
      "分析・レポート作成に工数がかかり、変化への対応が遅れてしまう。",
  },
];

export default function ProblemStatement() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        こんな課題はありませんか？
      </h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {problems.map((problem) => (
          <div key={problem.title}>
            <h3 className="text-lg font-semibold">{problem.title}</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {problem.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
