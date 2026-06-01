import { useEffect, useRef, useState } from "react";
import { IconArrowLeft, IconTrash, IconCamera, IconCheck, IconBell, IconPalette, IconShield } from "../icons";
import type { Theme } from "../types";
import {
  type BackendUser,
  type UserPrefs,
  apiUpdateMe,
  apiChangePassword,
  apiDeleteAccount,
} from "../backend";

interface Props {
  theme: Theme;
  user: BackendUser;
  prefs: UserPrefs;
  onSave: (p: UserPrefs) => void;
  onProfileUpdated: (u: BackendUser) => void;
  onBack: () => void;
  onDeleted: () => void;
}

/* A curated list of accent gradients the user can pick from */
export const ACCENT_GRADIENTS: { name: string; css: string }[] = [
  { name: "Electric Purple-Blue", css: "linear-gradient(120deg, #6C3CE1, #8B5CF6, #0EA5E9)" },
  { name: "Sunset Orange", css: "linear-gradient(120deg, #F97316, #EF4444, #F43F5E)" },
  { name: "Emerald Mint", css: "linear-gradient(120deg, #10B981, #14B8A6, #06B6D4)" },
  { name: "Royal Sapphire", css: "linear-gradient(120deg, #1E3A8A, #4F46E5, #7C3AED)" },
  { name: "Pink Berry", css: "linear-gradient(120deg, #EC4899, #D946EF, #8B5CF6)" },
  { name: "Golden Hour", css: "linear-gradient(120deg, #FACC15, #F59E0B, #EF4444)" },
];

function roundedClass(style: "rounded" | "sharp" | "pill") {
  return style === "sharp" ? "rounded-md" : style === "pill" ? "rounded-full" : "rounded-xl";
}

