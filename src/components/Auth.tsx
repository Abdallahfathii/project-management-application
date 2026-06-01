import { useState } from "react";
import { IconLogo, IconUser, IconSun, IconMoon, IconCheck, IconArrowLeft } from "../icons";
import type { Theme } from "../types";
import { apiLogin, apiRegister, apiRequestReset, apiConfirmReset, type BackendUser } from "../backend";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onSuccess: (user: BackendUser) => void;
}

type Mode = "login" | "register" | "forgot-email" | "forgot-code";

export default function Auth({ theme, onToggleTheme, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const dark = theme === "dark";
  const shell = dark ? "bg-[#0A0A0A] text-zinc-100" : "bg-[#FFFFFF] text-zinc-900";
  const card = dark ? "bg-[#1A1A1A] border border-white/5" : "bg-[#F5F5F5] border border-zinc-200";
  const inputBase = dark
    ? "bg-[#242424] border-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
    : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500";
  const hint = dark ? "text-zinc-400" : "text-zinc-500";

  /* shared fields */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  /* reset flow */
  const [resetId, setResetId] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [resetConfirmPw, setResetConfirmPw] = useState("");

  const switchMode = (m: Mode) => { setMode(m); setError(""); setInfo(""); };

  const submitLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        const r = await apiLogin({ username, password });
        if (!r.ok) { setError(r.error); return; }
        onSuccess(r.user);
      } else if (mode === "register") {
        const r = await apiRegister({ username, email, password, confirmPassword: confirm });
        if (!r.ok) { setError(r.error); return; }
        onSuccess(r.user);
      }
    } finally { setLoading(false); }
  };

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const r = await apiRequestReset(email);
      if (!("ok" in r && r.ok)) { setError((r as any).error); return; }
      setResetId(r.resetId);
      setInfo(`A 6-digit verification code has been sent to ${email}. (Demo code: ${r.code})`);
      setMode("forgot-code");
    } finally { setLoading(false); }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const r = await apiConfirmReset({ resetId, code: resetCode, newPassword: resetNewPw, confirmPassword: resetConfirmPw });
      if (!r.ok) { setError(r.error); return; }
      setInfo("Password updated. You can now sign in with your new password.");
      setMode("login");
      setPassword("");
    } finally { setLoading(false); }
  };

  const pwOk = password.length >= 6;
  const matchOk = !confirm || confirm === password;

  return (
    <div className={`min-h-screen w-full ${shell} relative overflow-hidden`}>
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl accent-gradient" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl accent-gradient" />

      <button
        onClick={onToggleTheme}
        className={`absolute right-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 ${
          dark ? "bg-[#1A1A1A] text-zinc-200 hover:bg-[#242424]" : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"
        }`}
        aria-label="Toggle theme"
      >
        {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </button>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* Left: brand */}
          <div className="hidden md:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="relative">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl accent-gradient"
                  style={{ boxShadow: "0 15px 40px -12px rgba(108,60,225,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset" }}
                >
                  <IconLogo size={26} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white" style={{ background: "#10B981" }} />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">Project Organizer</div>
                <div className={`text-sm ${hint}`}>Your workspace — organized.</div>
              </div>
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Organize your work, <span className="accent-text">beautifully.</span>
            </h1>
            <p className={`mt-5 text-lg leading-relaxed ${hint}`}>
              A calm, modern workspace to plan projects, capture notes and track
              tasks — everything saved in your account, ready whenever you return.
            </p>
            <div className={`mt-10 space-y-3 ${hint}`}>
              {[
                "Sign in, register or reset your password — all in one screen",
                "Per-project notes, descriptions and task checklists",
                "Dark & light themes with an animated electric accent",
                "Everything is saved to your personal account",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md accent-gradient text-white text-xs">
                    <IconCheck size={12} />
                  </span>
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: card */}
          <div className="mx-auto w-full max-w-md">
            <div className="md:hidden mb-8 flex items-center justify-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl accent-gradient"
                style={{ boxShadow: "0 15px 40px -12px rgba(108,60,225,0.55)" }}
              >
                <IconLogo size={22} className="text-white" />
              </div>
            </div>

            <div className={`rounded-3xl p-8 shadow-2xl ${card}`}>
              {/* Back button for reset flow */}
              {mode.startsWith("forgot") && (
                <button
                  onClick={() => switchMode("login")}
                  className={`mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition ${
                    dark ? "text-zinc-300 hover:bg-[#242424]" : "text-zinc-700 hover:bg-[#F5F5F5]"
                  }`}
                >
                  <IconArrowLeft size={14} /> Back to sign in
                </button>
              )}

              {/* Tab switcher (only for login/register) */}
              {!mode.startsWith("forgot") && (
                <div className={`mb-6 grid grid-cols-2 gap-1 rounded-xl p-1 ${dark ? "bg-[#0A0A0A]" : "bg-white border border-zinc-200"}`}>
                  {(["login", "register"] as Mode[]).map((m) => {
                    const active = mode === m;
                    const label = m === "login" ? "Sign in" : "Create account";
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => switchMode(m)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${
                          active ? "accent-gradient text-white shadow-md shadow-violet-500/20" : hint
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Headers */}
              <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight">
                  {mode === "login" && "Welcome back"}
                  {mode === "register" && "Get started"}
                  {mode === "forgot-email" && "Reset your password"}
                  {mode === "forgot-code" && "Enter verification code"}
                </h2>
                <p className={`mt-1 text-sm ${hint}`}>
                  {mode === "login" && "Sign in to access your workspace."}
                  {mode === "register" && "Create your free account in a few seconds."}
                  {mode === "forgot-email" && "Enter your email — we'll send a 6-digit verification code."}
                  {mode === "forgot-code" && "Enter the code emailed to you, then choose a new password."}
                </p>
              </div>

              {/* Login */}
              {(mode === "login" || mode === "register") && (
                <form onSubmit={submitLoginOrRegister} className="space-y-4">
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${hint}`}>Username</label>
                    <input
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={mode === "login" ? "admin" : "jane.doe"}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`}
                    />
                  </div>
                  {mode === "register" && (
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${hint}`}>Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`} />
                    </div>
                  )}
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${hint}`}>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "login" ? "••••••••" : "At least 6 characters"}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`} />
                    {mode === "register" && (
                      <div className={`mt-1.5 text-xs ${pwOk ? "text-emerald-400" : hint}`}>
                        {pwOk ? "✓ Password looks good" : "• 6 characters minimum"}
                      </div>
                    )}
                  </div>
                  {mode === "register" && (
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${hint}`}>Confirm password</label>
                      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`} />
                      {confirm && (
                        <div className={`mt-1.5 text-xs ${matchOk ? "text-emerald-400" : "text-red-400"}`}>
                          {matchOk ? "✓ Passwords match" : "• Passwords do not match"}
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
                  )}
                  {info && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{info}</div>
                  )}

                  <button type="submit" disabled={loading}
                    className="accent-gradient mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                    {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                  </button>

                  {mode === "login" && (
                    <div className="flex items-center justify-between text-xs">
                      <button onClick={() => switchMode("forgot-email")}
                        className="accent-text font-semibold hover:underline">
                        Forgot password?
                      </button>
                      <span className={hint}>
                        Demo: <b className="font-semibold">admin</b> / <b className="font-semibold">admin123</b>
                      </span>
                    </div>
                  )}

                  <div className={`flex items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs ${dark ? "border-white/10 text-zinc-400" : "border-zinc-300 text-zinc-500"}`}>
                    <IconUser size={14} />
                    <span>
                      Demo credentials:&nbsp;<b className="font-semibold">admin</b> /{" "}
                      <b className="font-semibold">admin123</b>
                    </span>
                  </div>
                </form>
              )}

              {/* Forgot password – step 1: email */}
              {mode === "forgot-email" && (
                <form onSubmit={requestReset} className="space-y-4">
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${hint}`}>Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
                  )}
                  {info && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{info}</div>
                  )}
                  <button type="submit" disabled={loading}
                    className="accent-gradient w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                    {loading ? "Sending code…" : "Send verification code"}
                  </button>
                </form>
              )}

              {/* Forgot password – step 2: code + new password */}
              {mode === "forgot-code" && (
                <form onSubmit={confirmReset} className="space-y-4">
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${hint}`}>6-digit code</label>
                    <input value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${hint}`}>New password</label>
                    <input type="password" value={resetNewPw} onChange={(e) => setResetNewPw(e.target.value)}
                      placeholder="At least 6 characters"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${hint}`}>Confirm new password</label>
                    <input type="password" value={resetConfirmPw} onChange={(e) => setResetConfirmPw(e.target.value)}
                      placeholder="Re-enter your new password"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`}
                    />
                  </div>
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
                  )}
                  {info && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{info}</div>
                  )}
                  <button type="submit" disabled={loading}
                    className="accent-gradient w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                    {loading ? "Updating…" : "Reset password & sign in"}
                  </button>
                </form>
              )}

              {/* Footer links */}
              <div className={`mt-5 text-center text-xs ${hint}`}>
                {mode === "login" && (
                  <>
                    Don&apos;t have an account?{" "}
                    <button onClick={() => switchMode("register")} className="accent-text font-semibold">Create one</button>
                  </>
                )}
                {mode === "register" && (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => switchMode("login")} className="accent-text font-semibold">Sign in</button>
                  </>
                )}
              </div>
            </div>

            <p className={`mt-6 text-center text-xs ${hint}`}>
              © {new Date().getFullYear()} — Your projects, your space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
