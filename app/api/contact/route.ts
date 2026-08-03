import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validation";
import { sendContactEmail } from "@/lib/mailer";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "送信回数の上限に達しました。しばらく経ってから再度お試しください。" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const result = contactFormSchema.safeParse(body);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    // ハニーポット項目に値が入っている場合はbotとみなし、成功したように見せて静かに破棄する。
    if (fieldErrors.website) {
      return NextResponse.json({ message: "送信しました。" }, { status: 200 });
    }

    return NextResponse.json(
      { message: "入力内容をご確認ください。", fieldErrors },
      { status: 400 }
    );
  }

  const { website, ...values } = result.data;
  void website;

  try {
    await sendContactEmail(values);
  } catch (error) {
    console.error("[contact] Failed to send email", error);
    return NextResponse.json(
      { message: "送信中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "送信しました。" }, { status: 200 });
}
