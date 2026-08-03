import Link from "next/link";

type CtaSectionProps = {
  title?: string;
  description?: string;
};

export default function CtaSection({
  title = "まずはお気軽にお問い合わせください",
  description = "サービス内容、導入のご相談、取材・採用に関するお問い合わせなど、どんな内容でも構いません。",
}: CtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-zinc-950 px-6 py-16 text-center dark:bg-white">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl dark:text-zinc-950">
          {title}
        </h2>
        <p className="max-w-xl text-sm text-zinc-300 dark:text-zinc-600">
          {description}
        </p>
        <Link
          href="/contact"
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
        >
          お問い合わせフォームへ
        </Link>
      </div>
    </section>
  );
}
