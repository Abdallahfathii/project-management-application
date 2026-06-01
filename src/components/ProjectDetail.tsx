import { useEffect, useState } from "react";
import { IconArrowLeft, IconEdit, IconCalendar, IconTrash, IconPlus, IconFolder } from "../icons";
import type { Project, ProjectStatus, Theme } from "../types";

interface Props {
  theme: Theme;
  project: Project;
  onBack: () => void;
  onEdit: () => void;
  onUpdateDescription: (description: string) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (name: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddNote: (title: string, body: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  "In Progress": "bg-violet-500/10 text-violet-300",
  "Completed":   "bg-emerald-500/10 text-emerald-300",
  "On Hold":     "bg-amber-500/10 text-amber-300",
  "Planning":    "bg-sky-500/10 text-sky-300",
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function ProjectDetail(props: Props) {
  const { theme, project, onBack, onEdit, onUpdateDescription, onToggleTask, onAddTask, onDeleteTask, onAddNote, onDeleteNote } = props;
  const dark = theme === "dark";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const card = dark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-zinc-200";
  const subtask = dark ? "bg-[#242424] border-white/5" : "bg-[#F5F5F5] border-zinc-200";
  const inputBase = dark
    ? "bg-[#242424] border-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
    : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500";

  const [desc, setDesc] = useState(project.description);
  const [taskInput, setTaskInput] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => { setDesc(project.description); }, [project.id]);

  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const saveDescription = () => {
    if (desc !== project.description) onUpdateDescription(desc);
  };

  return (
    <div className="page-enter px-8 py-8">
      <button
        onClick={onBack}
        className={`mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          dark ? "text-zinc-300 hover:bg-[#1A1A1A]" : "text-zinc-700 hover:bg-[#F5F5F5]"
        }`}
      >
        <IconArrowLeft size={16} />
        Back to dashboard
      </button>

      {/* Title bar */}
      <div className={`mb-6 rounded-3xl border p-6 ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <IconFolder size={18} className={dark ? "text-violet-400" : "text-violet-600"} />
              <span className={`text-xs font-medium uppercase tracking-widest ${muted}`}>Project</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{project.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[project.status]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {project.status}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs ${muted}`}>
                <IconCalendar size={14} /> Created {formatDate(project.createdAt)}
              </span>
              <span className={`text-xs ${muted}`}>
                Last updated {formatDate(project.updatedAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="accent-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
          >
            <IconEdit size={16} /> Edit project
          </button>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className={`mb-2 flex items-center justify-between text-xs ${muted}`}>
            <span>Tasks progress</span>
            <span className="font-semibold text-zinc-200">{done}/{total} · {pct}%</span>
          </div>
          <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? "bg-[#242424]" : "bg-zinc-200"}`}>
            <div
              className="h-full rounded-full accent-gradient transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Description */}
        <div className={`rounded-3xl border p-6 lg:col-span-2 ${card}`}>
          <h2 className="text-lg font-bold tracking-tight">Description / Explanation</h2>
          <p className={`mb-4 text-xs ${muted}`}>Editable — auto-saved when you click outside.</p>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={saveDescription}
            rows={10}
            placeholder="Describe the project scope, goals and notes…"
            className={`w-full resize-y rounded-2xl border px-4 py-3 text-sm leading-relaxed outline-none transition ${inputBase}`}
          />
        </div>

        {/* Notes */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h2 className="text-lg font-bold tracking-tight">Notes ({project.notes.length})</h2>
          <p className={`mb-4 text-xs ${muted}`}>Quick snippets and ideas.</p>

          <div className="space-y-3">
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title"
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${inputBase}`}
            />
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Write a short note…"
              rows={3}
              className={`w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none transition ${inputBase}`}
            />
            <button
              onClick={() => {
                const t = noteTitle.trim();
                const b = noteBody.trim();
                if (!t && !b) return;
                onAddNote(t || "Untitled note", b);
                setNoteTitle("");
                setNoteBody("");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl accent-gradient px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
            >
              <IconPlus size={16} /> Add note
            </button>
          </div>

          <div className="mt-5 space-y-2 max-h-80 overflow-y-auto nice-scroll">
            {project.notes.length === 0 ? (
              <p className={`rounded-xl border border-dashed py-6 text-center text-xs ${muted} ${dark ? "border-white/5" : "border-zinc-300"}`}>
                No notes yet. Add your first one above.
              </p>
            ) : (
              project.notes.slice().reverse().map((n) => (
                <div key={n.id} className={`group rounded-xl border p-3 ${subtask}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold leading-snug">{n.title}</div>
                    <button
                      onClick={() => onDeleteNote(n.id)}
                      className="opacity-0 transition group-hover:opacity-100 text-red-400 hover:bg-red-500/10 rounded-md p-1"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                  {n.body && <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{n.body}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className={`rounded-3xl border p-6 lg:col-span-3 ${card}`}>
          <h2 className="text-lg font-bold tracking-tight">Tasks checklist</h2>
          <p className={`mb-4 text-xs ${muted}`}>Break the project down into actionable steps.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = taskInput.trim();
              if (!v) return;
              onAddTask(v);
              setTaskInput("");
            }}
            className="mb-5 flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Add a new task… (e.g. Design home screen mockups)"
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputBase}`}
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
            >
              <IconPlus size={16} /> Add Task
            </button>
          </form>

          <div className="grid gap-2 md:grid-cols-2">
            {project.tasks.length === 0 ? (
              <div className={`col-span-full rounded-2xl border border-dashed py-10 text-center ${muted} ${dark ? "border-white/5" : "border-zinc-300"}`}>
                No tasks yet — add your first one to get started.
              </div>
            ) : (
              project.tasks.map((t) => (
                <div
                  key={t.id}
                  className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${subtask}`}
                >
                  <input
                    type="checkbox"
                    className="ccb"
                    checked={t.done}
                    onChange={() => onToggleTask(t.id)}
                  />
                  <span className={`flex-1 text-sm ${t.done ? "line-through text-zinc-500" : ""}`}>{t.name}</span>
                  <button
                    onClick={() => onDeleteTask(t.id)}
                    className="opacity-0 transition group-hover:opacity-100 text-red-400 hover:bg-red-500/10 rounded-md p-1.5"
                    title="Delete task"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
