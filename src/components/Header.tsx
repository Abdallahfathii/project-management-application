import { IconSun, IconMoon, IconFolder } from "../icons";
import type { Theme } from "../types";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  username: string;
  photo?: string;
  email?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ theme, onToggleTheme, username, photo, email, title, subtitle, action }: Props) {
  const dark = theme === "dark";
  const shell = dark
    ? "bg-[#1A1A1A] border-white/5 text-zinc-100"
    : "bg-white border-zinc-200 text-zinc-900";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";

  const initial = (username || "U").charAt(0).toUpperCase();

  return (
    <header className={`sticky top-0 z-20 flex items-center justify-between border-b px-8 py-4 ${shell}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] accent-gradient" />

      <div className="flex items-start flex-col">
        <div className="flex items-center gap-2">
          <IconFolder size={18} className={dark ? "text-violet-400" : "text-violet-600"} />
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        {subtitle && <p className={`mt-0.5 text-xs ${muted}`}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action}

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:scale-105 ${
            dark ? "bg-[#242424] hover:bg-[#2e2e2e] text-zinc-200" : "bg-[#F5F5F5] hover:bg-zinc-200 text-zinc-700"
          }`}
        >
          {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
            dark ? "bg-[#242424]" : "bg-[#F5F5F5]"
          }`}
        >
          <div
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden text-sm font-bold text-white"
            style={{
              borderRadius: 12,
              background: photo ? undefined : undefined,
              boxShadow: "0 6px 20px -6px rgba(108,60,225,0.45)",
            }}
          >
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center accent-gradient">{initial}</div>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: "#10B981" }} />
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-sm font-semibold capitalize">{username}</div>
            {email && <div className={`text-[11px] ${muted}`}>{email}</div>}
            {!email && <div className={`text-[11px] ${muted}`}>Signed in</div>}
          </div>
        </div>
      </div>
    </header>
  );
}
