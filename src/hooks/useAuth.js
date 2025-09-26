import { useState } from "react";
import USERS from "../data/users.json";

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
  // no fetch now — data is bundled
  const users = USERS;
  const found = users.find(u => u.username === username && u.password === password);
  if (!found) throw new Error("Invalid credentials");
  setUser({ username: found.username, name: found.name }); // avoid storing password
  localStorage.setItem("user", JSON.stringify({ username: found.username, name: found.name }));
}


  function logout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  return { user, isAuthenticated: Boolean(user), login, logout };
}
