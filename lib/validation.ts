import { z } from "zod";

export const inquiryTypes = [
  "サービスについて",
  "取材・広報について",
  "採用について",
  "業務提携について",
  "その他",
] as const;

export const contactFormSchema = z.object({
  inquiryType: z.enum(inquiryTypes, {
    message: "お問い合わせ種別を選択してください。",
  }),
  company: z.string().max(100, "100文字以内で入力してください。").optional().or(z.literal("")),
  name: z
    .string()
    .min(1, "お名前を入力してください。")
    .max(50, "50文字以内で入力してください。"),
  email: z.string().min(1, "メールアドレスを入力してください。").email("メールアドレスの形式が正しくありません。"),
  phone: z
    .string()
    .max(20, "20文字以内で入力してください。")
    .regex(/^[0-9-]*$/, "電話番号は数字とハイフンのみ使用できます。")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "お問い合わせ内容は10文字以上で入力してください。")
    .max(2000, "お問い合わせ内容は2000文字以内で入力してください。"),
  agreedToPrivacyPolicy: z.literal(true, {
    message: "プライバシーポリシーへの同意が必要です。",
  }),
  // ハニーポット: bot対策用の非表示項目。人間には空欄のまま送信される想定。
  website: z.string().max(0, "不正な送信を検知しました。").optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export type ContactFormFieldErrors = Partial<
  Record<keyof ContactFormValues, string>
>;
