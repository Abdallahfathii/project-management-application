import { useState } from "react";
import { IconArrowLeft, IconPlus } from "../icons";
import type { Project, ProjectStatus, Theme } from "../types";

interface Props {
  theme: Theme;
  mode: "add" | "edit";
  initial?: Project;
  onCancel: () => void;
  onSave: (name: string, description: string, status: ProjectStatus) => void;
}

const statuses: ProjectStatus[] = ["In Progress", "Completed", "On Hold", "Planning"];

export default function ProjectForm({ theme, mode, initial, onCancel, onSave }: Props) {
  const dark = theme === "dark";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const card = dark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-zinc-200";
  const inputBase = dark
    ? "bg-[#242424] border-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
    : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500";

  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status || "Planning");
  const [error, setError] = useState("");

  const save = () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setError("");
    onSave(name.trim(), desc.trim(), status);
  };

  return (
    <div className="page-enter px-8 py-8">
      <button
        onClick={onCancel}
        className={`mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
          dark ? "text-zinc-300 hover:bg-[#1A1A1A]" : "text-zinc-700 hover:bg-[#F5F5F5]"
        }`}
      >
        <IconArrowLeft size={16} />
        Back to dashboard
      </button>

      <div className={`mx-auto max-w-3xl rounded-3xl border p-8 ${card}`}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl accent-gradient text-white shadow-lg shadow-violet-500/20">
            <IconPlus size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "add" ? "Create a new project" : "Edit project"}
            </h2>
            <p className={`text-sm ${muted}`}>
              {mode === "add"
                ? "Give your project a name and a short description — you can always update it later."
                : "Update project details — changes are saved automatically."}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Project name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Website Redesign"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputBase}`}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Status</label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {statuses.map((s) => {
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "accent-gradient border-transparent text-white shadow-lg shadow-violet-500/20"
                        : dark
                        ? "border-white/5 bg-[#242424] text-zinc-300 hover:border-white/10"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Description / Explanation</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the project goal, scope, stakeholders, links or any other relevant notes…"
              rows={10}
              className={`w-full resize-y rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none transition ${inputBase}`}
            />
            <div className={`mt-1 text-right text-xs ${muted}`}>{desc.length} characters</div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={onCancel}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                dark
                  ? "bg-[#242424] text-zinc-200 hover:bg-[#2e2e2e]"
                  : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="accent-gradient rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              {mode === "add" ? "Save project" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
