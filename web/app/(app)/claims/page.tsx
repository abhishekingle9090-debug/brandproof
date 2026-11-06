"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function ClaimsPage() {
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await user.getIdToken();
      const queries = ["claim expired", "ranking claim evidence", "prohibited terminology"];
      const all: any[] = [];
      for (const q of queries) {
        const r = await fetch(
          `${API_BASE}/guidelines/search?q=${encodeURIComponent(q)}&top_k=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (r.ok) {
          const data = await r.json();
          all.push(...(data.results || []));
        }
      }
      const seen = new Set();
      const deduped = all.filter((c) => {
        if (seen.has(c.chunk_id)) return false;
        seen.add(c.chunk_id);
        return true;
      });
      setChunks(deduped);
      setLoading(false);
    });
  }, []);

  const expired = chunks.filter(
    (c) =>
      c.content.toLowerCase().includes("expired") ||
      c.content.includes("2026-03-31") ||
      c.content.includes("31 March 2026")
  );
  const active = chunks.filter((c) => !expired.includes(c));

  return (
    <div className="p-8 text-[#f5f3ee]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Claims Registry</h1>
        <p className="text-sm text-[#94a3b8]">
          Every claim has an owner, an expiry date, and evidence. Expired claims
          are automatically flagged HIGH risk on every submission.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Active claims</div>
          <div className="text-3xl font-bold text-green-400">{active.length}</div>
        </div>
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Expired claims</div>
          <div className="text-3xl font-bold text-amber-400">{expired.length}</div>
        </div>
        <div className="p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <div className="text-xs text-[#64748b] uppercase mb-1">Total registry</div>
          <div className="text-3xl font-bold">{chunks.length}</div>
        </div>
      </div>

      {loading && <p className="text-[#94a3b8]">Loading claims...</p>}

      {expired.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm uppercase text-amber-400 mb-3 font-semibold">
            ⚠ Expired — must not be used
          </h2>
          <div className="space-y-2">
            {expired.map((c: any) => (
              <div
                key={c.chunk_id}
                className="p-4 bg-[#0f172a] border-l-4 border-amber-500 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#0b1220] text-[#22d3ee] rounded text-xs font-mono">
                    {c.metadata?.rule_id || "CLAIM"}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-semibold">
                    EXPIRED
                  </span>
                </div>
                <p className="text-sm text-[#94a3b8]">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm uppercase text-green-400 mb-3 font-semibold">
            ✓ Active — approved claims and rules
          </h2>
          <div className="space-y-2">
            {active.map((c: any) => (
              <div
                key={c.chunk_id}
                className="p-4 bg-[#0f172a] border-l-4 border-green-600 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#0b1220] text-[#22d3ee] rounded text-xs font-mono">
                    {c.metadata?.rule_id || "RULE"}
                  </span>
                  <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs font-semibold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-[#94a3b8]">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 bg-[#0f172a] border-l-4 border-[#22d3ee] rounded-lg">
        <p className="text-sm">
          <span className="font-bold text-[#22d3ee]">How this is enforced: </span>
          When a submission contains an expired claim, the rule engine flags it as{" "}
          <code className="text-amber-400">EXPIRED · HIGH</code>. It cannot be approved
          by a creator — only a reviewer can decide. See the submit page to test.
        </p>
      </div>
    </div>
  );
}