"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [drift, setDrift] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [driftResp, queueResp] = await Promise.all([
        fetch(`${API_BASE}/reviews/drift`, { headers }),
        fetch(`${API_BASE}/reviews/queue`, { headers }),
      ]);

      if (driftResp.ok) setDrift(await driftResp.json());
      if (queueResp.ok) setQueue(await queueResp.json());
    });
  }, []);

  return (
    <div className="p-8 text-[#f5f3ee]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Welcome back</h1>
        <p className="text-[#94a3b8]">
          Brand health at a glance.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Pending review</div>
          <div className="text-3xl font-bold text-amber-400">
            {queue?.count ?? "—"}
          </div>
        </div>
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Total findings</div>
          <div className="text-3xl font-bold">{drift?.total_findings ?? "—"}</div>
        </div>
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Expired claims</div>
          <div className="text-3xl font-bold text-red-400">
            {drift?.expired_claims_total ?? "—"}
          </div>
        </div>
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Overrides</div>
          <div className="text-3xl font-bold text-[#22d3ee]">
            {drift?.reviewer_overrides_total ?? "—"}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/submit"
          className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg hover:border-[#2563eb] transition group"
        >
          <div className="text-2xl mb-2">✎</div>
          <h3 className="font-bold mb-1 group-hover:text-[#22d3ee]">
            Submit content
          </h3>
          <p className="text-sm text-[#94a3b8]">
            Check a statement against approved guidelines.
          </p>
        </Link>
        <Link
          href="/review"
          className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg hover:border-[#2563eb] transition group"
        >
          <div className="text-2xl mb-2">☑</div>
          <h3 className="font-bold mb-1 group-hover:text-[#22d3ee]">
            Review queue
          </h3>
          <p className="text-sm text-[#94a3b8]">
            Decide on MEDIUM and HIGH findings.
          </p>
        </Link>
        <Link
          href="/drift"
          className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg hover:border-[#2563eb] transition group"
        >
          <div className="text-2xl mb-2">◉</div>
          <h3 className="font-bold mb-1 group-hover:text-[#22d3ee]">
            Brand Drift Radar
          </h3>
          <p className="text-sm text-[#94a3b8]">
            See recurring violations and unclear rules.
          </p>
        </Link>
        <Link
          href="/submit"
          className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg hover:border-[#2563eb] transition group"
        >
          <div className="text-2xl mb-2">+</div>
          <h3 className="font-bold mb-1 group-hover:text-[#22d3ee]">
            Recent submission
          </h3>
          <p className="text-sm text-[#94a3b8]">
            Open the last passport and review decisions.
          </p>
        </Link>
      </div>
    </div>
  );
}