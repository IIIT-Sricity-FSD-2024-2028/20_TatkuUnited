import type { AuthInterface } from "../../models/auth.models";

export function readSession(): AuthInterface | null {
  try {
    const token = sessionStorage.getItem("token");
    const raw = sessionStorage.getItem("user");
    if (!token || !raw) return null;
    const user = JSON.parse(raw);
    if (!user || typeof user !== "object") return null;
    const id = user.id ?? user._id;
    if (typeof id !== "string" || !id ||
        !["customer", "provider", "manager", "admin"].includes(user.role) ||
        typeof user.name !== "string" || typeof user.email !== "string" ||
        typeof user.phone !== "string") return null;
    return { token, user: { id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, status: user.status } };
  } catch {
    return null;
  }
}

export function persistSession(session: AuthInterface | null): void {
  try {
    if (session) {
      sessionStorage.setItem("token", session.token);
      sessionStorage.setItem("user", JSON.stringify(session.user));
    } else {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
  } catch {
    // Storage can be disabled; the in-memory Redux session still works.
  }
}
