import { IconLogo, IconDashboard, IconPlus, IconSettings, IconLogout, IconFolder, IconBell, IconUser, IconNote, IconArrowLeft } from "../icons";
import type { PageKey, Theme, UserPrefs } from "../types";
import type { BackendUser } from "../backend";

interface Props {
  theme: Theme;
  active: PageKey;
  onNavigate: (p: PageKey) => void;
  onLogout: () => void;
  projectCount: number;
  prefs?: UserPrefs;
  user?: BackendUser | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const items: { key: PageKey; label: string; icon: any; id: PageKey }[] = [
  { key: "dashboard", label: "Dashboard", icon: IconDashboard, id: "dashboard" },
  { key: "add", label: "Add Project", icon: IconPlus, id: "add" },
  { key: "notes", label: "Notes", icon: IconNote, id: "notes" },
  { key: "notifications", label: "Notifications", icon: IconBell, id: "notifications" },
  { key: "settings", label: "Settings", icon: IconSettings, id: "settings" },
  { key: "account", label: "Manage account", icon: IconUser, id: "account" },
];

export default function Sidebar(props: Props) {
  const { theme, active, onNavigate, onLogout, projectCount, prefs, user, collapsed, onToggleCollapsed } = props;
  const dark = theme === "dark";
  const base = dark ? "bg-[#0A0A0A] text-zinc-200 border-white/5" : "bg-white text-zinc-800 border-zinc-200";
  const inactive = dark
    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900";
  const activeCls = "accent-gradient text-white shadow-lg shadow-violet-500/20";
  const activeLabel = "font-semibold";
  const showGradient = prefs?.appearance.sidebarGradient !== false;
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const roundedRadius =
    prefs?.appearance.roundedStyle === "sharp" ? "12px" :
    prefs?.appearance.roundedStyle === "pill" ? "9999px" : "18px";

  const displayName = user?.fullName || user?.username || "User";
  const initial = displayName.charAt(0).toUpperCase();

  // icon size scales with collapsed state
  const size = collapsed ? "w-[72px]" : "w-64";

  return (
    <aside className={`flex h-screen shrink-0 flex-col border-r transition-[width] duration-200 ${base} ${size}`}>
       {/* Brand strip */}
       <div
         className={`relative flex items-center px-3 py-5 text-white ${showGradient ? "accent-gradient" : dark ? "bg-[#1A1A1A]" : "bg-[#F5F5F5] text-zinc-800"}`}
         style={{ boxShadow: showGradient ? "0 15px 40px -12px rgba(108,60,225,0.45)" : "none" }}
       >
         <div className="relative mx-auto">
           <div
             className="relative flex h-11 w-11 items-center justify-center bg-white/20 backdrop-blur transition-transform duration-500 hover:rotate-[8deg]"
             style={{
               borderRadius: roundedRadius,
               boxShadow: "0 12px 30px -8px rgba(108,60,225,0.65), 0 0 0 1px rgba(255,255,255,0.15) inset",
               animation: "nexusLogoBob 3s ease-in-out infinite",
             }}
           >
             {prefs?.photo ? (
               <img src={prefs.photo} alt="" className="h-full w-full object-cover" />
             ) : (
               <div className="flex h-full w-full items-center justify-center accent-gradient">{initial}</div>
             )}
           </div>
         </div>
         </div>

          {!collapsed && (
            <div className="ml-3 min-w-0 flex-1 leading-tight">
              <div className="truncate text-lg font-bold tracking-tight">My Space</div>
              <div className={`truncate text-[11px] uppercase tracking-widest text-white/80 ${!showGradient && muted.replace("text-", "text-")}`}>
                Ready
              </div>
            </div>
          )}

      {/* Collapse toggle */}
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Close sidebar"}
          aria-label="Toggle sidebar"
          className={`mx-3 mt-3 mb-2 flex items-center gap-2 rounded-xl px-2 py-2 text-xs transition ${
            dark ? "bg-[#1A1A1A] text-zinc-300 hover:bg-[#242424]" : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          <span className={`mx-auto transition-transform ${collapsed ? "rotate-0" : "rotate-180"}`}>
            <IconArrowLeft size={14} />
          </span>
          {!collapsed && <span className="font-semibold">Close</span>}
        </button>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1.5 px-3 overflow-y-auto nice-scroll">
        {!collapsed && (
          <div className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
            Navigation
          </div>
        )}
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              title={collapsed ? it.label : undefined}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive ? activeCls : inactive
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon size={18} />
              {!collapsed && <span className={isActive ? activeLabel : ""}>{it.label}</span>}
              {!collapsed && it.key === "dashboard" && (
                <span
                  className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    isActive ? "bg-white/20 text-white" : dark ? "bg-white/5 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {projectCount}
                </span>
              )}
            </button>
          );
        })}

        {!collapsed && (
          <>
            <div className={`mt-8 mb-2 px-3 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
              Quick info
            </div>
            <div className={`mx-1 rounded-2xl border p-4 ${dark ? "border-white/5 bg-[#1A1A1A]" : "border-zinc-200 bg-[#F5F5F5]"}`}>
              <div className="flex items-center gap-2">
                <IconFolder size={16} className={dark ? "text-violet-400" : "text-violet-600"} />
                <span className="text-xs font-semibold">Your projects</span>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
                You have <span className="accent-text font-bold">{projectCount}</span> projects stored in your account.
                Everything is saved automatically as you edit.
              </p>
            </div>
          </>
        )}
      </nav>

      {/* User card + sign out */}
      <div className={`border-t px-3 py-4`} style={{ borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
        {!collapsed && (
          <div
            className={`mb-2 flex items-center gap-3 rounded-xl px-2.5 py-2 ${dark ? "bg-[#1A1A1A]" : "bg-[#F5F5F5]"}`}
          >
            <div
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden text-sm font-bold text-white"
              style={{ borderRadius: 12, boxShadow: "0 6px 20px -6px rgba(108,60,225,0.45)" }}
            >
              {prefs?.photo ? (
                <img src={prefs.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center accent-gradient">{initial}</div>
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{displayName}</div>
              <div className={`truncate text-[11px] ${muted}`}>{user?.email || "Signed in"}</div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${inactive} ${collapsed ? "justify-center px-0" : ""}`}
        >
          <IconLogout size={18} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
