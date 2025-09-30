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
    const u = USERS.find(
      x => x.username.toLowerCase() === String(username).toLowerCase()
    );
    if (!u) throw new Error("Invalid User");                  // clearer message

    if (u.password !== password) throw new Error("Invalid password");

    const session = {
      username: u.username,
      name: u.name,
      isAdmin: !!u.isAdmin || u.username.toLowerCase() === "admin"
    };
    setUser(session);
    localStorage.setItem("user", JSON.stringify(session));
  }


  function logout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  return { user, isAuthenticated: Boolean(user), login, logout };
}
