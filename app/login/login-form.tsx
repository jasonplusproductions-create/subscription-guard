"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function friendlyError(
  code: string | null,
  description: string | null
): string | null {
  if (!code && !description) {
    return null;
  }

  if (description) {
    return description.replace(/\+/g, " ");
  }

  if (code === "link_expired_or_invalid" || code === "auth_callback_failed") {
    return "Sign-in link expired or invalid. Request a new one and open it in the same browser where you started.";
  }

  return "Sign-in failed. Try again.";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    friendlyError(
      searchParams.get("error"),
      searchParams.get("error_description")
    )
  );

  async function handleSendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setSent(true);
    setStatus("idle");
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/subscriptions");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Sign in
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        We’ll email you a magic link. You can also enter the one-time code.
      </p>

      {errorMessage ? (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      ) : null}

      {!sent ? (
        <form onSubmit={handleSendLink} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base font-normal text-black outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {status === "loading" ? "Sending…" : "Send magic link"}
          </button>
        </form>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            Check your email for a sign-in link. Prefer the code? Enter it below
            in this same browser.
          </p>

          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              One-time code
              <input
                type="text"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base font-normal tracking-widest text-black outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                placeholder="123456"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
            >
              {status === "loading" ? "Verifying…" : "Verify code"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setOtp("");
              setErrorMessage(null);
            }}
            className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Use a different email
          </button>
        </div>
      )}
    </>
  );
}
