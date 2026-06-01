import { useState } from "react";
import { IconArrowLeft, IconBell, IconTrash, IconCheck } from "../icons";
import type { Theme, UserPrefs } from "../types";

interface Props {
  theme: Theme;
  prefs: UserPrefs;
  onSave: (p: UserPrefs) => void;
  onBack: () => void;
  username: string;
}

interface NotifItem {
  id: string;
  kind: "task" | "project" | "digest" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

/* sample in-app notifications — these would normally come from /api/notifications */
function seed(): NotifItem[] {
  const mk = (id: string, kind: NotifItem["kind"], title: string, body: string, minsAgo: number, read = false): NotifItem => ({
    id, kind, title, body, time: new Date(Date.now() - minsAgo * 60_000).toISOString(), read,
  });
  return [
    mk("n1", "task", "Task due today", "Finish the project design review before end of day.", 7, true),
    mk("n2", "project", "Status changed", "Marketing Website Redesign moved from Planning → In Progress.", 42),
    mk("n3", "digest", "Monday digest", "3 projects have updates, 12 tasks completed this week.", 60 * 5, true),
    mk("n4", "system", "New features released", "Workspace appearance, profile photo uploads and more are live.", 60 * 24),
    mk("n5", "task", "Reminder", "Review Internal CRM System notes before the team sync.", 60 * 24 * 2),
  ];
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const kindStyles: Record<NotifItem["kind"], { bg: string; text: string; label: string }> = {
  task:    { bg: "bg-violet-500/10",  text: "text-violet-300",  label: "Task" },
  project: { bg: "bg-sky-500/10",     text: "text-sky-300",     label: "Project" },
  digest:  { bg: "bg-emerald-500/10", text: "text-emerald-300", label: "Digest" },
  system:  { bg: "bg-amber-500/10",   text: "text-amber-300",   label: "System" },
};

export default function NotificationsPage({ theme, prefs, onSave, onBack, username }: Props) {
  const dark = theme === "dark";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const card = dark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-zinc-200";
  const subtask = dark ? "bg-[#242424] border-white/5" : "bg-[#F5F5F5] border-zinc-200";

  const [items, setItems] = useState<NotifItem[]>(() => seed());

  const unread = items.filter((n) => !n.read).length;
  const toggleNotif = (key: keyof typeof prefs.notifications) =>
    onSave({ ...prefs, notifications: { ...prefs.notifications, [key]: !prefs.notifications[key] } });

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  const clearAll = () => setItems([]);
  const toggleRead = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: !i.read } : i)));

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
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl accent-gradient text-white shadow-lg shadow-violet-500/20">
                <IconBell size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
                <p className={`text-sm ${muted}`}>Hi, {username}. You have {unread} unread updates.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={markAllRead}
                disabled={unread === 0}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  dark ? "bg-[#242424] text-zinc-200 hover:bg-[#2e2e2e]" : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"
                } disabled:opacity-50`}
              >
                <IconCheck size={14} /> Mark all read
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                <IconTrash size={14} /> Clear all
              </button>
            </div>
          </div>

          {/* Progress-ish banner */}
          <div className={`mt-6 rounded-2xl border p-4 ${subtask}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-semibold">Channels enabled</div>
                <div className={muted}>
                  {Object.values(prefs.notifications).filter(Boolean).length} / {Object.keys(prefs.notifications).length}
                </div>
              </div>
              <div className="h-2 flex-1 min-w-[160px] overflow-hidden rounded-full" style={{ background: dark ? "#242424" : "#fff" }}>
                <div
                  className="h-full accent-gradient"
                  style={{
                    width: `${(Object.values(prefs.notifications).filter(Boolean).length / Object.keys(prefs.notifications).length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* In-app list */}
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Inbox</h3>
            <span className={`text-xs ${muted}`}>{items.length} items</span>
          </div>

          <div className="mt-3 space-y-2">
            {items.length === 0 && (
              <div className={`rounded-2xl border border-dashed py-10 text-center ${muted} ${dark ? "border-white/5" : "border-zinc-300"}`}>
                📭 Your inbox is empty — nothing to worry about.
              </div>
            )}
            {items.map((n) => {
              const ks = kindStyles[n.kind];
              return (
                <div
                  key={n.id}
                  onClick={() => toggleRead(n.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:translate-x-[2px] ${
                    n.read ? subtask : `${subtask} ${dark ? "ring-1 ring-violet-500/30" : "ring-1 ring-violet-500/30"}`
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ks.bg} ${ks.text} text-xs font-bold`}>
                    {ks.label.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold truncate">{n.title}</div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ks.bg} ${ks.text}`}>
                        {ks.label}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${muted} line-clamp-2`}>{n.body}</p>
                    <div className={`mt-1.5 text-[11px] ${muted}`}>{timeAgo(n.time)}</div>
                  </div>
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "accent-gradient"}`} />
                </div>
              );
            })}
          </div>

          {/* Channels toggles */}
          <div className="mt-8">
            <h3 className="text-lg font-bold tracking-tight">Preferences</h3>
            <p className={`text-xs ${muted}`}>What do you want to be notified about?</p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { key: "taskReminders" as const, label: "Task reminders", hint: "Daily digest of due tasks" },
              { key: "projectUpdates" as const, label: "Project updates", hint: "When projects change status" },
              { key: "weeklyDigest" as const, label: "Weekly digest", hint: "Monday workspace summary" },
              { key: "emailDigest" as const, label: "Email summary", hint: "Send summaries by email" },
              { key: "desktopPush" as const, label: "Desktop push", hint: "Browser notifications" },
              { key: "marketing" as const, label: "Product updates", hint: "Occasional feature emails" },
            ].map((it) => {
              const active = prefs.notifications[it.key];
              const border = dark ? "border-white/5" : "border-zinc-200";
              const bg = dark ? "bg-[#242424]" : "bg-[#F5F5F5]";
              return (
                <div
                  key={it.key}
                  onClick={() => toggleNotif(it.key)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border ${border} ${bg} px-4 py-3 transition hover:brightness-110`}
                >
                  <div>
                    <div className="text-sm font-semibold">{it.label}</div>
                    <div className={`text-xs ${muted}`}>{it.hint}</div>
                  </div>
                  <div className={`relative h-6 w-11 rounded-full transition ${active ? "accent-gradient" : dark ? "bg-white/10" : "bg-zinc-300"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? "left-[22px]" : "left-0.5"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