export default function ManageAccount(props: Props) {
  const { theme, user, prefs, onSave, onProfileUpdated, onBack, onDeleted } = props;
  const dark = theme === "dark";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const card = dark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-zinc-200";
  const softBorder = dark ? "border-white/5" : "border-zinc-200";
  const inputBase = dark
    ? "bg-[#242424] border-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
    : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500";

  /* profile form state */
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(prefs.bio);
  const [role, setRole] = useState(prefs.role);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* password state */
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* delete */
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* working copies of prefs (so user can cancel) */
  const [p, setP] = useState<UserPrefs>(prefs);

  useEffect(() => { setP(prefs); }, [JSON.stringify(prefs.appearance) + JSON.stringify(prefs.notifications)]);
  useEffect(() => { setFullName(user.fullName); setEmail(user.email); setUsername(user.username); }, [user.id]);
  useEffect(() => { setBio(prefs.bio); setRole(prefs.role); }, [prefs.bio + prefs.role]);

  /* ---------- photo upload ---------- */
  const pickPhoto = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) { alert("Image too large — max 4MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setP((prev) => ({ ...prev, photo: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => setP((prev) => ({ ...prev, photo: "" }));

  /* ---------- saving ---------- */
  const savePrefsOnly = (next: UserPrefs) => {
    setP(next);
    onSave(next);
  };

  const saveProfile = async () => {
    setProfileMsg(null);
    const r = await apiUpdateMe({ fullName, email, username });
    if (!("ok" in r)) {
      onProfileUpdated(r);
      setProfileMsg({ ok: true, text: "Profile saved." });
      setP((prev) => ({ ...prev, bio, role }));
      onSave({ ...p, bio, role });
    } else {
      setProfileMsg({ ok: false, text: r.error });
    }
    setTimeout(() => setProfileMsg(null), 2500);
  };

  const changePassword = async () => {
    setPwMsg(null);
    const r = await apiChangePassword(curPw, newPw, confPw);
    if (r.ok) {
      setPwMsg({ ok: true, text: "Password updated." });
      setCurPw(""); setNewPw(""); setConfPw("");
    } else {
      setPwMsg({ ok: false, text: r.error });
    }
    setTimeout(() => setPwMsg(null), 2500);
  };

  const deleteAccount = async () => {
    if (deleteConfirm.trim() !== user.username) {
      alert(`Type "${user.username}" to confirm.`);
      return;
    }
    if (!confirm("This will permanently delete your account and projects. Continue?")) return;
    await apiDeleteAccount();
    onDeleted();
  };

  /* ---------- helpers ---------- */
  const toggleNotif = (key: keyof typeof p.notifications) =>
    savePrefsOnly({ ...p, notifications: { ...p.notifications, [key]: !p.notifications[key] } });

  /* ---------- render ---------- */
  return (
    <div className="page-enter px-8 py-8">
      <button
        onClick={onBack}
        className={`mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          dark ? "text-zinc-300 hover:bg-[#1A1A1A]" : "text-zinc-700 hover:bg-[#F5F5F5]"
        }`}
      >
        <IconArrowLeft size={16} /> Back to dashboard
      </button>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Profile card with photo upload */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex items-start gap-5">
            {/* photo */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="h-28 w-28 overflow-hidden border-2 border-white/10 shadow-2xl"
                  style={{
                    borderRadius: p.appearance.roundedStyle === "sharp" ? "12px" : p.appearance.roundedStyle === "pill" ? "9999px" : "24px",
                    background: p.photo ? undefined : ACCENT_GRADIENTS[p.appearance.accentIndex % ACCENT_GRADIENTS.length].css,
                    boxShadow: "0 20px 50px -12px rgba(108,60,225,0.45)",
                  }}
                >
                  {p.photo ? (
                    <img src={p.photo} alt="profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black text-white">
                      {(fullName || user.username).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl accent-gradient text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110 active:scale-95"
                  title="Change photo"
                >
                  <IconCamera size={14} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickPhoto(f);
                  e.currentTarget.value = "";
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${dark ? "bg-[#242424] text-zinc-200 hover:bg-[#2e2e2e]" : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"}`}
                >
                  Upload
                </button>
                {p.photo && (
                  <button
                    onClick={removePhoto}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* fields */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Manage account</h2>
                  <p className={`text-sm ${muted}`}>Update your profile, appearance and notification preferences.</p>
                </div>
                <div className={`hidden text-right text-sm ${muted} md:block`}>
                  <div>Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-xs font-medium ${muted}`}>Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
                </div>
                <div>
                  <label className={`mb-1 block text-xs font-medium ${muted}`}>Username</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
                </div>
                <div className="sm:col-span-2">
                  <label className={`mb-1 block text-xs font-medium ${muted}`}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
                </div>
                <div>
                  <label className={`mb-1 block text-xs font-medium ${muted}`}>Role</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Project Manager" className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
                </div>
                <div className="sm:col-span-2">
                  <label className={`mb-1 block text-xs font-medium ${muted}`}>Short bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="A sentence or two about yourself…" className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={saveProfile} className="accent-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95">
                  Save profile
                </button>
                {profileMsg && (
                  <span className={`text-sm ${profileMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {profileMsg.ok ? "✓ " : "⚠ "}{profileMsg.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two column: appearance + notifications */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Appearance */}
          <div className={`rounded-3xl border p-6 ${card}`}>
            <div className="mb-4 flex items-center gap-2">
              <IconPalette size={18} className={dark ? "text-violet-400" : "text-violet-600"} />
              <h3 className="text-lg font-bold">Appearance</h3>
            </div>
            <p className={`mb-4 text-xs ${muted}`}>Customize how your workspace looks and feels.</p>

            {/* Accent gradient picker */}
            <div>
              <label className={`mb-2 block text-xs font-medium ${muted}`}>Accent color</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCENT_GRADIENTS.map((g, i) => {
                  const active = p.appearance.accentIndex === i;
                  return (
                    <button
                      key={g.name}
                      onClick={() => savePrefsOnly({ ...p, appearance: { ...p.appearance, accentIndex: i } })}
                      className={`relative h-14 overflow-hidden rounded-xl border-2 transition ${active ? "border-white" : softBorder}`}
                      style={{ background: g.css }}
                      title={g.name}
                    >
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="rounded-full bg-white/90 p-1 text-zinc-900"><IconCheck size={14} /></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounded style */}
            <div className="mt-5">
              <label className={`mb-2 block text-xs font-medium ${muted}`}>Corner style</label>
              <div className="grid grid-cols-3 gap-2">
                {(["rounded", "sharp", "pill"] as const).map((r) => {
                  const active = p.appearance.roundedStyle === r;
                  return (
                    <button
                      key={r}
                      onClick={() => savePrefsOnly({ ...p, appearance: { ...p.appearance, roundedStyle: r } })}
                      className={`px-3 py-2 text-xs font-semibold capitalize border transition ${
                        active ? "accent-gradient border-transparent text-white shadow-md shadow-violet-500/20" : `${softBorder} ${dark ? "bg-[#242424] text-zinc-200" : "bg-white text-zinc-700"}`
                      } ${roundedClass(r)}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-5 space-y-3">
              <ToggleRow
                dark={dark}
                label="Animated gradient sidebar"
                hint="Give the sidebar header a pulsing electric gradient"
                value={p.appearance.sidebarGradient}
                onToggle={() => savePrefsOnly({ ...p, appearance: { ...p.appearance, sidebarGradient: !p.appearance.sidebarGradient } })}
              />
              <ToggleRow
                dark={dark}
                label="Compact layout"
                hint="Smaller paddings and denser information layout"
                value={p.appearance.compactLayout}
                onToggle={() => savePrefsOnly({ ...p, appearance: { ...p.appearance, compactLayout: !p.appearance.compactLayout } })}
              />
            </div>
          </div>

          {/* Notifications */}
          <div className={`rounded-3xl border p-6 ${card}`}>
            <div className="mb-4 flex items-center gap-2">
              <IconBell size={18} className={dark ? "text-violet-400" : "text-violet-600"} />
              <h3 className="text-lg font-bold">Notifications</h3>
            </div>
            <p className={`mb-4 text-xs ${muted}`}>Choose what we notify you about and how.</p>

            <div className="space-y-2">
              {[
                { key: "taskReminders" as const, label: "Task reminders", hint: "Daily digest of due tasks" },
                { key: "projectUpdates" as const, label: "Project updates", hint: "When projects you follow change status" },
                { key: "weeklyDigest" as const, label: "Weekly digest", hint: "Monday summary of your workspace" },
                { key: "emailDigest" as const, label: "Email summary", hint: "Send periodic summaries by email" },
                { key: "desktopPush" as const, label: "Desktop push", hint: "Browser notifications when available" },
                { key: "marketing" as const, label: "Product updates", hint: "Occasional email about new features" },
              ].map((it) => (
                <ToggleRow
                  key={it.key}
                  dark={dark}
                  label={it.label}
                  hint={it.hint}
                  value={p.notifications[it.key]}
                  onToggle={() => toggleNotif(it.key)}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed px-3 py-3 text-xs"
                 style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" }}
            >
              <IconBell size={14} className={dark ? "text-zinc-400" : "text-zinc-500"} />
              <span className={muted}>
                You have{" "}
                <span className="accent-text font-bold">
                  {Object.values(p.notifications).filter(Boolean).length}
                </span>{" "}
                notification channels enabled.
              </span>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="mb-4 flex items-center gap-2">
            <IconShield size={18} className={dark ? "text-violet-400" : "text-violet-600"} />
            <h3 className="text-lg font-bold">Security</h3>
          </div>
          <p className={`mb-4 text-xs ${muted}`}>Change your sign-in password.</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={`mb-1 block text-xs font-medium ${muted}`}>Current password</label>
              <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium ${muted}`}>New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium ${muted}`}>Confirm new password</label>
              <input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={changePassword} className="accent-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95">Update password</button>
            {pwMsg && <span className={`text-sm ${pwMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{pwMsg.ok ? "✓ " : "⚠ "}{pwMsg.text}</span>}
          </div>
        </div>

        {/* Delete account */}
        <div className={`rounded-3xl border border-red-500/30 bg-red-500/5 p-6`}>
          <div className="mb-2 flex items-center gap-2">
            <IconTrash size={18} className="text-red-400" />
            <h3 className="text-lg font-bold text-red-400">Delete account</h3>
          </div>
          <p className="text-sm text-red-300/80">
            Permanently delete your profile, all projects, notes and tasks. This cannot be undone.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Type "${user.username}" to confirm`}
              className={`sm:max-w-sm w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${inputBase}`}
            />
            <button
              onClick={deleteAccount}
              disabled={deleteConfirm.trim() !== user.username}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small reusable UI ---------- */
function ToggleRow(props: {
  dark: boolean;
  label: string;
  hint: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { dark, label, hint, value, onToggle } = props;
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const border = dark ? "border-white/5" : "border-zinc-200";
  const bg = dark ? "bg-[#242424]" : "bg-[#F5F5F5]";
  return (
    <div onClick={onToggle} className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border ${border} ${bg} px-4 py-3 transition hover:brightness-110`}>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className={`text-xs ${muted}`}>{hint}</div>
      </div>
      <div className={`relative h-6 w-11 rounded-full transition ${value ? "accent-gradient" : dark ? "bg-white/10" : "bg-zinc-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </div>
    </div>
  );
}


