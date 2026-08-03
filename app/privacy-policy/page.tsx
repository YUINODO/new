import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "個人情報の取り扱いについて。",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        プライバシーポリシー
      </h1>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        制定日: 2026年8月3日
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        <p>
          {siteConfig.nameJa}（以下「当社」といいます）は、本ウェブサイト（以下「本サイト」といいます）
          における個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
        </p>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            1. 取得する情報
          </h2>
          <p className="mt-2">
            当社は、お問い合わせフォームの利用にあたり、氏名、会社名、メールアドレス、電話番号、
            お問い合わせ内容等の個人情報を取得します。
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            2. 利用目的
          </h2>
          <p className="mt-2">取得した個人情報は、以下の目的の範囲内で利用します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>お問い合わせへの回答、連絡</li>
            <li>サービスに関するご案内</li>
            <li>採用選考に関する連絡（採用に関するお問い合わせの場合）</li>
            <li>本サイトの改善、不正利用の防止</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            3. 第三者提供
          </h2>
          <p className="mt-2">
            当社は、法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            4. 委託
          </h2>
          <p className="mt-2">
            当社は、メール配信等の業務の一部を外部業者に委託する場合があります。この場合、
            委託先に対して適切な監督を行います。
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            5. 保管期間・削除
          </h2>
          <p className="mt-2">
            取得した個人情報は、利用目的の達成に必要な期間に限り保管し、期間経過後は適切に削除します。
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            6. 開示・訂正・削除等の請求
          </h2>
          <p className="mt-2">
            ご本人からの個人情報の開示、訂正、削除等のご請求については、下記のお問い合わせ窓口までご連絡ください。
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            7. お問い合わせ窓口
          </h2>
          <p className="mt-2">
            {siteConfig.nameJa}
            <br />
            E-mail: {siteConfig.email}
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            8. 本ポリシーの変更
          </h2>
          <p className="mt-2">
            当社は、必要に応じて本ポリシーの内容を変更することがあります。変更後の内容は本サイトに掲載した時点から効力を生じるものとします。
          </p>
        </div>
      </div>
    </section>
  );
}
