// src/components/OrgTree.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, ButtonGroup, Collapse,
  IconButton, LinearProgress, Stack, Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmployeeCard from "./EmployeeCard";
import EMPLOYEES from "../data/employees.json";
import { normalizeEmployees, buildForest } from "../utils/buildTree";

export default function OrgTree({ query = "", focusName = "" }) {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set()); // Set<string>
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const nodeRefs = useRef({}); // id -> element




  // 1) Load + normalize
  // 1) Load + normalize (from src, no fetch)
useEffect(() => {
  try {
    setLoading(true);
    setErr("");
    const list = normalizeEmployees(EMPLOYEES); // ← use imported data
    setData(list);
  } catch (e) {
    setErr("Failed to load employees from src/data/employees.json");
  } finally {
    setLoading(false);
  }
}, []);


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
              onClick={() => toggleNode(id, hasChildren)}
              aria-label={isOpen ? "collapse" : "expand"}
            >
              {isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          ) : (
            <Box sx={{ width: 40 }} />
          )}

          {/* card (also toggles if manager) */}
          <Box
            ref={el => (nodeRefs.current[node.id] = el)}
            onClick={() => { setSelectedId(node.id); toggleNode(id, hasChildren); }}
            sx={{ flex: 1, cursor: hasChildren ? "pointer" : "default" }}
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

      </Stack>

      {forest.map(root => renderNode(root))}
    </Box>
  );
}
