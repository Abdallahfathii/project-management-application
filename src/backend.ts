/**
 * backend.ts
 * ---------------------------------------------------------------
 * Simulated "backend" that mimics a REST API.  All state is
 * persisted to localStorage just like a real server would persist
 * to a database, and every exported function is async so the UI
 * can treat it exactly as if it were fetch() calls to a server.
 *
 * Shape of the "database":
 *   {
 *     users: [ { id, username, email, passwordHash, createdAt } ],
 *     projects: { [userId]: [ Project, Project, ... ] },
 *     sessions: { [token]: userId }
 *   }
 *
 * Passwords are hashed with a naive (deterministic) hash — this
 * is a simulation of a backend, not production security.
 */
import type { AppData, Project, ProjectStatus, Theme, UserPrefs, UserNote } from "./types";
export type { UserPrefs, Theme, UserNote };

const DB_KEY = "nexus.db.v1";
const TOKEN_KEY = "nexus.session.v1";
const THEME_KEY = "nexus.theme.v1";
export { THEME_KEY };

/* ----------------------------- types ----------------------------- */
export interface BackendUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}
export interface DbShape {
  users: BackendUser[];
  projects: Record<string, Project[]>;   // userId -> projects
  prefs: Record<string, UserPrefs>;       // userId -> prefs
  sessions: Record<string, string>;        // token  -> userId
  usersByLower: Record<string, string>;   // usernameLower -> userId (index)
}
export interface AuthResponse {
  ok: true;
  token: string;
  user: BackendUser;
}
export interface ErrResponse {
  ok: false;
  error: string;
}

/* ----------------------------- utils ----------------------------- */
function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function naiveHash(s: string): string {
  // Not cryptographic — used only to simulate "hashed password" storage.
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "h_" + (h >>> 0).toString(16) + "_" + s.length;
}
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

/* ----------------------------- db ops ----------------------------- */
export function defaultPrefs(): UserPrefs {
  return {
    photo: "",
    bio: "",
    role: "Project Manager",
    theme: "dark",
    sidebarCollapsed: false,
    language: "en",
    appearance: {
      accentIndex: 0,
      sidebarGradient: true,
      compactLayout: false,
      roundedStyle: "rounded",
    },
    notifications: {
      taskReminders: true,
      projectUpdates: true,
      weeklyDigest: true,
      marketing: false,
      desktopPush: true,
      emailDigest: false,
    },
    notes: [],
  };
}

function emptyDb(): DbShape {
  const now = new Date().toISOString();
  const adminId = uid("usr");
  return {
    users: [
      {
        id: adminId,
        username: "admin",
        fullName: "Administrator",
        email: "admin@nexus.app",
        passwordHash: naiveHash("admin123"),
        createdAt: now,
      },
    ],
    usersByLower: { admin: adminId },
    projects: { [adminId]: sampleProjects() },
    prefs: { [adminId]: defaultPrefs() },
    sessions: {},
  };
}

function readDb(): DbShape {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const db = emptyDb();
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return db;
    }
    const parsed = JSON.parse(raw) as DbShape;
    if (!parsed.users) parsed.users = [];
    if (!parsed.projects) parsed.projects = {};
    if (!parsed.sessions) parsed.sessions = {};
    if (!parsed.usersByLower) parsed.usersByLower = {};
    return parsed;
  } catch {
    const db = emptyDb();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
}
function writeDb(db: DbShape) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function sampleProjects(): Project[] {
  const now = new Date().toISOString();
  const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
  const mk = (id: string, name: string, description: string, status: ProjectStatus, d: number): Project => ({
    id, name, description, status, createdAt: ago(d), updatedAt: ago(d), tasks: [], notes: [],
  });
  return [
    mk("s1", "Mobile Banking App",
      "Design and develop a cross-platform mobile banking application with biometric authentication and real-time transaction notifications.",
      "In Progress", 12),
    mk("s2", "Marketing Website Redesign",
      "Complete visual and UX overhaul of the corporate marketing site — focus on conversion, accessibility and a modern design system.",
      "Planning", 5),
    mk("s3", "Internal CRM System",
      "Customer relationship management tool for the sales team: pipelines, contact management, automated email campaigns.",
      "Completed", 60),
    mk("s4", "Data Analytics Dashboard",
      "A real-time analytics dashboard consuming multiple data sources — charts, custom reports and exportable CSV / PDF.",
      "On Hold", 28),
    mk("s5", "Open-Source SDK",
      "A lightweight JavaScript SDK for our public API with full TypeScript definitions, JSDoc and CI-driven releases.",
      "In Progress", 18),
    mk("s6", "Brand Guidelines v2",
      "Revised brand identity, typography system and an updated Figma design-library shared across all product teams.",
      "Planning", 2),
  ].map((p, i) => ({ ...p, id: uid("seed") + i }));
  void now;
}

/* ------------------ session helpers (frontend) ------------------ */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

