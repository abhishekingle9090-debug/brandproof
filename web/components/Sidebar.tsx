"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/submit", label: "Submit", icon: "✎" },
  { href: "/review", label: "Review Queue", icon: "☑" },
  { href: "/drift", label: "Drift Radar", icon: "◉" },
  { href: "/audit", label: "Audit Log", icon: "≡" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0f172a] border-r border-[#1f2a3f] flex flex-col p-4">
      <div className="mb-8">
        <Link href="/dashboard" className="block">
          <h1 className="text-xl font-bold text-[#f5f3ee]">BrandProof</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Evidence-backed governance
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
                active
                  ? "bg-[#2563eb] text-white"
                  : "text-[#94a3b8] hover:bg-[#1f2a3f] hover:text-[#f5f3ee]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-4 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#f5f3ee] hover:bg-[#1f2a3f] rounded text-left"
      >
        Sign out
      </button>
    </aside>
  );
}