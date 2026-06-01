import { useMemo, useState } from "react";
import { IconCalendar, IconPlus, IconSearch, IconTrash, IconEdit, IconFolder } from "../icons";
import type { Project, ProjectStatus, Theme } from "../types";

interface Props {
  theme: Theme;
  projects: Project[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const statusStyles: Record<ProjectStatus, { bg: string; text: string; dot: string }> = {
  "In Progress": { bg: "bg-violet-500/10", text: "text-violet-300", dot: "bg-violet-500" },
  "Completed":   { bg: "bg-emerald-500/10", text: "text-emerald-300", dot: "bg-emerald-500" },
  "On Hold":     { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-500" },
  "Planning":    { bg: "bg-sky-500/10", text: "text-sky-300", dot: "bg-sky-500" },
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function Dashboard({ theme, projects, onOpen, onEdit, onDelete, onAdd }: Props) {
  const dark = theme === "dark";
  const card = dark
    ? "bg-[#242424] border-white/5 hover:border-violet-500/40"
    : "bg-white border-zinc-200 hover:border-violet-500/50";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const inputCls = dark
    ? "bg-[#242424] border-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
    : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectStatus | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => (filter === "All" ? true : p.status === filter))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [projects, query, filter]);

  const counts = useMemo(() => {
    const base = { total: projects.length, "In Progress": 0, Completed: 0, "On Hold": 0, Planning: 0 } as Record<string, number>;
    projects.forEach((p) => (base[p.status] = (base[p.status] || 0) + 1));
    return base;
  }, [projects]);

  return (
    <div className="page-enter px-8 py-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: counts.total, color: "from-violet-500 to-sky-500" },
          { label: "In Progress", value: counts["In Progress"], color: "from-violet-500 to-fuchsia-500" },
          { label: "Completed", value: counts["Completed"], color: "from-emerald-500 to-teal-500" },
          { label: "On Hold", value: counts["On Hold"], color: "from-amber-500 to-orange-500" },
          { label: "Planning", value: counts["Planning"], color: "from-sky-500 to-indigo-500" },
        ].map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-2xl border p-4 ${
              dark ? "border-white/5 bg-[#1A1A1A]" : "border-zinc-200 bg-white"
            }`}
          >
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 bg-gradient-to-br ${s.color}`} />
            <div className={`text-xs font-medium uppercase tracking-wider ${muted}`}>{s.label}</div>
            <div className="mt-2 text-3xl font-black tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <IconSearch size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition ${inputCls}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["All", "In Progress", "Completed", "On Hold", "Planning"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "accent-gradient text-white shadow-lg shadow-violet-500/20"
                    : dark
                    ? "bg-[#1A1A1A] text-zinc-300 hover:bg-[#242424]"
                    : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {f}
              </button>
            );
          })}

          <button
            onClick={onAdd}
            className="ml-2 flex items-center gap-2 rounded-xl accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
          >
            <IconPlus size={16} />
            New Project
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className={`mt-10 flex flex-col items-center justify-center rounded-3xl border py-20 text-center ${
            dark ? "border-white/5 bg-[#1A1A1A]" : "border-zinc-200 bg-white"
          }`}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl accent-gradient">
            <IconFolder size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-bold">No projects found</h3>
          <p className={`mt-1 text-sm ${muted}`}>
            {query ? "Try a different search term." : "Start by creating your first project."}
          </p>
          <button
            onClick={onAdd}
            className="mt-5 rounded-xl accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
          >
            + New Project
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const st = statusStyles[p.status];
            const done = p.tasks.filter((t) => t.done).length;
            return (
              <div
                key={p.id}
                onClick={() => onOpen(p.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 ${card}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] accent-gradient opacity-70 group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-tight line-clamp-2">{p.name}</h3>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.bg} ${st.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {p.status}
                  </span>
                </div>

                <p className={`mt-3 line-clamp-3 text-sm leading-relaxed ${muted}`}>
                  {p.description || "No description provided."}
                </p>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <div className={`flex items-center gap-1.5 ${muted}`}>
                    <IconCalendar size={14} />
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                  <div className={muted}>
                    {p.tasks.length > 0 ? (
                      <span>{done}/{p.tasks.length} tasks</span>
                    ) : (
                      <span>{p.notes.length} notes</span>
                    )}
                  </div>
                </div>

                <div
                  className="mt-4 flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onEdit(p.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      dark ? "hover:bg-white/5 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"
                    }`}
                    title="Edit"
                  >
                    <IconEdit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) onDelete(p.id);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
