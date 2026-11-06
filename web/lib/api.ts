import { auth } from "./firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

async function authedFetch(path: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();

  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export async function submitContent(content: string) {
  return authedFetch("/submissions", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getQueue() {
  return authedFetch("/reviews/queue");
}

export async function decideFinding(id: string, decision: string, reason = "") {
  return authedFetch(`/reviews/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  });
}

export async function getPassport(submissionId: string) {
  return authedFetch(`/reviews/passport/${submissionId}`);
}