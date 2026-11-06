"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/submit");
    } catch (e: any) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          router.push("/submit");
        } catch (e2: any) {
          setError(e2.message);
        }
      } else {
        setError(e.message);
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-[#f5f3ee]">
      <div className="w-full max-w-md p-8 border border-[#1f2a3f] rounded-lg bg-[#0f172a]">
        <h1 className="text-3xl font-bold mb-2">BrandProof</h1>
        <p className="text-sm text-[#94a3b8] mb-8">
          Every brand decision. Backed by evidence.
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-3 bg-[#0b1220] border border-[#1f2a3f] rounded text-[#f5f3ee]"
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-3 bg-[#0b1220] border border-[#1f2a3f] rounded text-[#f5f3ee]"
        />
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 bg-[#2563eb] rounded font-semibold hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in / Create account"}
        </button>
        <p className="text-xs text-[#64748b] mt-4">
          First time? Just enter an email and password — an account is created automatically.
        </p>
      </div>
    </div>
  );
}