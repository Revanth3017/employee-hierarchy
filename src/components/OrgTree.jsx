// src/components/OrgTree.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, ButtonGroup, Collapse,
  IconButton, LinearProgress, Stack, Typography,Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmployeeCard from "./EmployeeCard";
import EMPLOYEES from "../data/employees.json";
import { normalizeEmployees, buildForest } from "../utils/buildTree";

export default function OrgTree({ query = "", focusName = "" ,isAdmin = false }) {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set()); // Set<string>
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

const [openCreate, setOpenCreate] = useState(false);
const [form, setForm] = useState({ name: "", role: "", department: "", managerId: "" });

  const nodeRefs = useRef({}); // id -> element


const STORAGE_KEY = "employees";

useEffect(() => {
  try {
    setLoading(true);
    setErr("");
    const stored = localStorage.getItem(STORAGE_KEY);
    const base = stored ? JSON.parse(stored) : EMPLOYEES;
    setData(normalizeEmployees(base));
    // seed storage on first run
    if (!stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
  } catch (e) {
    setErr("Failed to load employees from localStorage");
    setData(normalizeEmployees(EMPLOYEES));
  } finally {
    setLoading(false);
  }
}, []);




function updateEmployees(updater) {
  setData(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  });
}


  // 2) Build forest and helpers
  const forest = useMemo(() => buildForest(data), [data]);

  const allNodes = useMemo(() => {
    const out = [];
    const walk = (n) => { out.push(n); n.children?.forEach(walk); };
    forest.forEach(walk);
    return out;
  }, [forest]);

  const byId = useMemo(() => new Map(allNodes.map(n => [String(n.id), n])), [allNodes]);

  const expandableIds = useMemo(() => {
    return allNodes.filter(n => n.children?.length).map(n => String(n.id));
  }, [allNodes]);
 

  // highlight state for the bulk buttons (NO hooks here)
