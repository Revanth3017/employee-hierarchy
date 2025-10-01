// src/components/OrgTree.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
 Alert, Box, Button, ButtonGroup, Collapse, IconButton,
         LinearProgress, Stack, Typography, TextField, Dialog, DialogTitle,
         DialogContent, DialogActions, MenuItem } from "@mui/material";
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

const [createOpen, setCreateOpen] = useState(false);
const [form, setForm] = useState({ name: "", role: "", department: "", managerId: "" });

const [openEdit, setOpenEdit] = useState(false);
const [editTarget, setEditTarget] = useState(null); // the employee being edited
const [editForm, setEditForm] = useState({ name: "", role: "", department: "", managerId: "" });
const [filterTargetId, setFilterTargetId] = useState(null); // when set → show only path to this id
const didDefaultExpand = useRef(false);
  const nodeRefs = useRef({}); // id -> element
const [errors, setErrors] = useState({});
const managerOptions = useMemo(
  () => data.map(e => ({ id: String(e.id), label: `${e.id} — ${e.name}` })),
  [data]
);
// If you specifically want only 1,2,3:
// const managerOptions = [{id:"1",label:"1 — Alice Johnson"}, {id:"2",label:"2 — Bob Smith"}, {id:"3",label:"3 — Carol White"}];


  // Show-all toggle per manager id (default: show only first 2)
const [showAllChildrenIds, setShowAllChildrenIds] = useState(() => new Set());

// consider any non-empty query as "searching" (chain-only rendering)
const isSearching = (query ?? "").trim().length > 0;

// how many children to preview per manager
const CHILD_PREVIEW_COUNT = 2;

function toggleChildrenView(id) {
  setShowAllChildrenIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}


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

function beginEdit(emp) {
  setEditTarget(emp);
  setEditForm({
    name: emp.name || "",
    role: emp.role || "",
    department: emp.department || "",
    managerId: emp.managerId == null ? "" : String(emp.managerId),
  });
  setOpenEdit(true);
}

function submitEdit(e) {
  e?.preventDefault?.();
  if (!editTarget) return;

  const managerId =
    editForm.managerId === "" ? null :
    (isNaN(Number(editForm.managerId)) ? editForm.managerId : Number(editForm.managerId));

  updateEmployees(prev =>
    prev.map(p =>
      p.id === editTarget.id
        ? {
            ...p,
            name: editForm.name.trim(),
            role: editForm.role.trim(),
            department: editForm.department.trim(),
            managerId,
          }
        : p
    )
  );

  setSelectedId(editTarget.id);
  expandPathTo(editTarget.id);
  setOpenEdit(false);
  setEditTarget(null);
}


function deleteEmp(emp) {
  const ok = window.confirm(
    `Delete "${emp.name}" and everyone who reports to them? This cannot be undone.`
  );
  if (!ok) return;

  // 1) Compute the whole branch to remove using the current list
  const idsToRemove = getDescendantIds(data, emp.id);

  // 2) Remove that entire set from the employees list (and persist via your updater)
  updateEmployees(prev => prev.filter(e => !idsToRemove.has(e.id)));

  // 3) Clean up UI state
  setExpanded(prev => {
    const next = new Set(prev);
    idsToRemove.forEach(id => next.delete(String(id)));
    return next;
  });

  setSelectedId(prev => (prev && idsToRemove.has(prev) ? null : prev));
}

// Suggested option lists
const ROLE_OPTIONS = [
  "Accountant",
  "Backend Engineer",
  "Cloud Engineer",
  "Data Engineer",
  "DevOps Engineer",
  "Engineering Manager",
  "Finance Manager",
  "Frontend Engineer",
  "Full-Stack Engineer",
  "Machine Learning Engineer",
  "Mobile Engineer (Android)",
  "Mobile Engineer (iOS)",
  "Operations Associate",
  "Operations Manager",
  "QA Engineer",
  "QA Manager",
  "Security Engineer",
  "Site Reliability Engineer",
  "Software Architect",
  "Software Engineer",
];


const DEPT_OPTIONS = ["Technology", "Finance", "Operations", "Executive"];


