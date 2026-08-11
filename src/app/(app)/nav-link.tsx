"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-stone-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