const isAllExpanded  = expandableIds.length > 0 && expandableIds.every(id => expanded.has(id));
const isAllCollapsed = expanded.size === 0;


  // 3) Matches for highlight/count
  const matches = useMemo(() => {
    if (!query) return new Set();
    const q = query.toLowerCase();
    return new Set(allNodes.filter(e => (e.name || "").toLowerCase().includes(q)).map(e => e.id));
  }, [allNodes, query]);

  // 4) Expand path to id
  function expandPathTo(idLike) {
    const id = String(idLike);
    const next = new Set(expanded);
    let cur = byId.get(id);
    while (cur && cur.managerId != null) {
      next.add(String(cur.managerId));
      cur = byId.get(String(cur.managerId));
    }
    setExpanded(next);
  }

  // 5) On focus submit (Enter from search)
  useEffect(() => {
    if (!focusName || !allNodes.length) return;
    const q = focusName.toLowerCase();
    const target = allNodes.find(e => (e.name || "").toLowerCase().includes(q));
    if (target) {
      setSelectedId(target.id);
      expandPathTo(target.id);
      const el = nodeRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSelectedId(null);
    }
  }, [focusName, allNodes]); // only when user submits

  // 6) Toggle a node if it has children
  function toggleNode(id, hasChildren) {
    if (!hasChildren) return;
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // 7) Expand/Collapse all
  function expandAll()   { setExpanded(new Set(expandableIds)); }
  function collapseAll() { setExpanded(new Set()); }

  function nextId() {
  // pick max numeric id + 1 (fallback 1)
  const nums = data.map(d => Number(d.id)).filter(n => !Number.isNaN(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

function handleCreateSubmit(e) {
  e.preventDefault();
  const id = nextId();
  const managerId =
    form.managerId === "" ? null : isNaN(Number(form.managerId)) ? form.managerId : Number(form.managerId);

  const newEmp = {
    id,
    name: form.name.trim(),
    role: form.role.trim(),
    department: form.department.trim(),
    managerId
  };

  // add to in-memory dataset; tree rebuilds from state
   updateEmployees(prev => [...prev, newEmp]);

  // focus the new employee and expand its parent chain (if any)
  setSelectedId(id);
  if (managerId != null) expandPathTo(id);

  setOpenCreate(false);
  setForm({ name: "", role: "", department: "", managerId: "" });
}


  // 8) Renderer (pure React, no TreeItem)
  function renderNode(node, depth = 0) {
    const id = String(node.id);
    const hasChildren = !!(node.children && node.children.length);
    const isOpen = expanded.has(id);





    return (
      <Box key={id} sx={{ pl: depth * 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* chevron (kept separate for accessibility) */}
         {hasChildren ? (
  <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation();              // keep the click local to the arrow
      setSelectedId(node.id);           // ← focus this card
      toggleNode(id, hasChildren);      // expand / collapse
      // optional: center it in view when you expand/collapse
      // nodeRefs.current[node.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }}
    aria-label={isOpen ? "collapse" : "expand"}
    aria-pressed={isOpen}
  >
    {isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}
  </IconButton>
) : (
  <Box sx={{ width: 40 }} />
)}

          {/* card (also toggles if manager) */}
       <Box
  ref={el => (nodeRefs.current[node.id] = el)}
  onClick={() => setSelectedId(node.id)}          // select only
  role="button"
  tabIndex={0}
  aria-selected={selectedId === node.id}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") setSelectedId(node.id);
  }}
  sx={{ flex: 1, cursor: "pointer" }}
>
  <EmployeeCard emp={node} query={query} selected={selectedId === node.id} />
</Box>

        </Stack>

        {/* children */}
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2 }}>
              {node.children.map(child => renderNode(child, depth + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  }

  // states
  if (loading) {
    return (
      <Box sx={{ p: 1 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading organization…
        </Typography>
      </Box>
    );
  }
  if (err) return <Alert severity="error" sx={{ my: 1 }}>{err}</Alert>;
  if (!forest.length) {
    return (
      <Alert severity="info" sx={{ my: 1 }}>
        No employees to display. Confirm <strong>public/employees.json</strong> has records with
        <em> id, name, role, department, managerId</em> (or equivalent keys).
      </Alert>
    );
  }

  // tree
  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, justifyContent: "flex-end", flexWrap: "wrap", rowGap: 1 }}>
        <Typography variant="body2" sx={{ mr: "auto" }}>
          {query ? (matches.size ? `${matches.size} match${matches.size > 1 ? "es" : ""}` : "No matches") : " "}
        </Typography>
<ButtonGroup size="small" variant="outlined">
  <Button
    onClick={expandAll}
    variant={isAllExpanded ? "contained" : "outlined"}
  >
    Expand all
  </Button>
  <Button
    onClick={collapseAll}
    variant={isAllCollapsed ? "contained" : "outlined"}
  >
    Collapse all
  </Button>
</ButtonGroup>


 {isAdmin && (
   <Button
     size="small"
     variant="contained"
     onClick={() => setOpenCreate(true)}
   >
     Create User
   </Button>
 )}



      </Stack>

      {forest.map(root => renderNode(root))}
   
   <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
  <DialogTitle>Create User (Employee)</DialogTitle>
  <DialogContent>
    <Stack component="form" onSubmit={handleCreateSubmit} spacing={1.5} sx={{ mt: 1 }}>
      <TextField
        label="Name" value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))}
        required autoFocus
      />
      <TextField
        label="Role" value={form.role} onChange={(e)=>setForm(f=>({...f, role:e.target.value}))}
        required
      />
      <TextField
        label="Department" value={form.department} onChange={(e)=>setForm(f=>({...f, department:e.target.value}))}
        required
      />
      <TextField
        label="Manager ID (optional)"
        placeholder="e.g. 1"
        value={form.managerId}
        onChange={(e)=>setForm(f=>({...f, managerId:e.target.value}))}
        helperText="Leave blank for top-level (no manager)"
      />
      {/* Hidden submit for Enter key inside fields */}
      <button type="submit" style={{ display:"none" }} />
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
    <Button onClick={handleCreateSubmit} variant="contained">Create</Button>
  </DialogActions>
</Dialog>

   
  
    </Box>
  );
}
