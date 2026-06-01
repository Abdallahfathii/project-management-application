import { IconSettings, IconSun, IconMoon, IconFolder, IconTrash } from "../icons";
import type { Theme, AppData } from "../types";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  projectCount: number;
  onExport: () => void;
  onImport: (data: AppData) => void;
  onClear: () => void;
  lastModified: string;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch { return iso; }
}

export default function SettingsPage({ theme, onToggleTheme, projectCount, onExport, onImport, onClear, lastModified }: Props) {
  const dark = theme === "dark";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const card = dark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-zinc-200";
  const subtask = dark ? "bg-[#242424] border-white/5" : "bg-[#F5F5F5] border-zinc-200";

  const importFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as AppData;
        if (!data.projects) throw new Error("Invalid file");
        if (confirm("This will replace your current projects. Continue?")) onImport(data);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-enter px-8 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl accent-gradient text-white">
              <IconSettings size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className={`text-sm ${muted}`}>Personalize your workspace.</p>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className="text-lg font-bold">Appearance</h3>
          <p className={`mb-4 text-sm ${muted}`}>Switch between dark and light mode instantly.</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "dark", label: "Dark", Icon: IconMoon, hint: "#0A0A0A / #1A1A1A" },
              { key: "light", label: "Light", Icon: IconSun, hint: "#FFFFFF / #F5F5F5" },
            ].map((t) => {
              const active = (theme === t.key);
              const Icon = t.Icon;
              return (
                <button
                  key={t.key}
                  onClick={onToggleTheme}
                  className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                    active ? "border-transparent accent-gradient text-white shadow-lg shadow-violet-500/20" : subtask
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-white/20" : dark ? "bg-[#1A1A1A]" : "bg-white"}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{t.label}</div>
                      <div className={`text-xs ${active ? "text-white/80" : muted}`}>{t.hint}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className="text-lg font-bold">Data & storage</h3>
          <p className={`mb-4 text-sm ${muted}`}>
            Your projects are stored locally in your browser as JSON.
          </p>

          <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 ${subtask}`}>
            <IconFolder size={18} className={dark ? "text-violet-400" : "text-violet-600"} />
            <div className="flex-1">
              <div className="text-sm font-semibold">{projectCount} projects</div>
              <div className={`text-xs ${muted}`}>Last saved: {formatDate(lastModified)}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={onExport}
              className="accent-gradient rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
            >
              Export JSON
            </button>
            <label
              className={`cursor-pointer rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                dark ? "bg-[#242424] text-zinc-200 hover:bg-[#2e2e2e]" : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importFromFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <button
              onClick={() => {
                if (confirm("Delete all projects? This cannot be undone.")) onClear();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <IconTrash size={16} /> Clear all
            </button>
          </div>
        </div>

        <p className={`text-center text-xs ${muted}`}>
          Nexus · Project Organizer — v1.0
        </p>
      </div>
    </div>
  );
}
