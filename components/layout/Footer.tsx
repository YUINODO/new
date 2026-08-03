import Link from "next/link";
import { navItems, siteConfig } from "@/lib/site-config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div>
          <p className="text-lg font-bold tracking-tight">{siteConfig.name}</p>
          <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            {siteConfig.tagline}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/privacy-policy"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            プライバシーポリシー
          </Link>
        </div>
      </div>

      <div className="border-t border-black/5 px-6 py-4 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-500">
        <p className="mx-auto max-w-6xl">
          &copy; {year} {siteConfig.nameJa}
        </p>
      </div>
    </footer>
  );
}