/** Look up the current user from a token (sync, no delay). */
export function currentUser(): BackendUser | null {
  const tok = getToken();
  if (!tok) return null;
  const db = readDb();
  const uid_ = db.sessions[tok];
  if (!uid_) { clearToken(); return null; }
  return db.users.find((u) => u.id === uid_) || null;
}

/* ============================ API ================================= */

/** POST /api/auth/register */
export async function apiRegister(
  params: { username: string; email: string; password: string; confirmPassword: string },
): Promise<AuthResponse | ErrResponse> {
  const { username, email, password, confirmPassword } = params;

  // Validate
  if (!username || username.trim().length < 3) return delay({ ok: false, error: "Username must be at least 3 characters." });
  if (!/^[A-Za-z0-9_.\-]+$/.test(username)) return delay({ ok: false, error: "Username can only contain letters, numbers, . _ -" });
  if (!email || !/.+@.+\..+/.test(email)) return delay({ ok: false, error: "Please enter a valid email address." });
  if (!password || password.length < 6) return delay({ ok: false, error: "Password must be at least 6 characters." });
  if (password !== confirmPassword) return delay({ ok: false, error: "Passwords do not match." });

  const db = readDb();
  const lower = username.trim().toLowerCase();
  if (db.usersByLower[lower]) return delay({ ok: false, error: "That username is already taken." });
  if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return delay({ ok: false, error: "An account with that email already exists." });
  }

  const id = uid("usr");
  const user: BackendUser = {
    id, username: username.trim(), fullName: username.trim(), email: email.trim(),
    passwordHash: naiveHash(password), createdAt: new Date().toISOString(),
  };
  const token = uid("tok");
  db.users.push(user);
  db.usersByLower[lower] = id;
  db.projects[id] = [];
  db.prefs[id] = defaultPrefs();
  db.sessions[token] = id;
  writeDb(db);
  setToken(token);
  return delay({ ok: true as const, token, user });
}

/** POST /api/auth/login */
export async function apiLogin(
  params: { username: string; password: string },
): Promise<AuthResponse | ErrResponse> {
  const { username, password } = params;
  if (!username || !password) return delay({ ok: false, error: "Username and password are required." });

  const db = readDb();
  const lower = username.trim().toLowerCase();
  const uid_ = db.usersByLower[lower];
  const user = uid_ ? db.users.find((u) => u.id === uid_) : db.users.find((u) => u.username.toLowerCase() === lower);
  if (!user) return delay({ ok: false, error: "No account found with that username." });
  if (user.passwordHash !== naiveHash(password)) return delay({ ok: false, error: "Incorrect password." });

  const token = uid("tok");
  db.sessions[token] = user.id;
  writeDb(db);
  setToken(token);
  return delay({ ok: true as const, token, user });
}

/** POST /api/auth/logout */
export async function apiLogout(): Promise<void> {
  const tok = getToken();
  if (tok) {
    const db = readDb();
    delete db.sessions[tok];
    writeDb(db);
  }
  clearToken();
  return delay(undefined, 150);
}

/** GET /api/projects — returns all projects for the current user. */
export async function apiLoadProjects(): Promise<{ user: BackendUser; data: AppData } | null> {
  const user = currentUser();
  if (!user) return delay(null, 150);
  const db = readDb();
  const list = db.projects[user.id] || [];
  return delay({
    user,
    data: { projects: list, lastModified: new Date().toISOString() },
  }, 150);
}

/** PUT /api/projects — replaces the project list for the current user. */
export async function apiSaveProjects(projects: Project[]): Promise<void> {
  const user = currentUser();
  if (!user) return;
  const db = readDb();
  db.projects[user.id] = projects;
  writeDb(db);
}

/* ---------------------- user & prefs API ----------------------- */

export interface LoadMeResponse {
  user: BackendUser;
  prefs: UserPrefs;
  projectCount: number;
}

/** GET /api/me — current user + prefs */
export async function apiLoadMe(): Promise<LoadMeResponse | null> {
  const u = currentUser();
  if (!u) return delay(null, 120);
  const db = readDb();
  return delay({
    user: u,
    prefs: db.prefs[u.id] || defaultPrefs(),
    projectCount: (db.projects[u.id] || []).length,
  }, 120);
}

/** PUT /api/me — update profile info (fullName, email, username if unused) */
export async function apiUpdateMe(patch: Partial<Pick<BackendUser, "fullName" | "email" | "username">>): Promise<BackendUser | ErrResponse> {
  const u = currentUser();
  if (!u) return delay({ ok: false, error: "Not signed in" });
  const db = readDb();
  if (patch.username && patch.username.trim().toLowerCase() !== u.username.toLowerCase()) {
    const lower = patch.username.trim().toLowerCase();
    if (db.usersByLower[lower]) return delay({ ok: false, error: "That username is already taken." });
    delete db.usersByLower[u.username.toLowerCase()];
    db.usersByLower[lower] = u.id;
  }
  const target = db.users.find((x) => x.id === u.id);
  if (!target) return delay({ ok: false, error: "User not found" });
  if (patch.email) target.email = patch.email.trim();
  if (patch.fullName) target.fullName = patch.fullName.trim();
  if (patch.username) target.username = patch.username.trim();
  writeDb(db);
  return delay(target, 220);
}

