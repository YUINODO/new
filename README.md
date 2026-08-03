# AI Startup コーポレートサイト

`docs/website-design.md` の設計書に基づいたコーポレートサイトです（Next.js App Router + TypeScript + Tailwind CSS）。

## ページ構成

- `/` トップページ
- `/about` 会社概要
- `/service` サービス紹介
- `/contact` お問い合わせフォーム
- `/privacy-policy` プライバシーポリシー

## 開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認できます。

## お問い合わせフォームのメール送信設定

`/contact` の送信内容は [Resend](https://resend.com) 経由でメール送信する構成になっています（`lib/mailer.ts`）。
`.env.example` を `.env.local` にコピーし、`RESEND_API_KEY` 等を設定してください。未設定の場合は送信内容をコンソールに出力するだけのフォールバック動作になり、ローカルでの動作確認は可能です。

```bash
cp .env.example .env.local
```

## ビルド・Lint

```bash
npm run build
npm run lint
```
