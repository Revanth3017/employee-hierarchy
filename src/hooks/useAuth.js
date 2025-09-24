import { useState } from "react";

/**
 * useAuth: minimal fake auth using /public/users.json
 * - login(username, password): fetch users and find a match
 * - logout(): clear user
 * - persists user in localStorage so refresh keeps you logged in
 */
export default function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  async function login(username, password) {
    const res = await fetch("/users.json");
    const users = await res.json();
    const found = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) throw new Error("Invalid credentials");
    setUser(found);
    localStorage.setItem("user", JSON.stringify(found));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  return { user, isAuthenticated: !!user, login, logout };
}
