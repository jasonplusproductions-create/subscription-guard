import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-8 py-10 dark:border-zinc-800 dark:bg-black">
        <Suspense
          fallback={
            <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
