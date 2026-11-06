import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-[#f5f3ee]">
      {/* Hero */}
      <nav className="px-8 py-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="text-xl font-bold">BrandProof</div>
        <Link
          href="/login"
          className="px-5 py-2 bg-[#2563eb] rounded hover:bg-[#1d4ed8] text-sm font-semibold"
        >
          Sign in →
        </Link>
      </nav>

      <section className="max-w-4xl mx-auto px-8 pt-20 pb-24 text-center">
        <div className="inline-block px-3 py-1 bg-[#1f2a3f] rounded-full text-xs text-[#22d3ee] mb-6">
          AI-powered brand governance
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Every brand decision.
          <br />
          <span className="text-[#22d3ee]">Backed by evidence.</span>
        </h1>
        <p className="text-lg text-[#94a3b8] mb-10 max-w-2xl mx-auto">
          Organisations publish through employees, agencies and AI tools. Guidelines
          live in PDFs. Facts expire silently. BrandProof checks every statement
          against approved sources — and shows the evidence for every finding.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] font-semibold text-lg"
        >
          Try the live demo →
        </Link>
        <p className="mt-4 text-sm text-[#64748b]">
          Demo login: <code className="text-[#22d3ee]">demo@test.com</code> /{" "}
          <code className="text-[#22d3ee]">test123</code>
        </p>
      </section>

      {/* Three mechanisms */}
      <section className="max-w-6xl mx-auto px-8 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Evidence Ledger",
            desc: "Every finding cites the exact rule, source document and guideline version. No fabricated citations — the validator rejects any quote that is not verbatim in the source.",
            color: "border-[#22d3ee]",
          },
          {
            title: "Risk-Routed Review",
            desc: "LOW, MEDIUM and HIGH findings route to the right reviewer. HIGH items cannot be approved by a creator — enforced in the API, not the UI.",
            color: "border-[#fbbf24]",
          },
          {
            title: "Drift Radar",
            desc: "Aggregates repeated violations, expired claims and reviewer overrides. Shows where the guidelines themselves are unclear — a feedback loop static PDFs cannot provide.",
            color: "border-[#a78bfa]",
          },
        ].map((f) => (
          <div
            key={f.title}
            className={`p-6 bg-[#0f172a] border-l-4 ${f.color} rounded-lg`}
          >
            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Upload approved guidelines",
              desc: "Brand managers upload PDFs. Extracted, chunked, embedded.",
            },
            {
              step: "2",
              title: "Submit content",
              desc: "Creators submit text. Every statement is treated as a claim.",
            },
            {
              step: "3",
              title: "Hybrid verification",
              desc: "Rule engine for objective checks. Hybrid retrieval + LLM for interpretation. Citation validator rejects any quote not verbatim in the source.",
            },
            {
              step: "4",
              title: "Human decision",
              desc: "Risk-routed review. MEDIUM and HIGH findings require an authorised reviewer's recorded decision.",
            },
            {
              step: "5",
              title: "Publication Passport",
              desc: "An audit record of checks run, findings, decisions and timestamps. Not a certification — an evidence trail.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="flex gap-6 p-5 bg-[#0f172a] border border-[#1f2a3f] rounded-lg"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#2563eb] flex items-center justify-center font-bold">
                {s.step}
              </div>
              <div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-[#94a3b8]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1f2a3f] py-6 text-center text-sm text-[#64748b]">
        BrandProof · We Code Coders 2026 · Evidence-first brand governance
      </footer>
    </div>
  );
}