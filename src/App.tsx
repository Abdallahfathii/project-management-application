import { useEffect, useMemo, useState } from "react";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import ProjectForm from "./components/ProjectForm";
import ProjectDetail from "./components/ProjectDetail";
import SettingsPage from "./components/Settings";
import ManageAccount, { ACCENT_GRADIENTS } from "./components/ManageAccount";
import NotificationsPage from "./components/Notifications";
import NotesPage from "./components/NotesPage";
import { IconPlus } from "./icons";
import {
  apiLogin,
  apiLogout,
  apiLoadProjects,
  apiSaveProjects,
  newProjectId,
  newTaskId,
  newNoteId,
  currentUser,
  apiLoadMe,
  apiSavePrefs,
  defaultPrefs,
  THEME_KEY,
  type BackendUser,
  type UserPrefs,
} from "./backend";
import type { AppData, PageKey, Project, ProjectStatus, Theme } from "./types";

function loadTheme(): Theme {
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark") return v;
  return "dark";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [user, setUser] = useState<BackendUser | null>(() => currentUser());
  const [data, setData] = useState<AppData>({ projects: [], lastModified: new Date().toISOString() });
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs());
  const [bootLoading, setBootLoading] = useState<boolean>(!!currentUser());
  const [page, setPage] = useState<PageKey>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* persist theme */
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.className = theme === "light" ? "theme-light" : "";
  }, [theme]);

  /* On mount: if a session token exists, fetch the user's projects + prefs */
  useEffect(() => {
    let cancelled = false;
    if (!user) { setBootLoading(false); return; }
    (async () => {
      const [proj, me] = await Promise.all([apiLoadProjects(), apiLoadMe()]);
      if (cancelled) return;
      if (!proj) { setUser(null); setBootLoading(false); return; }
      setUser(proj.user);
      setData(proj.data);
      if (me) {
        setPrefs(me.prefs);
        if (me.prefs.theme) setTheme(me.prefs.theme);
      }
      setBootLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* persist theme into user prefs whenever it changes — saves to backend */
  useEffect(() => {
    if (!user) return;
    apiSavePrefs({ ...prefs, theme }); // eslint-disable-line react-hooks/exhaustive-deps
  }, [theme]);

   /* Apply selected accent via CSS custom properties so we can override the gradient on the fly */
   useEffect(() => {
     const g = ACCENT_GRADIENTS[prefs.appearance.accentIndex % ACCENT_GRADIENTS.length];
     const style = document.documentElement.style;
     style.setProperty("--nexus-accent", g.css);
     style.setProperty("--nexus-radius", prefs.appearance.roundedStyle === "sharp" ? "8px" : prefs.appearance.roundedStyle === "pill" ? "9999px" : "14px");
     style.setProperty("--nexus-compact", prefs.appearance.compactLayout ? "1" : "0");
     style.setProperty("--nexus-sidebar-gradient", prefs.appearance.sidebarGradient ? "1" : "0");
   }, [prefs.appearance.accentIndex, prefs.appearance.roundedStyle, prefs.appearance.compactLayout, prefs.appearance.sidebarGradient]);

   /* auto-save prefs whenever notes change */
   useEffect(() => {
     if (!user) return;
     apiSavePrefs(prefs); // fire & forget — the "backend" persists to its store
   }, [prefs.notes, user]); // eslint-disable-line react-hooks/exhaustive-deps

  /* auto-save to backend whenever projects change (debounced by effect flush) */
  useEffect(() => {
    if (!user) return;
    apiSaveProjects(data.projects); // fire & forget — the "backend" persists to its store
  }, [data, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const dark = theme === "dark";
  const shell = dark ? "bg-[#0A0A0A] text-zinc-100" : "bg-[#FFFFFF] text-zinc-900";

  const selected: Project | undefined = useMemo(
    () => data.projects.find((p) => p.id === selectedId) || undefined,
    [data, selectedId],
  );

  /* ---------- auth ---------- */
  const handleAuthSuccess = (u: BackendUser) => {
    setUser(u);
    setBootLoading(true); // will flip off once apiLoadProjects resolves
    setPage("dashboard");
    setSelectedId(null);
  };

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setPage("dashboard");
    setSelectedId(null);
    setData({ projects: [], lastModified: new Date().toISOString() });
  };

  // Silence unused import warning if bundler is strict
  void apiLogin;

  /* ---------- navigation ---------- */
  const go = (p: PageKey) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openProject = (id: string) => { setSelectedId(id); setPage("detail"); window.scrollTo({ top: 0 }); };
  const editProject = (id: string) => { setSelectedId(id); setPage("edit"); window.scrollTo({ top: 0 }); };

  /* ---------- mutations ---------- */
  const deleteProject = (id: string) => {
    setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id), lastModified: new Date().toISOString() }));
  };

  const saveNewProject = (name: string, description: string, status: ProjectStatus) => {
    const now = new Date().toISOString();
    const p: Project = {
      id: newProjectId(),
      name, description, status,
      createdAt: now, updatedAt: now,
      tasks: [], notes: [],
    };
    setData((prev) => ({ ...prev, projects: [p, ...prev.projects], lastModified: now }));
    setSelectedId(p.id);
    setPage("detail");
  };

  const saveEditProject = (name: string, description: string, status: ProjectStatus) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId ? { ...p, name, description, status, updatedAt: now } : p,
      ),
    }));
    setPage("detail");
  };

  const updateDescription = (description: string) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId ? { ...p, description, updatedAt: now } : p,
      ),
    }));
  };

  const toggleTask = (taskId: string) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)), updatedAt: now }
          : p,
      ),
    }));
  };

  const addTask = (name: string) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId
          ? { ...p, tasks: [...p.tasks, { id: newTaskId(), name, done: false, createdAt: now }], updatedAt: now }
          : p,
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId), updatedAt: now } : p,
      ),
    }));
  };

  const addNote = (title: string, body: string) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId
          ? { ...p, notes: [...p.notes, { id: newNoteId(), title, body, createdAt: now }], updatedAt: now }
          : p,
      ),
    }));
  };

  const deleteNote = (noteId: string) => {
    if (!selectedId) return;
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      lastModified: now,
      projects: prev.projects.map((p) =>
        p.id === selectedId ? { ...p, notes: p.notes.filter((n) => n.id !== noteId), updatedAt: now } : p,
      ),
    }));
  };

  const exportJSON = () => {
    const payload = { exportedAt: new Date().toISOString(), user: user?.username, ...data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-${user?.username ?? "projects"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (next: AppData) => {
    setData({ projects: next.projects || [], lastModified: new Date().toISOString() });
    setPage("dashboard");
    setSelectedId(null);
  };

  const clearAll = () => {
    setData({ projects: [], lastModified: new Date().toISOString() });
    setSelectedId(null);
  };

  /* ---------- loading / guard ---------- */
  if (!user) {
    return (
      <Auth
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (bootLoading) {
    return (
      <div className={`flex min-h-screen w-full items-center justify-center ${shell}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-violet-500/30 border-t-violet-500 animate-spin" />
          <div className={`text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Loading your workspace…</div>
        </div>
      </div>
    );
  }

  /* ---------- page metadata ---------- */
  const headerTitles: Record<PageKey, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: `${data.projects.length} projects · last saved ${new Date(data.lastModified).toLocaleTimeString()}`,
    },
    add:      { title: "Add Project", subtitle: "Create a new project and save it to your workspace" },
    edit:     { title: "Edit Project", subtitle: "Update project details" },
    detail:   {
      title: selected?.name || "Project",
      subtitle: selected ? `${selected.status} · created ${new Date(selected.createdAt).toLocaleDateString()}` : "",
    },
    settings: { title: "Settings", subtitle: "Appearance, data and workspace options" },
    account:  { title: "Manage account", subtitle: user ? `${user.fullName || user.username} · ${user.email}` : "" },
    notifications: { title: "Notifications", subtitle: "Inbox, channels and preferences" },
    notes: { title: "Notes", subtitle: `${prefs.notes.length} personal notes · autosaved` },
  };
  const titleInfo = headerTitles[page];

  /* ---------- render ---------- */
  return (
    <div className={`flex min-h-screen w-full ${shell}`}>
      <Sidebar
        theme={theme}
        active={page === "detail" || page === "edit" ? "dashboard" : page}
        onNavigate={go}
        onLogout={handleLogout}
        projectCount={data.projects.length}
        prefs={prefs}
        user={user}
        collapsed={!!prefs.sidebarCollapsed}
        onToggleCollapsed={() => {
          const next = { ...prefs, sidebarCollapsed: !prefs.sidebarCollapsed };
          setPrefs(next);
          apiSavePrefs(next);
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          username={user.fullName || user.username}
          email={user.email}
          photo={prefs.photo}
          title={titleInfo.title}
          subtitle={titleInfo.subtitle}
          action={
            page === "dashboard" ? (
              <button
                onClick={() => go("add")}
                className="hidden md:flex items-center gap-2 rounded-xl accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
              >
                <IconPlus size={16} /> New Project
              </button>
            ) : undefined
          }
        />

        <main className="min-h-[calc(100vh-73px)] flex-1">
          {page === "dashboard" && (
            <Dashboard
              theme={theme}
              projects={data.projects}
              onOpen={openProject}
              onEdit={editProject}
              onDelete={deleteProject}
              onAdd={() => go("add")}
            />
          )}
          {page === "add" && (
            <ProjectForm
              theme={theme}
              mode="add"
              onCancel={() => go("dashboard")}
              onSave={saveNewProject}
            />
          )}
          {page === "edit" && selected && (
            <ProjectForm
              theme={theme}
              mode="edit"
              initial={selected}
              onCancel={() => setPage("detail")}
              onSave={saveEditProject}
            />
          )}
          {page === "detail" && selected && (
            <ProjectDetail
              theme={theme}
              project={selected}
              onBack={() => go("dashboard")}
              onEdit={() => setPage("edit")}
              onUpdateDescription={updateDescription}
              onToggleTask={toggleTask}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onAddNote={addNote}
              onDeleteNote={deleteNote}
            />
          )}
          {page === "detail" && !selected && (
            <Dashboard
              theme={theme}
              projects={data.projects}
              onOpen={openProject}
              onEdit={editProject}
              onDelete={deleteProject}
              onAdd={() => go("add")}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              projectCount={data.projects.length}
              onExport={exportJSON}
              onImport={importJSON}
              onClear={clearAll}
              lastModified={data.lastModified}
            />
          )}
          {page === "account" && user && (
            <ManageAccount
              theme={theme}
              user={user}
              prefs={prefs}
              onBack={() => go("dashboard")}
              onProfileUpdated={(u) => setUser(u)}
              onSave={(next) => {
                setPrefs(next);
                apiSavePrefs(next);
              }}
              onDeleted={() => {
                setUser(null);
                setPrefs(defaultPrefs());
                setData({ projects: [], lastModified: new Date().toISOString() });
              }}
            />
          )}
          {page === "notifications" && user && (
            <NotificationsPage
              theme={theme}
              username={user.fullName || user.username}
              prefs={prefs}
              onSave={(next) => {
                setPrefs(next);
                apiSavePrefs(next);
              }}
              onBack={() => go("dashboard")}
            />
          )}
          {page === "notes" && user && (
            <NotesPage
              theme={theme}
              notes={prefs.notes}
              onSave={(nextNotes) => {
                const next = { ...prefs, notes: nextNotes };
                setPrefs(next);
                apiSavePrefs(next);
              }}
              onBack={() => go("dashboard")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
