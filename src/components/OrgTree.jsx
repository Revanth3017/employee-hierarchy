// src/components/OrgTree.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, ButtonGroup, Collapse, IconButton,
  LinearProgress, Stack, Typography, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmployeeCard from "./EmployeeCard";
import { useEmployees } from "../context/EmployeesContext";
import { buildForest } from "../utils/buildTree";

export default function OrgTree({ query = "", focusName = "", isAdmin = false }) {
  // ===== Employees from Context (single source of truth) =====
  const { employees, addEmployee, updateEmployee, deleteEmployee, ready } = useEmployees();

  // ===== UI state =====
  const [expanded, setExpanded] = useState(() => new Set()); // Set<string>
  const [selectedId, setSelectedId] = useState(null);
  const [err] = useState(""); // kept for structure; not used when context drives data
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", role: "", managerId: "" });
  const [errors, setErrors] = useState({});
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", department: "", managerId: "" });
  const [filterTargetId, setFilterTargetId] = useState(null); // chain-only mode target
  const didDefaultExpand = useRef(false);
  const nodeRefs = useRef({}); // id -> element

  // ===== Manager select options (built from context employees) =====
  const managerOptions = useMemo(
    () => employees.map(e => ({ id: String(e.id), label: `${e.id} — ${e.name}` })),
    [employees]
  );

  // ===== View-more/less (incremental) =====
  const CHILD_PREVIEW = 2;
  const CHILD_STEP = 2;
  const [childrenVisible, setChildrenVisible] = useState({});
  const getVisible = (pid, total) => Math.min(childrenVisible[pid] ?? CHILD_PREVIEW, total);
  const showMore = (pid, total) =>
    setChildrenVisible(v => {
      const cur = v[pid] ?? CHILD_PREVIEW;
      const next = Math.min(total, cur + CHILD_STEP);
      return cur === next ? v : { ...v, [pid]: next };
    });
  const showLess = (pid) =>
    setChildrenVisible(v => {
      if ((v[pid] ?? CHILD_PREVIEW) === CHILD_PREVIEW) return v;
      const n = { ...v, [pid]: CHILD_PREVIEW };
      return n;
    });
  const resetChildCounters = () => setChildrenVisible({});

  // ===== Department & Role options (dependent selects) =====
  const DEPT_OPTIONS = [
    "Technology", "Finance", "Operations", "Executive",
    "HR", "Sales", "Marketing", "Support", "Legal", "Product", "Design",
  ];
  const ROLES_BY_DEPT = {
    Technology: [
      "Frontend Engineer", "Backend Engineer", "Full-Stack Engineer",
      "DevOps Engineer", "Data Engineer", "Mobile Engineer",
      "QA Engineer", "QA Manager", "Engineering Manager",
    ],
    Finance: ["Finance Manager", "Accountant", "Financial Analyst", "Payroll Specialist"],
    Operations: ["Operations Manager", "Operations Associate", "Logistics Coordinator"],
    Executive: ["CEO", "CTO", "CFO", "COO"],
    HR: ["HR Manager", "Recruiter", "People Ops"],
    Sales: ["Sales Manager", "Account Executive", "SDR"],
    Marketing: ["Marketing Manager", "Content Strategist", "SEO Specialist"],
    Support: ["Support Manager", "Support Specialist"],
    Legal: ["Legal Counsel", "Compliance Specialist"],
    Product: ["Product Manager", "Product Owner"],
    Design: ["UX Designer", "UI Designer", "Design Manager"],
  };
  const roleOptions = useMemo(() => {
    const list = ROLES_BY_DEPT[form.department] || [];
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [form.department]);

  // ===== Forest & helpers (built from context employees) =====
  const forest = useMemo(() => buildForest(employees), [employees]);

  const allNodes = useMemo(() => {
    const out = [];
    const walk = (n) => { out.push(n); n.children?.forEach(walk); };
    forest.forEach(walk);
    return out;
  }, [forest]);

  const byId = useMemo(() => new Map(allNodes.map(n => [String(n.id), n])), [allNodes]);

  // Default expand roots once (so page doesn’t look empty)
  useEffect(() => {
    if (didDefaultExpand.current) return;
    if (!forest.length || filterTargetId) return;
    const next = new Set(expanded);
    forest.forEach(root => next.add(String(root.id)));
    setExpanded(next);
    didDefaultExpand.current = true;
  }, [forest, filterTargetId, expanded]);

  // Chain-only / focus mode
  const chainIds = useMemo(() => {
    if (filterTargetId == null || !byId.size) return null;
    const ids = [];
    let cur = byId.get(String(filterTargetId));
    while (cur) {
      ids.push(String(cur.id));
      if (cur.managerId == null) break;
      cur = byId.get(String(cur.managerId));
    }
    return ids.reverse();
  }, [filterTargetId, byId]);

  const chainSet = useMemo(() => (chainIds ? new Set(chainIds) : null), [chainIds]);
  const chainNext = useMemo(() => {
    if (!chainIds) return null;
    const m = new Map();
    for (let i = 0; i < chainIds.length - 1; i++) m.set(chainIds[i], chainIds[i + 1]);
    return m;
  }, [chainIds]);

  const expandableIds = useMemo(
    () => allNodes.filter(n => n.children?.length).map(n => String(n.id)),
    [allNodes]
  );

  // bulk buttons highlight (NO hooks)
  const isAllExpanded = expandableIds.length > 0 && expandableIds.every(id => expanded.has(id));
  const isAllCollapsed = expanded.size === 0;

  // live matches count for header
  const matches = useMemo(() => {
    if (!query) return new Set();
    const q = query.toLowerCase();
    return new Set(allNodes.filter(e => (e.name || "").toLowerCase().includes(q)).map(e => e.id));
  }, [allNodes, query]);

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

  // Search/focus: expand path + scroll while typing (focusName is driven by App)
  useEffect(() => {
    if (!focusName || !allNodes.length) { setFilterTargetId(null); return; }
    const q = focusName.toLowerCase();
    const target = allNodes.find(e => (e.name || "").toLowerCase().includes(q));
    if (target) {
      setSelectedId(target.id);
      expandPathTo(target.id);
      setFilterTargetId(target.id);
      nodeRefs.current[target.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSelectedId(null);
      setFilterTargetId(null);
    }
  }, [focusName, allNodes]); // live

  function toggleNode(id, hasChildren) {
    if (!hasChildren) return;
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ====== Edit / Delete ======
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
      editForm.managerId === ""
        ? null
        : (isNaN(Number(editForm.managerId)) ? editForm.managerId : Number(editForm.managerId));

    updateEmployee(editTarget.id, {
      name: editForm.name.trim(),
      role: editForm.role.trim(),
      department: editForm.department.trim(),
      managerId,
    });

    setSelectedId(editTarget.id);
    expandPathTo(editTarget.id);
    setOpenEdit(false);
    setEditTarget(null);
  }

  // Delete whole subtree (employee + descendants)
  function getDescendantIds(list, rootId) {
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

  function deleteEmpBranch(emp) {
    const ok = window.confirm(
      `Delete "${emp.name}" and everyone who reports to them? This cannot be undone.`
    );
    if (!ok) return;

    const idsToRemove = Array.from(getDescendantIds(employees, emp.id));
    // delete children first (post-order-ish), then the parent
    idsToRemove.sort((a, b) => (a === emp.id ? 1 : b === emp.id ? -1 : 0));
    idsToRemove.forEach(id => deleteEmployee(id));

    setExpanded(prev => {
      const next = new Set(prev);
      idsToRemove.forEach(id => next.delete(String(id)));
      return next;
    });
    setSelectedId(prev => (prev && idsToRemove.includes(prev) ? null : prev));
  }

  // ====== Create ======
  const openCreatemodal = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);

  function nextId() {
    const nums = employees.map(d => Number(d.id)).filter(n => !Number.isNaN(n));
    return (nums.length ? Math.max(...nums) : 0) + 1;
  }

  function handleCreate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.department) nextErrors.department = "Department is required";
    if (!form.role) nextErrors.role = "Role is required";
    if (!form.managerId) nextErrors.managerId = "Manager is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const newEmp = {
      id: nextId(),
      name: form.name.trim(),
      role: form.role,
      department: form.department,
      managerId: Number(form.managerId),
    };
    addEmployee(newEmp);

    setCreateOpen(false);
    setForm({ name: "", department: "", role: "", managerId: "" });
    setErrors({});
    // focus the new employee and expand its chain
    setSelectedId(newEmp.id);
    if (newEmp.managerId != null) expandPathTo(newEmp.id);
  }

  // ===== Bulk expand/collapse =====
  function expandAll() {
    const next = new Set(expandableIds);
    setExpanded(next);
  }
  function collapseAll() {
    setExpanded(new Set());
    resetChildCounters();
  }

  // ===== Render node =====
  function renderNode(node, depth = 0) {
    const id = String(node.id);
    const hasChildren = !!(node.children && node.children.length);
    const isOpen = expanded.has(id);

    // focus-only chain mode: hide nodes not on the path
    if (chainSet && !chainSet.has(id)) return null;

    return (
      <Box key={id} sx={{ pl: depth * 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Chevron expands/collapses + focuses */}
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(node.id);
                toggleNode(id, hasChildren);
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
              onDelete={() => deleteEmpBranch(node)}
            />
          </Box>
        </Stack>

        {/* Children */}
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2 }}>
              {(() => {
                // in chain mode, show only the next node on the chain
                let effectiveChildren = node.children;
                if (chainSet && chainNext?.has(id)) {
                  effectiveChildren = node.children.filter(
                    (c) => String(c.id) === chainNext.get(id)
                  );
                }
                const total = effectiveChildren.length;
                const visibleCount = getVisible(id, total);
                const visibleKids = effectiveChildren.slice(0, visibleCount);
                const remaining = total - visibleCount;

                return (
                  <>
                    {visibleKids.map(child => renderNode(child, depth + 1))}

                    {/* incremental pager hidden in chain mode */}
                    {!chainSet && total > CHILD_PREVIEW && (
                      <Box sx={{ mt: 1, ml: 6, display: "flex", gap: 1 }}>
                        {remaining > 0 && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => { e.stopPropagation(); showMore(id, total); }}
                          >
                            {`View more (${Math.min(CHILD_STEP, remaining || CHILD_STEP)})`}
                          </Button>
                        )}
                        {visibleCount > CHILD_PREVIEW && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => { e.stopPropagation(); showLess(id); }}
                          >
                            View less
                          </Button>
                        )}
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

  // ===== Loading / errors =====
  if (!ready) {
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
        No employees to display. Add users to see the org chart.
      </Alert>
    );
  }

  // ===== Tree + controls =====
  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, justifyContent: "flex-end", flexWrap: "wrap", rowGap: 1 }}>
        <Typography variant="body2" sx={{ mr: "auto" }}>
          {query ? (matches.size ? `${matches.size} match${matches.size > 1 ? "es" : ""}` : "No matches") : " "}
        </Typography>

        <ButtonGroup size="small" variant="outlined">
          <Button onClick={expandAll} variant={isAllExpanded ? "contained" : "outlined"}>
            Expand all
          </Button>
          <Button onClick={collapseAll} variant={isAllCollapsed ? "contained" : "outlined"}>
            Collapse all
          </Button>
        </ButtonGroup>

        {isAdmin && (
          <Button size="small" variant="contained" onClick={openCreatemodal} sx={{ ml: 1 }}>
            Create Employee
          </Button>
        )}
      </Stack>

      {forest.map(root => renderNode(root))}

      {/* Create User dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Employee</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Name *"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
          />

          <TextField
            select
            label="Department *"
            fullWidth
            margin="normal"
            value={form.department}
            onChange={(e) => {
              const value = e.target.value;
              setForm((f) => ({ ...f, department: value, role: "" }));
            }}
            error={!!errors.department}
            helperText={errors.department}
          >
            {DEPT_OPTIONS.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Role *"
            fullWidth
            margin="normal"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            error={!!errors.role}
            helperText={form.department ? errors.role : "Select department first"}
            disabled={!form.department}
          >
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>

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
              <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
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
