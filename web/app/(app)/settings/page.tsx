"use client";

const SERVICES = [
  {
    name: "Firebase Authentication",
    purpose: "User identity and access tokens",
    data: "Email, hashed password, UID",
    retention: "Until user deletion",
    location: "Google Cloud",
  },
  {
    name: "Google Gemini (embeddings)",
    purpose: "Vector embeddings for guideline retrieval",
    data: "Guideline text chunks",
    retention: "Per API provider policy",
    location: "Google AI Studio",
  },
  {
    name: "Groq (LLM)",
    purpose: "Brand voice and claim analysis",
    data: "Retrieved excerpts only (not full guidelines)",
    retention: "Not trained on customer data",
    location: "Groq Inc.",
  },
  {
    name: "Supabase (PostgreSQL)",
    purpose: "Primary application database + pgvector",
    data: "Organisations, guidelines, findings, decisions",
    retention: "Organisation-controlled",
    location: "AWS",
  },
  {
    name: "Vercel (frontend)",
    purpose: "Next.js hosting",
    data: "Static assets, edge logs",
    retention: "30 days",
    location: "Vercel Inc.",
  },
  {
    name: "Render (backend)",
    purpose: "FastAPI hosting",
    data: "Runtime logs",
    retention: "7 days",
    location: "Render Inc.",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8 text-[#f5f3ee] max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Organisation Settings</h1>
        <p className="text-sm text-[#94a3b8]">
          Transparency, data handling, and AI disclosure.
        </p>
      </div>

      <div className="mb-8 p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
        <h2 className="font-bold mb-4">AI and external services</h2>
        <p className="text-sm text-[#94a3b8] mb-4">
          BrandProof uses the following services. Only the retrieved excerpts —
          not full guideline libraries — are sent to the LLM. No customer
          content is used for model training.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-[#64748b]">
              <tr className="border-b border-[#1f2a3f]">
                <th className="text-left py-2 pr-4">Service</th>
                <th className="text-left py-2 pr-4">Purpose</th>
                <th className="text-left py-2 pr-4">Data sent</th>
                <th className="text-left py-2 pr-4">Retention</th>
                <th className="text-left py-2">Location</th>
              </tr>
            </thead>
            <tbody className="text-[#94a3b8]">
              {SERVICES.map((s) => (
                <tr key={s.name} className="border-b border-[#1f2a3f]/50">
                  <td className="py-3 pr-4 font-semibold text-[#f5f3ee]">{s.name}</td>
                  <td className="py-3 pr-4">{s.purpose}</td>
                  <td className="py-3 pr-4">{s.data}</td>
                  <td className="py-3 pr-4">{s.retention}</td>
                  <td className="py-3">{s.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <h3 className="font-bold mb-3 text-[#22d3ee]">Data handling</h3>
          <ul className="text-sm text-[#94a3b8] space-y-2">
            <li>• TLS in transit for all API traffic</li>
            <li>• Encrypted at rest (Supabase / Render defaults)</li>
            <li>• Originals accessible only via short-lived signed URLs</li>
            <li>• Deletion removes files, chunks, and embeddings</li>
            <li>• Audit records retain identifiers only</li>
          </ul>
        </div>

        <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <h3 className="font-bold mb-3 text-[#22d3ee]">Human oversight</h3>
          <ul className="text-sm text-[#94a3b8] space-y-2">
            <li>• MEDIUM findings require reviewer or brand manager</li>
            <li>• HIGH findings require reviewer or admin</li>
            <li>• Creators cannot approve MEDIUM or HIGH findings</li>
            <li>• The system cannot declare content "compliant" — only a human can</li>
            <li>• All decisions are recorded with reviewer UID and timestamp</li>
          </ul>
        </div>
      </div>

      <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg mb-6">
        <h3 className="font-bold mb-3">Known limitations</h3>
        <ul className="text-sm text-[#94a3b8] space-y-2">
          <li>• Image and visual analysis: not yet implemented (Round 3 commitment)</li>
          <li>• Multi-format ingestion: PDF and plain text only; OCR fallback for scans</li>
          <li>• Multi-tenancy: application-level isolation; PostgreSQL RLS in Round 3</li>
          <li>• The publication passport is an audit record, not a compliance certificate</li>
        </ul>
      </div>

      <div className="p-5 bg-[#0f172a] border-l-4 border-[#22d3ee] rounded-lg">
        <p className="text-sm">
          <span className="font-bold text-[#22d3ee]">Responsible design: </span>
          BrandProof uses the NIST AI Risk Management Framework as a design checklist —
          Govern, Map, Measure, Manage. We claim no formal alignment; the framework
          structures our thinking.
        </p>
      </div>
    </div>
  );
}