"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/entry", label: "Daily Entry" },
  { href: "/reports", label: "Reports" },
  { href: "/recruiters", label: "Recruiters" },
  { href: "/vendors", label: "Vendors" },
  { href: "/roles", label: "Roles" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
            LatentBridge Recruitment
          </span>
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-white/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
