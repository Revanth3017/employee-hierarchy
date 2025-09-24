import { useEffect, useMemo, useRef, useState } from "react";


import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';


import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmployeeCard from "./EmployeeCard";
import { buildForest } from "../utils/buildTree";
import { Alert, Box, Button, ButtonGroup, LinearProgress, Stack, Typography } from "@mui/material";

export default function OrgTree({ query, focusName }) {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const nodeRefs = useRef({}); // id -> DOM element

  // 1) load employees with basic error handling
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${process.env.PUBLIC_URL}/employees.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load employees.json (${res.status})`);
        const list = await res.json();
        setData(list);
      } catch (e) {
        setErr(e.message || "Failed to load employees");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) derived structures
  const forest = useMemo(() => (data.length ? buildForest(data) : []), [data]);

  // flatten helpers
  const allNodes = useMemo(() => {
    const out = [];
    const walk = (n) => { out.push(n); n.children?.forEach(walk); };
    forest.forEach(walk);
    return out;
  }, [forest]);

  const expandableIds = useMemo(() => {
    const ids = [];
    const walk = (n) => {
      if (n.children && n.children.length) ids.push(String(n.id));
      n.children?.forEach(walk);
    };
    forest.forEach(walk);
    return ids;
  }, [forest]);

  // 3) live matches for highlight + count
  const matches = useMemo(() => {
    if (!query) return new Set();
    const q = query.toLowerCase();
    return new Set(allNodes.filter(e => e.name.toLowerCase().includes(q)).map(e => e.id));
  }, [allNodes, query]);

  // 4) expand ancestors of id
  function expandPathTo(id) {
    const byId = new Map(allNodes.map(n => [n.id, n]));
    const acc = new Set();
    let cur = byId.get(id);
    while (cur && cur.managerId != null) {
      acc.add(String(cur.managerId));
      cur = byId.get(cur.managerId);
    }
    setExpanded(prev => Array.from(new Set([...prev, ...acc])));
  }

  // 5) on focus submit: pick first match, expand & scroll & select
  useEffect(() => {
    if (!focusName || !allNodes.length) return;
    const q = focusName.toLowerCase();
    const target = allNodes.find(e => e.name.toLowerCase().includes(q));
    if (target) {
      setSelectedId(target.id);
      expandPathTo(target.id);
      const el = nodeRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSelectedId(null);
    }
  }, [focusName, allNodes]);

  // 6) expand/collapse all
  function expandAll() {
    setExpanded(expandableIds);
  }
  function collapseAll() {
    setExpanded([]);
  }

  function renderNode(node) {
    return (
      <TreeItem
        key={node.id}
        nodeId={String(node.id)}
        label={
          <div ref={el => (nodeRefs.current[node.id] = el)}>
            <EmployeeCard emp={node} query={query} selected={selectedId === node.id} />
          </div>
        }
      >
        {node.children?.map(child => renderNode(child))}
      </TreeItem>
    );
  }

  // 7) UI
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

  if (err) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        {err}
      </Alert>
    );
  }

  if (!forest.length) {
  return (
    <Alert severity="info" sx={{ my: 1 }}>
      No employees found. Make sure <strong>client/public/employees.json</strong> exists and is valid.
    </Alert>
  );
}


  return (
    <Box sx={{ p: 1 }}>
      {/* controls row */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1, justifyContent: "flex-end", flexWrap: "wrap", rowGap: 1 }}
      >
        <Typography variant="body2" sx={{ mr: "auto" }}>
          {query ? (matches.size ? `${matches.size} match${matches.size > 1 ? "es" : ""}` : "No matches") : " "}
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button onClick={expandAll}>Expand all</Button>
          <Button onClick={collapseAll}>Collapse all</Button>
        </ButtonGroup>
      </Stack>

      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        onNodeToggle={(_, ids) => setExpanded(ids)}
        sx={{
          width: "100%",
          ".MuiTreeItem-label": { pr: 1, py: 0.5 },
        }}
      >
        {forest.map(root => renderNode(root))}
      </TreeView>
    </Box>
  );
}
