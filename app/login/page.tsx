"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "cooldown" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending" || status === "cooldown") return;

    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Magic Link only for the beta — no password, no OTP-code fallback.
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.toLowerCase().includes("rate limit")
          ? "You've requested a few links already — check your inbox, or wait a minute before trying again."
          : error.message
      );
      return;
    }

    setStatus("sent");
    // Simple client-side cooldown so people can't spam requests
    setTimeout(() => setStatus("idle"), 30_000);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold">Sign in</h1>
      <p className="mb-6 text-sm text-ink/60">
        We&apos;ll email you a Magic Link — no password needed.
      </p>

      {status === "sent" ? (
        <div className="rounded-md border border-accent/30 bg-accent/10 p-4 text-sm">
          Check <span className="font-medium">{email}</span> for a sign-in
          link. It expires shortly, so use it soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-ink/20 bg-white px-3 py-2 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-md bg-ink px-4 py-2 text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send Magic Link"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </form>
      )}
    </main>
  );
}
