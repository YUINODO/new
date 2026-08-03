import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "サービス、採用、取材、業務提携に関するお問い合わせはこちらから。",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        お問い合わせ
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        サービスに関するご相談、取材・広報、採用、業務提携など、お気軽にお問い合わせください。
        内容を確認の上、担当者よりご連絡いたします。
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>
    </section>
  );
}
