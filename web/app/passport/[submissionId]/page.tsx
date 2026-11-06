"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getPassport } from "@/lib/api";

type Passport = {
  submission_id: string;
  checks_run: string[];
  findings: {
    id: string;
    verdict: string;
    risk_tier: string;
    rule_id: string | null;
    decision: string | null;
    decided_by: string | null;
  }[];
  status: string;
  note: string;
};

const VERDICT_COLOR: Record<string, string> = {
  SUPPORTED: "bg-green-600",
  CONTRADICTED: "bg-red-600",
  EXPIRED: "bg-amber-600",
  UNVERIFIABLE: "bg-slate-600",
};

function PassportContent() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setReady(true);
      if (!submissionId) return;
      try {
        const data = await getPassport(submissionId);
        setPassport(data);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }, [router, submissionId]);

  if (!ready) return <div className="min-h-screen bg-[#0b1220]" />;

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f5f3ee] p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/review")}
          className="mb-6 text-sm text-[#94a3b8] hover:text-[#f5f3ee]"
        >
          ← Back to review queue
        </button>

        <div className="border border-[#1f2a3f] rounded-lg bg-[#0f172a] p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Publication Passport</h1>
              <p className="text-xs text-[#94a3b8]">
                Submission {passport?.submission_id?.slice(0, 8) || "—"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                passport?.status === "approved"
                  ? "bg-green-600"
                  : "bg-amber-600"
              }`}
            >
              {passport?.status || "loading"}
            </span>
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          {passport && (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase text-[#64748b] mb-2">Checks run</p>
                <div className="flex flex-wrap gap-2">
                  {passport.checks_run.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-1 bg-[#0b1220] border border-[#1f2a3f] rounded text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs uppercase text-[#64748b] mb-2">Findings</p>
                <div className="space-y-2">
                  {passport.findings.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 bg-[#0b1220] border border-[#1f2a3f] rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            VERDICT_COLOR[f.verdict] || "bg-slate-600"
                          }`}
                        >
                          {f.verdict}
                        </span>
                        <span className="text-sm">Rule {f.rule_id || "—"}</span>
                        <span className="text-xs text-[#94a3b8]">{f.risk_tier}</span>
                      </div>
                      <span
                        className={`text-xs ${
                          f.decision === "approved"
                            ? "text-green-400"
                            : f.decision === "rejected"
                            ? "text-red-400"
                            : "text-[#64748b]"
                        }`}
                      >
                        {f.decision || "pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#1f2a3f]">
                <p className="text-xs text-[#64748b]">{passport.note}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PassportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1220]" />}>
      <PassportContent />
    </Suspense>
  );
}