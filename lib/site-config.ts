export const siteConfig = {
  name: "AI Startup",
  nameJa: "株式会社AIスタートアップ（仮）",
  tagline: "AIで、意思決定のスピードを変える。",
  description:
    "AIスタートアップのコーポレートサイトです。プロダクト紹介、会社情報、お問い合わせを掲載しています。",
  url: "https://example.com",
  email: "contact@example.com",
};

export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "会社概要", href: "/about" },
  { label: "サービス", href: "/service" },
  { label: "お問い合わせ", href: "/contact" },
];
