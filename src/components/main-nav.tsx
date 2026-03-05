"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/memories", label: "Memories" },
  { href: "/documents", label: "Documents" },
  { href: "/team", label: "Team/Org" },
  { href: "/jobs", label: "Jobs" },
  { href: "/office", label: "Office" },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              isActive
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border bg-panel text-foreground hover:border-accent/70",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
