"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { submitContent } from "@/lib/api";

type Finding = {
  id: string;
  verdict: string;
  risk_tier: string;
  flagged_span: string;
  rule_id: string | null;
  explanation: string;
  suggested_fix: string;
  validator_status: string;
};

const VERDICT_COLOR: Record<string, string> = {
  SUPPORTED: "bg-green-600",
  CONTRADICTED: "bg-red-600",
  EXPIRED: "bg-amber-600",
  UNVERIFIABLE: "bg-slate-600",
  NEEDS_HUMAN: "bg-blue-600",
};

const RISK_COLOR: Record<string, string> = {
  HIGH: "text-red-400",
  MEDIUM: "text-amber-400",
  LOW: "text-green-400",
};

const STEPS = [
  "Retrieving approved guidelines...",
  "Running rule engine...",
  "Analysing with AI...",
  "Validating citations...",
];

export default function SubmitPage() {
  const router = useRouter();
  const [content, setContent] = useState(
    "Meet Acme Fit, your daily home workout partner. The app is guaranteed to be the #1 rated fitness app in India. Start your free plan today."
  );
  const [findings, setFindings] = useState<Finding[]>([]);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setReady(true);
    });
  }, [router]);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setFindings([]);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1200);

    try {
      const data = await submitContent(content);
      setFindings(data.findings);
      setSubmissionId(data.submission_id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  if (!ready) return <div className="min-h-screen bg-[#0b1220]" />;

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f5f3ee] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Submit content for review</h1>
            <p className="text-sm text-[#94a3b8]">
              Every finding is backed by an approved source.
            </p>
          </div>
          <button
            onClick={() => router.push("/review")}
            className="px-4 py-2 bg-[#1f2a3f] rounded hover:bg-[#2d3b57] text-sm"
          >
            Review queue →
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full p-4 bg-[#0f172a] border border-[#1f2a3f] rounded text-[#f5f3ee] mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-[#2563eb] rounded font-semibold hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analysing...
            </span>
          ) : (
            "Submit for review"
          )}
        </button>

        {loading && (
          <div className="mt-6 p-5 border border-[#1f2a3f] rounded bg-[#0f172a]">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    i < currentStep
                      ? "bg-green-600 text-white"
                      : i === currentStep
                      ? "bg-[#2563eb] text-white animate-pulse"
                      : "bg-[#1f2a3f] text-[#64748b]"
                  }`}
                >
                  {i < currentStep ? "✓" : i + 1}
                </span>
                <span
                  className={i <= currentStep ? "text-[#f5f3ee]" : "text-[#64748b]"}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-4 text-red-400">{error}</p>}

        {findings.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {findings.length} finding{findings.length !== 1 ? "s" : ""}
              </h2>
              {submissionId && (
                <button
                  onClick={() => router.push(`/passport/${submissionId}`)}
                  className="px-4 py-2 bg-[#1f2a3f] rounded hover:bg-[#2d3b57] text-sm"
                >
                  View passport →
                </button>
              )}
            </div>

            <div className="space-y-3">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="border border-[#1f2a3f] rounded bg-[#0f172a] overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2a3f] bg-[#0b1220]/40">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                          VERDICT_COLOR[f.verdict] || "bg-slate-600"
                        }`}
                      >
                        {f.verdict}
                      </span>
                      <span className="text-xs text-[#64748b] font-mono">
                        {f.rule_id || "LLM"}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        RISK_COLOR[f.risk_tier] || "text-[#94a3b8]"
                      }`}
                    >
                      {f.risk_tier}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <div className="mb-3">
                      <span className="text-xs uppercase text-[#64748b] tracking-wide">
                        Flagged
                      </span>
                      <div className="mt-1">
                        <span className="font-mono text-[#fbbf24] bg-[#0b1220] px-2 py-1 rounded text-sm">
                          "{f.flagged_span}"
                        </span>
                      </div>
                    </div>

                    <p className="text-sm mb-3 leading-relaxed">{f.explanation}</p>

                    <div className="text-sm bg-[#0b1220] border-l-2 border-[#22d3ee] px-3 py-2 rounded">
                      <span className="font-semibold text-[#22d3ee] text-xs uppercase tracking-wide">
                        Suggested fix
                      </span>
                      <p className="text-[#94a3b8] mt-1">{f.suggested_fix}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1f2a3f] text-xs text-[#64748b] flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          f.validator_status === "passed"
                            ? "bg-green-500"
                            : f.validator_status === "downgraded"
                            ? "bg-amber-500"
                            : "bg-[#64748b]"
                        }`}
                      />
                      Citation validator: {f.validator_status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}