"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function DriftPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE}/reviews/drift`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setError(await resp.text());
        return;
      }
      setData(await resp.json());
    });
  }, []);

  return (
    <div className="p-8 text-[#f5f3ee]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Brand Drift Radar</h1>
        <p className="text-sm text-[#94a3b8]">
          Repeated violations and unclear rules across submissions.
        </p>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {data && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
              <div className="text-xs text-[#64748b] uppercase mb-1">
                Total findings
              </div>
              <div className="text-3xl font-bold">{data.total_findings}</div>
            </div>
            <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
              <div className="text-xs text-[#64748b] uppercase mb-1">
                Expired claims detected
              </div>
              <div className="text-3xl font-bold text-amber-400">
                {data.expired_claims_total}
              </div>
            </div>
            <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
              <div className="text-xs text-[#64748b] uppercase mb-1">
                Reviewer overrides
              </div>
              <div className="text-3xl font-bold text-[#22d3ee]">
                {data.reviewer_overrides_total}
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg mb-6">
            <h2 className="font-bold mb-4">Most violated rules</h2>
            <div className="space-y-2">
              {data.most_violated_rules.map((r: any) => {
                const max = data.most_violated_rules[0].count;
                const pct = (r.count / max) * 100;
                return (
                  <div key={r.rule}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-mono text-[#fbbf24]">{r.rule}</span>
                      <span className="text-[#94a3b8]">{r.count}</span>
                    </div>
                    <div className="h-2 bg-[#1f2a3f] rounded overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 bg-[#0f172a] border-l-4 border-[#22d3ee] rounded-lg">
            <p className="text-sm text-[#f5f3ee]">
              <span className="font-bold">Insight: </span>
              {data.insight}
            </p>
          </div>
        </>
      )}
    </div>
  );
}