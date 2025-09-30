import { useState } from "react";
import USERS from "../data/users.json";
import EMPLOYEES from "../data/employees.json";
import { normalizeEmployees } from "../utils/buildTree";

const EMP_STORAGE_KEY = "employees";      // where your admin "Create User" saves employees
const DYN_USERS_KEY   = "usersDynamic";   // extra logins created by admin (non-employee)
const DEFAULT_PASSWORD = "pass123";

const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

function readArrayFromLS(key) {
  try {
    const s = localStorage.getItem(key);
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Employees: prefer localStorage (admin-created/edited), fallback to bundled JSON
  function readEmployees() {
    const stored = readArrayFromLS(EMP_STORAGE_KEY);
    const base = stored.length ? stored : EMPLOYEES;
    return normalizeEmployees(base);
  }

  // Build unified login directory
  function buildDirectory() {
    const employees = readEmployees();

    // Every employee can login with their full name
    const empUsers = employees.map((e) => ({
      username: (e.name ?? "").trim(),
      usernameNormalized: norm(e.name),
      name: e.name,
      isAdmin: false,
      empId: e.id,
    }));

    // Static users from users.json (e.g., admin)
    const staticUsers = (USERS || []).map((u) => {
      const uName = (u.username ?? u.name ?? "").trim();
      const disp  = (u.name ?? u.username ?? "").trim();
      return {
        username: uName,
        usernameNormalized: norm(uName),
        name: disp,
        isAdmin: !!u.isAdmin,
      };
    });

    // Dynamic users that admin may create who are NOT employees
    // (optional: only used if your Create User modal stores to this key)
    const dynamicUsers = readArrayFromLS(DYN_USERS_KEY).map((u) => {
      const uName = (u.username ?? u.name ?? "").trim();
      const disp  = (u.name ?? u.username ?? "").trim();
      return {
        username: uName,
        usernameNormalized: norm(uName),
        name: disp,
        isAdmin: !!u.isAdmin,
      };
    });

    return [...staticUsers, ...dynamicUsers, ...empUsers];
  }

  async function login(username, password) {
    const input = (username || "").trim();
    if (!input) throw new Error("Invalid user");

    const directory = buildDirectory();
    const target = norm(input);

    const found = directory.find((u) => u.usernameNormalized === target);
    if (!found) throw new Error("Invalid user");

    if (password !== DEFAULT_PASSWORD) {
      throw new Error("Invalid password");
    }

    setUser(found);
    localStorage.setItem("user", JSON.stringify(found));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  return { user, isAuthenticated: Boolean(user), login, logout };
}