// Returns a Set of ids to remove: the employee and all their descendants.
function getDescendantIds(list, rootId) {
  // Build manager -> [childIds] map
  const childrenByManager = new Map();
  for (const e of list) {
    const key = e.managerId ?? null;
    if (!childrenByManager.has(key)) childrenByManager.set(key, []);
    childrenByManager.get(key).push(e.id);
  }

  const toDelete = new Set([rootId]);
  const stack = [rootId];

  while (stack.length) {
    const cur = stack.pop();
    const kids = childrenByManager.get(cur) || [];
    for (const kidId of kids) {
      if (!toDelete.has(kidId)) {
        toDelete.add(kidId);
        stack.push(kidId);
      }
    }
  }
  return toDelete;
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
  
useEffect(() => {
  if (didDefaultExpand.current) return;          // run only once
  if (!forest.length || filterTargetId) return;  // skip if filtering on a search

  const next = new Set(expanded);
  // expand ALL root nodes (usually just the CEO)
  forest.forEach((root) => next.add(String(root.id)));

  setExpanded(next);
  didDefaultExpand.current = true;
}, [forest, filterTargetId]);  

  // Build the chain of ids from ROOT → ... → TARGET (when filtering)
const chainIds = useMemo(() => {
  if (filterTargetId == null || !byId.size) return null;
  const ids = [];
  let cur = byId.get(String(filterTargetId));
  while (cur) {
    ids.push(String(cur.id));
    if (cur.managerId == null) break;
    cur = byId.get(String(cur.managerId));
  }
  return ids.reverse(); // now root..target
}, [filterTargetId, byId]);

const chainSet = useMemo(() => (chainIds ? new Set(chainIds) : null), [chainIds]);

// Map each chain node -> its NEXT child on the path (to render only that child)
const chainNext = useMemo(() => {
  if (!chainIds) return null;
  const m = new Map();
  for (let i = 0; i < chainIds.length - 1; i++) m.set(chainIds[i], chainIds[i + 1]);
  return m;
}, [chainIds]);

const chainTargetId = chainIds?.[chainIds.length - 1] || null;


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
    if (!focusName || !allNodes.length){ setFilterTargetId(null);return;}
    const q = focusName.toLowerCase();
    const target = allNodes.find(e => (e.name || "").toLowerCase().includes(q));
    if (target) {
      setSelectedId(target.id);
      expandPathTo(target.id);
      setFilterTargetId(target.id); // enable focus-only mode
      const el = nodeRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSelectedId(null);
      setFilterTargetId(null);
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

  // If we are in focus-only (chain) mode and this node is NOT on the path, hide it.
  if (chainSet && !chainSet.has(id)) return null;

  return (
    <Box key={id} sx={{ pl: depth * 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {/* Chevron only expands/collapses; it also focuses the card */}
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(node.id);           // focus this card
              toggleNode(id, hasChildren);      // expand/collapse
              // Optionally center in view:
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

        {/* Card click = focus only */}
        <Box
          ref={(el) => (nodeRefs.current[node.id] = el)}
          onClick={() => setSelectedId(node.id)}
          role="button"
          tabIndex={0}
          aria-selected={selectedId === node.id}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSelectedId(node.id);
          }}
          sx={{ flex: 1, cursor: "pointer" }}
        >
          <EmployeeCard
            emp={node}
            query={query}
            selected={selectedId === node.id}
            canEdit={isAdmin}
            onEdit={() => beginEdit(node)}
            onDelete={() => deleteEmp(node)}
          />
        </Box>
      </Stack>

      {/* Children */}
      {hasChildren && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2 }}>
            {(() => {
              // ---- effective children (in chain mode show only "next" on the chain) ----
              let effectiveChildren = node.children;
              if (chainSet && typeof chainNext !== "undefined" && chainNext.has(id)) {
                effectiveChildren = node.children.filter(
                  (c) => String(c.id) === chainNext.get(id)
                );
              }

              const total = effectiveChildren.length;

              // ---- pagination (hidden in chain mode) ----
              const CHILD_PREVIEW_COUNT = 2;
              const showAll = showAllChildrenIds.has(id);
              const usePager = !chainSet && total > CHILD_PREVIEW_COUNT;

              const visible = usePager && !showAll
                ? effectiveChildren.slice(0, CHILD_PREVIEW_COUNT)
                : effectiveChildren;

              const remaining = Math.max(total - CHILD_PREVIEW_COUNT, 0);

              return (
                <>
                  {visible.map((child) => renderNode(child, depth + 1))}

                  {usePager && (
                    <Box sx={{ mt: 1, ml: 6 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChildrenView(id); // flips showAll for this node
                        }}
                      >
                        {showAll ? "View less" : `View more (${remaining})`}
                      </Button>
                    </Box>
                  )}
                </>
              );
            })()}
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
  <DialogContent dividers>
    {/* Name (free text) */}
    <TextField
      label="Name *"
      fullWidth
      margin="normal"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      error={!!errors.name}
      helperText={errors.name}
    />

    {/* Role (select) */}
    <TextField
      select
      label="Role *"
      fullWidth
      margin="normal"
      value={form.role}
      onChange={(e) => setForm({ ...form, role: e.target.value })}
      error={!!errors.role}
      helperText={errors.role}
    >
      {ROLE_OPTIONS.map((r) => (
        <MenuItem key={r} value={r}>
          {r}
        </MenuItem>
      ))}
    </TextField>

    {/* Department (select) */}
    <TextField
      select
      label="Department *"
      fullWidth
      margin="normal"
      value={form.department}
      onChange={(e) => setForm({ ...form, department: e.target.value })}
      error={!!errors.department}
      helperText={errors.department}
    >
      {DEPT_OPTIONS.map((d) => (
        <MenuItem key={d} value={d}>
          {d}
        </MenuItem>
      ))}
    </TextField>

    {/* Manager ID (select, REQUIRED) */}
    <TextField
      select
      label="Manager ID *"
      fullWidth
      margin="normal"
      value={form.managerId}
      onChange={(e) => setForm({ ...form, managerId: e.target.value })}
      error={!!errors.managerId}
      helperText={errors.managerId || "Choose the direct manager"}
    >
      {managerOptions.map((m) => (
        <MenuItem key={m.id} value={m.id}>
          {m.label}
        </MenuItem>
      ))}
    </TextField>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleCreateSubmit}>Create</Button>
  </DialogActions>
</Dialog>

   


<Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
  <DialogTitle>Edit Employee</DialogTitle>
  <DialogContent>
    <Stack component="form" onSubmit={submitEdit} spacing={1.5} sx={{ mt: 1 }}>
      <TextField
        label="Name"
        value={editForm.name}
        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
        required
        autoFocus
      />
      <TextField
        label="Role"
        value={editForm.role}
        onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
        required
      />
      <TextField
        label="Department"
        value={editForm.department}
        onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))}
        required
      />
      <TextField
        label="Manager ID (optional)"
        placeholder="e.g. 1"
        value={editForm.managerId}
        onChange={(e) => setEditForm(f => ({ ...f, managerId: e.target.value }))}
        helperText="Leave blank for top-level (no manager)"
      />
      <button type="submit" style={{ display: "none" }} />
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
    <Button onClick={submitEdit} variant="contained">Save</Button>
  </DialogActions>
</Dialog>

   
  
    </Box>
  );
}
