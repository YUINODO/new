import { siteConfig } from "@/lib/site-config";
import type { ContactFormValues } from "@/lib/validation";

type SendContactEmailInput = Omit<ContactFormValues, "website">;

// メール送信は Resend (https://resend.com) を利用する想定。
// RESEND_API_KEY が未設定の場合はコンソールへの出力のみを行い、
// ローカル開発やAPIキー未発行の段階でもフォームの動作確認ができるようにしている。
export async function sendContactEmail(values: SendContactEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_NOTIFICATION_EMAIL ?? siteConfig.email;

  if (!apiKey) {
    console.info("[contact] RESEND_API_KEY is not set. Skipping email send.", {
      to: toEmail,
      values,
    });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? `no-reply@${new URL(siteConfig.url).hostname}`,
      to: toEmail,
      reply_to: values.email,
      subject: `【お問い合わせ】${values.inquiryType} - ${values.name}様`,
      text: [
        `お問い合わせ種別: ${values.inquiryType}`,
        `会社名: ${values.company || "(未入力)"}`,
        `お名前: ${values.name}`,
        `メールアドレス: ${values.email}`,
        `電話番号: ${values.phone || "(未入力)"}`,
        "",
        "お問い合わせ内容:",
        values.message,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${body}`);
  }
}
