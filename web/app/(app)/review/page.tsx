"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getQueue, decideFinding } from "@/lib/api";

type Finding = {
  id: string;
  verdict: string;
  risk_tier: string;
  flagged_span: string;
  rule_id: string | null;
  explanation: string;
  suggested_fix: string;
};

const VERDICT_COLOR: Record<string, string> = {
  SUPPORTED: "bg-green-600",
  CONTRADICTED: "bg-red-600",
  EXPIRED: "bg-amber-600",
  UNVERIFIABLE: "bg-slate-600",
};

export default function ReviewPage() {
  const router = useRouter();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getQueue();
      setFindings(data.findings);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setReady(true);
        load();
      }
    });
  }, [router]);

  async function handleDecision(id: string, decision: string) {
    try {
      await decideFinding(id, decision, decision === "rejected" ? "Not supported by evidence" : "");
      setFindings(findings.filter((f) => f.id !== id));
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  }

  if (!ready) return <div className="min-h-screen bg-[#0b1220]" />;

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f5f3ee] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Review queue</h1>
            <p className="text-sm text-[#94a3b8]">
              MEDIUM and HIGH findings require an authorised decision.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/submit")}
              className="px-4 py-2 bg-[#1f2a3f] rounded hover:bg-[#2d3b57]"
            >
              ← Submit
            </button>
            <button
              onClick={load}
              className="px-4 py-2 bg-[#1f2a3f] rounded hover:bg-[#2d3b57]"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <p className="text-[#94a3b8]">Loading findings...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && findings.length === 0 && (
          <div className="p-8 border border-[#1f2a3f] rounded bg-[#0f172a] text-center text-[#94a3b8]">
            No pending findings. All reviewed.
          </div>
        )}

        <div className="space-y-3">
          {findings.map((f) => (
            <div key={f.id} className="p-5 border border-[#1f2a3f] rounded bg-[#0f172a]">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                    VERDICT_COLOR[f.verdict] || "bg-slate-600"
                  }`}
                >
                  {f.verdict}
                </span>
                <span className="text-xs text-[#94a3b8]">
                  Risk: {f.risk_tier} · Rule: {f.rule_id || "—"}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-xs text-[#94a3b8]">Flagged: </span>
                <span className="font-mono text-[#fbbf24]">&quot;{f.flagged_span}&quot;</span>
              </div>
              <p className="text-sm mb-3">{f.explanation}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(f.id, "approved")}
                  className="px-4 py-2 bg-green-700 rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(f.id, "rejected")}
                  className="px-4 py-2 bg-red-700 rounded hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}