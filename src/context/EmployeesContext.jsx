import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import SEED from "../data/employees.json"; // your baseline data

const EmployeesCtx = createContext(null);

function cascadeIds(list, rootId) {
  // find all ids under rootId (including itself)
  const byMgr = new Map();
  list.forEach(e => {
    const k = String(e.managerId ?? "");
    if (!byMgr.has(k)) byMgr.set(k, []);
    byMgr.get(k).push(e);
  });
  const out = new Set([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop();
    const kids = byMgr.get(String(cur)) || [];
    for (const k of kids) if (!out.has(k.id)) { out.add(k.id); stack.push(k.id); }
  }
  return out;
}

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return { ...state, employees: action.payload, ready: true };
    case "ADD": {
      const nextId = Math.max(0, ...state.employees.map(e => +e.id || 0)) + 1;
      const emp = { ...action.payload, id: nextId };
      return { ...state, employees: [...state.employees, emp] };
    }
    case "UPDATE": {
      const { id, patch } = action.payload;
      return {
        ...state,
        employees: state.employees.map(e => (e.id === id ? { ...e, ...patch } : e))
      };
    }
    case "DELETE": {
      const ids = cascadeIds(state.employees, action.payload); // delete subtree
      return { ...state, employees: state.employees.filter(e => !ids.has(e.id)) };
    }
    case "REPLACE_ALL":
      return { ...state, employees: action.payload };
    default:
      return state;
  }
}

export function EmployeesProvider({ children, persist = false }) {
  const [state, dispatch] = useReducer(reducer, { employees: [], ready: false });

  // Load initial data
  useEffect(() => {
    if (persist) {
      const saved = localStorage.getItem("employees");
      if (saved) {
        dispatch({ type: "INIT", payload: JSON.parse(saved) });
        return;
      }
    }
    dispatch({ type: "INIT", payload: SEED });
  }, [persist]);

  // Optional persistence
  useEffect(() => {
    if (persist && state.ready) {
      localStorage.setItem("employees", JSON.stringify(state.employees));
    }
  }, [persist, state.ready, state.employees]);

  const api = useMemo(() => ({
    employees: state.employees,
    ready: state.ready,
    addEmployee: (emp) => dispatch({ type: "ADD", payload: emp }),
    updateEmployee: (id, patch) => dispatch({ type: "UPDATE", payload: { id, patch } }),
    deleteEmployee: (id) => dispatch({ type: "DELETE", payload: id }),
    replaceAll: (list) => dispatch({ type: "REPLACE_ALL", payload: list }),
  }), [state.employees, state.ready]);

  return <EmployeesCtx.Provider value={api}>{children}</EmployeesCtx.Provider>;
}

export function useEmployees() {
  const ctx = useContext(EmployeesCtx);
  if (!ctx) throw new Error("useEmployees must be used inside <EmployeesProvider>");
  return ctx;
}
