"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function GuidelinesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [chunks, setChunks] = useState<any[]>([]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await user.getIdToken();
      // load sample chunks to show
      const r = await fetch(`${API_BASE}/guidelines/search?q=guaranteed&top_k=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setChunks(data.results || []);
      }
    });
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("version_label", "v1.1");

      const resp = await fetch(`${API_BASE}/guidelines/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!resp.ok) throw new Error(await resp.text());
      setResult(await resp.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-8 text-[#f5f3ee]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Brand Guidelines</h1>
        <p className="text-sm text-[#94a3b8]">
          Upload approved guideline PDFs. Extracted, chunked, embedded.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <h2 className="font-bold mb-4">Upload new guideline</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-[#94a3b8] mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-[#1f2a3f] file:text-[#f5f3ee] hover:file:bg-[#2d3b57]"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 bg-[#2563eb] rounded font-semibold hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {uploading ? "Processing PDF..." : "Upload & process"}
          </button>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          {result && (
            <div className="mt-4 p-4 bg-[#0b1220] border border-green-600/30 rounded text-sm">
              <p className="text-green-400 font-semibold mb-2">✓ Guideline processed</p>
              <p className="text-[#94a3b8]">
                Chunks created: <span className="text-[#f5f3ee] font-mono">{result.chunks_created}</span>
              </p>
              <p className="text-[#94a3b8]">
                Version: <span className="text-[#f5f3ee] font-mono">{result.guideline_version_id?.slice(0, 8)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
          <h2 className="font-bold mb-4">How it works</h2>
          <ol className="text-sm text-[#94a3b8] space-y-2 list-decimal list-inside">
            <li>PDF is extracted with PyMuPDF</li>
            <li>Split into 350-word chunks with 35-word overlap</li>
            <li>Each chunk embedded via Gemini (1536-dim)</li>
            <li>Stored in PostgreSQL + pgvector with full-text tsvector</li>
            <li>Available for hybrid retrieval (pgvector + BM25 + RRF)</li>
          </ol>
        </div>
      </div>

      <div className="p-6 bg-[#0f172a] border border-[#1f2a3f] rounded-lg">
        <h2 className="font-bold mb-4">
          Active guideline chunks ({chunks.length})
        </h2>
        <p className="text-xs text-[#64748b] mb-4">
          These are the approved rules your content is checked against.
        </p>
        <div className="space-y-2">
          {chunks.map((c: any) => (
            <div
              key={c.chunk_id}
              className="p-3 bg-[#0b1220] border border-[#1f2a3f] rounded text-sm"
            >
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 bg-[#2563eb]/20 text-[#22d3ee] rounded text-xs font-mono shrink-0">
                  {c.metadata?.rule_id || "RULE"}
                </span>
                <p className="text-[#94a3b8] flex-1">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}