/** PUT /api/me/password — change password */
export async function apiChangePassword(current: string, next: string, confirm: string): Promise<{ ok: true } | ErrResponse> {
  const u = currentUser();
  if (!u) return delay({ ok: false, error: "Not signed in" });
  if (next.length < 6) return delay({ ok: false, error: "New password must be at least 6 characters." });
  if (next !== confirm) return delay({ ok: false, error: "Passwords do not match." });
  const db = readDb();
  const target = db.users.find((x) => x.id === u.id);
  if (!target) return delay({ ok: false, error: "User not found" });
  if (target.passwordHash !== naiveHash(current)) return delay({ ok: false, error: "Current password is wrong." });
  target.passwordHash = naiveHash(next);
  writeDb(db);
  return delay({ ok: true as const }, 250);
}

/** PUT /api/me/prefs — replace user prefs */
export async function apiSavePrefs(prefs: UserPrefs): Promise<UserPrefs | null> {
  const u = currentUser();
  if (!u) return delay(null, 80);
  const db = readDb();
  db.prefs[u.id] = prefs;
  writeDb(db);
  return delay(prefs, 120);
}

/** DELETE /api/me — delete current account and all its projects */
export async function apiDeleteAccount(): Promise<void> {
  const u = currentUser();
  if (!u) return;
  const db = readDb();
  db.users = db.users.filter((x) => x.id !== u.id);
  delete db.usersByLower[u.username.toLowerCase()];
  delete db.projects[u.id];
  delete db.prefs[u.id];
  for (const [tok, uid_] of Object.entries(db.sessions)) if (uid_ === u.id) delete db.sessions[tok];
  writeDb(db);
  clearToken();
}

/* ------------- password reset (in-memory tokens, expires) ------------ */
interface ResetEntry { code: string; userId: string; expiresAt: number; }
let RESET_TOKENS: Record<string, ResetEntry> = {};
let RESET_BY_EMAIL: Record<string, string> = {}; // email -> resetId (so we can show the code in the UI)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of Object.entries(RESET_TOKENS)) if (v.expiresAt < now) {
    delete RESET_TOKENS[k];
    for (const [e, id] of Object.entries(RESET_BY_EMAIL)) if (id === k) delete RESET_BY_EMAIL[e];
  }
}, 30_000);

/**
 * POST /api/auth/request-reset
 * Simulates sending a reset-code email. The code is returned here so the
 * UI can show it to the user (in a real app this would be emailed only).
 */
export async function apiRequestReset(email: string): Promise<{ ok: true; code: string; resetId: string } | ErrResponse> {
  const db = readDb();
  const target = db.users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (!target) return delay({ ok: false, error: "No account found with that email." }, 400);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const resetId = uid("rst");
  RESET_TOKENS[resetId] = { code, userId: target.id, expiresAt: Date.now() + 15 * 60_000 };
  RESET_BY_EMAIL[target.email.toLowerCase()] = resetId;
  return delay({ ok: true as const, code, resetId }, 600);
}

/** POST /api/auth/confirm-reset — apply the new password using the emailed code */
export async function apiConfirmReset(params: { resetId: string; code: string; newPassword: string; confirmPassword: string }): Promise<{ ok: true } | ErrResponse> {
  const { resetId, code, newPassword, confirmPassword } = params;
  if (newPassword.length < 6) return delay({ ok: false, error: "Password must be at least 6 characters." }, 250);
  if (newPassword !== confirmPassword) return delay({ ok: false, error: "Passwords do not match." }, 250);
  const entry = RESET_TOKENS[resetId];
  if (!entry) return delay({ ok: false, error: "Reset link expired or invalid. Try again." }, 250);
  if (entry.code !== code.trim()) return delay({ ok: false, error: "Incorrect verification code." }, 250);
  if (Date.now() > entry.expiresAt) return delay({ ok: false, error: "Reset code has expired." }, 250);
  const db = readDb();
  const target = db.users.find((u) => u.id === entry.userId);
  if (!target) return delay({ ok: false, error: "Account no longer exists." }, 250);
  target.passwordHash = (function (s: string): string {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return "h_" + (h >>> 0).toString(16) + "_" + s.length;
  })(newPassword);
  writeDb(db);
  delete RESET_TOKENS[resetId];
  for (const [e, id] of Object.entries(RESET_BY_EMAIL)) if (id === resetId) delete RESET_BY_EMAIL[e];
  return delay({ ok: true as const }, 250);
}

/* ---------------------- helpers for the UI ---------------------- */
export function newProjectId(): string { return uid("proj"); }
export function newTaskId(): string      { return uid("task"); }
export function newNoteId(): string      { return uid("note"); }
