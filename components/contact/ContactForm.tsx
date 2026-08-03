"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  contactFormSchema,
  inquiryTypes,
  type ContactFormFieldErrors,
} from "@/lib/validation";

type SubmitState = "idle" | "submitting" | "success" | "error";

const initialValues = {
  inquiryType: "",
  company: "",
  name: "",
  email: "",
  phone: "",
  message: "",
  agreedToPrivacyPolicy: false,
  website: "",
};

export default function ContactForm() {
  const formId = useId();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<ContactFormFieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  function updateField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = contactFormSchema.safeParse({
      ...values,
      agreedToPrivacyPolicy: values.agreedToPrivacyPolicy || undefined,
    });

    if (!parsed.success) {
      const errors: ContactFormFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in errors)) {
          errors[key as keyof ContactFormFieldErrors] = issue.message;
        }
      }
      setFieldErrors(errors);
      setSubmitState("error");
      setSubmitMessage("入力内容をご確認ください。");
      return;
    }

    setFieldErrors({});
    setSubmitState("submitting");
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setSubmitState("error");
        setSubmitMessage(data.message ?? "送信に失敗しました。");
        return;
      }

      setSubmitState("success");
      setSubmitMessage(data.message ?? "送信しました。");
      setValues(initialValues);
    } catch {
      setSubmitState("error");
      setSubmitMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
    }
  }

  if (submitState === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
          お問い合わせありがとうございます
        </p>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
          {submitMessage} 内容を確認の上、担当者よりご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ハニーポット: 人間には見えない項目。botが値を入れると送信は静かに破棄される。 */}
      <div className="absolute left-[-9999px] top-auto" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>ウェブサイト</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => updateField("website", event.target.value)}
        />
      </div>

      <Field label="お問い合わせ種別" htmlFor={`${formId}-inquiryType`} error={fieldErrors.inquiryType} required>
        <select
          id={`${formId}-inquiryType`}
          name="inquiryType"
          required
          className="form-input"
          value={values.inquiryType}
          onChange={(event) => updateField("inquiryType", event.target.value)}
        >
          <option value="" disabled>
            選択してください
          </option>
          {inquiryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <Field label="会社名・団体名" htmlFor={`${formId}-company`} error={fieldErrors.company}>
        <input
          id={`${formId}-company`}
          name="company"
          type="text"
          className="form-input"
          value={values.company}
          onChange={(event) => updateField("company", event.target.value)}
        />
      </Field>

      <Field label="お名前" htmlFor={`${formId}-name`} error={fieldErrors.name} required>
        <input
          id={`${formId}-name`}
          name="name"
          type="text"
          required
          className="form-input"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </Field>

      <Field label="メールアドレス" htmlFor={`${formId}-email`} error={fieldErrors.email} required>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          required
          className="form-input"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
      </Field>

      <Field label="電話番号" htmlFor={`${formId}-phone`} error={fieldErrors.phone}>
        <input
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          className="form-input"
          value={values.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />
      </Field>

      <Field label="お問い合わせ内容" htmlFor={`${formId}-message`} error={fieldErrors.message} required>
        <textarea
          id={`${formId}-message`}
          name="message"
          required
          rows={6}
          className="form-input"
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
        />
      </Field>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-zinc-300"
            checked={values.agreedToPrivacyPolicy}
            onChange={(event) => updateField("agreedToPrivacyPolicy", event.target.checked)}
          />
          <span>
            <Link href="/privacy-policy" className="underline underline-offset-2" target="_blank">
              プライバシーポリシー
            </Link>
            に同意する
          </span>
        </label>
        {fieldErrors.agreedToPrivacyPolicy && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.agreedToPrivacyPolicy}
          </p>
        )}
      </div>

      {submitState === "error" && submitMessage && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {submitMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={submitState === "submitting"}
        className="w-full rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {submitState === "submitting" ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, htmlFor, error, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
