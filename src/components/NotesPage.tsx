import { useEffect, useState } from "react";
import { IconArrowLeft, IconPlus, IconTrash, IconEdit, IconFolder } from "../icons";
import type { Theme, UserNote } from "../types";

interface Props {
  theme: Theme;
  notes: UserNote[];
  onSave: (notes: UserNote[]) => void;
  onBack: () => void;
}

function newNote(idx: number): UserNote {
  const now = new Date().toISOString();
  return {
    id: "note_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36),
    title: `Note ${idx}`,
    body: "",
    createdAt: now,
    updatedAt: now,
  };
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function NotesPage({ theme, notes: initial, onSave, onBack }: Props) {
  const dark = theme === "dark";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const card = dark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-zinc-200";
  const subtask = dark ? "bg-[#242424] border-white/5" : "bg-[#F5F5F5] border-zinc-200";
  const softBorder = dark ? "border-white/5" : "border-zinc-200";
  const inputBase = dark
    ? "bg-[#242424] border-white/5 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500"
    : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500";

  /* Sort: make sure we always have a numbered list */
  const [notes, setNotes] = useState<UserNote[]>(() =>
    initial.length > 0
      ? [...initial].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
      : [newNote(1), newNote(2)],
  );
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    (initial[0]?.id) || (initial.length > 0 ? initial[0].id : null),
  );
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const selected = notes.find((n) => n.id === selectedId) || null;

   /* persist up — propagate up the chain */
   useEffect(() => { onSave(notes); }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

   /* auto-save when component unmounts (navigating away) or before page unload */
   useEffect(() => {
     const handleBeforeUnload = () => {
       onSave(notes);
     };
     
     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => {
       window.removeEventListener('beforeunload', handleBeforeUnload);
       onSave(notes); // Also save when unmounting (navigating to another page)
     };
   }, [onSave, notes]);

  const addNote = () => {
    const nextIndex = notes.length + 1;
    const n = newNote(nextIndex);
    const next = [...notes, n];
    setNotes(next);
    setSelectedId(n.id);
  };

  const deleteNote = (id: string) => {
    if (!confirm("Delete this note?")) return;
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id || null);
    }
  };

  const startRename = (n: UserNote) => {
    setRenaming(n.id);
    setRenameValue(n.title);
  };
  const commitRename = () => {
    if (renaming == null) return;
    const t = renameValue.trim() || "Untitled note";
    setNotes((prev) => prev.map((n) => (n.id === renaming ? { ...n, title: t, updatedAt: new Date().toISOString() } : n)));
    setRenaming(null);
  };

  const updateBody = (body: string) => {
    if (!selected) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selected.id ? { ...n, body, updatedAt: new Date().toISOString() } : n)),
    );
  };

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

      <div className="mx-auto max-w-6xl">
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl accent-gradient text-white shadow-lg shadow-violet-500/20">
                <IconFolder size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Notes</h2>
                <p className={`text-sm ${muted}`}>{notes.length} notes · autosaved to your account</p>
              </div>
            </div>
            <button
              onClick={addNote}
              className="flex items-center gap-2 rounded-xl accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
            >
              <IconPlus size={16} /> Add note
            </button>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* List */}
            <div className={`col-span-12 md:col-span-4 rounded-2xl border ${softBorder} p-2 ${dark ? "bg-[#0E0E0E]" : "bg-white"}`}>
              <div className={`px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                Notes ({notes.length})
              </div>
              <div className="space-y-1 max-h-[70vh] overflow-y-auto nice-scroll pr-1">
                {notes.length === 0 && (
                  <div className={`rounded-xl border border-dashed py-10 text-center text-xs ${muted} ${dark ? "border-white/5" : "border-zinc-300"}`}>
                    No notes yet — click "Add note" to create one.
                  </div>
                )}
                {notes.map((n, i) => {
                  const isSel = selected?.id === n.id;
                  const isRenaming = renaming === n.id;
                  return (
                    <div
                      key={n.id}
                      className={`group rounded-xl border p-3 transition cursor-pointer ${
                        isSel
                          ? "accent-gradient border-transparent text-white shadow-lg shadow-violet-500/20"
                          : `${subtask} hover:-translate-y-[1px]`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1" onClick={() => !isRenaming && setSelectedId(n.id)}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`shrink-0 text-[10px] font-bold ${
                                isSel ? "bg-white/25 text-white" : "accent-text"
                              } rounded-md px-1.5 py-0.5`}
                            >
                              #{i + 1}
                            </span>
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename();
                                  if (e.key === "Escape") setRenaming(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-full rounded-lg border px-2 py-1 text-sm font-semibold outline-none ${dark ? "bg-[#0A0A0A] border-white/10 text-white" : "bg-white border-zinc-300 text-zinc-900"}`}
                              />
                            ) : (
                              <div className="truncate text-sm font-semibold">{n.title}</div>
                            )}
                          </div>
                          <div className={`mt-1.5 line-clamp-2 text-xs ${isSel ? "text-white/85" : muted}`}>
                            {n.body || "Empty note — click to start writing…"}
                          </div>
                          <div className={`mt-2 text-[10px] ${isSel ? "text-white/70" : muted}`}>
                            Updated {formatDate(n.updatedAt)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(n); }}
                            className={`opacity-0 transition group-hover:opacity-100 rounded-md p-1.5 ${isSel ? "bg-white/20 text-white hover:bg-white/30" : dark ? "hover:bg-white/5 text-zinc-300" : "hover:bg-zinc-200 text-zinc-700"}`}
                            title="Rename"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                            className="opacity-0 transition group-hover:opacity-100 rounded-md p-1.5 text-red-400 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editor */}
            <div className={`col-span-12 md:col-span-8 flex flex-col rounded-2xl border ${softBorder} ${dark ? "bg-[#0E0E0E]" : "bg-white"} p-4 min-h-[70vh]`}>
              {!selected ? (
                <div className={`flex flex-1 items-center justify-center text-sm ${muted}`}>
                  Select a note from the list to begin editing.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-bold">{selected.title}</h3>
                      <div className={`text-xs ${muted}`}>
                        Created {formatDate(selected.createdAt)} · last updated {formatDate(selected.updatedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startRename(selected)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${dark ? "bg-[#242424] text-zinc-200 hover:bg-[#2e2e2e]" : "bg-[#F5F5F5] text-zinc-700 hover:bg-zinc-200"}`}
                      >
                        <IconEdit size={14} /> Rename
                      </button>
                      <button
                        onClick={() => deleteNote(selected.id)}
                        className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                      >
                        <IconTrash size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={selected.body}
                    onChange={(e) => updateBody(e.target.value)}
                    placeholder="Write your note here… Markdown-friendly free-form notes, saved automatically."
                    className={`mt-4 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm leading-relaxed outline-none transition ${inputBase}`}
                  />
                  <div className={`mt-3 text-right text-xs ${muted}`}>
                    {selected.body.length} characters · autosaved
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
