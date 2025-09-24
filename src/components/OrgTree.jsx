import { useEffect, useMemo, useRef, useState } from "react";
import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmployeeCard from "./EmployeeCard";
import { buildForest } from "../utils/buildTree";

export default function OrgTree({ query, focusName }) {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const nodeRefs = useRef({}); // id -> DOM element

  // 1) load employees
  useEffect(() => {
    (async () => {
      const res = await fetch("/employees.json");
      const list = await res.json();
      setData(list);
    })();
  }, []);

  // 2) maps/forest
  const idToEmp = useMemo(() => new Map(data.map(e => [e.id, e])), [data]);
  const forest = useMemo(() => (data.length ? buildForest(data) : []), [data]);

  // 3) matches set for highlight + count (live as you type)
  const matches = useMemo(() => {
    if (!query) return new Set();
    const q = query.toLowerCase();
    return new Set(data.filter(e => e.name.toLowerCase().includes(q)).map(e => e.id));
  }, [data, query]);

  // 4) expand ancestors of id
  function expandPathTo(id) {
    const acc = new Set();
    let cur = idToEmp.get(id);
    while (cur && cur.managerId != null) {
      acc.add(String(cur.managerId));
      cur = idToEmp.get(cur.managerId);
    }
    setExpanded(prev => Array.from(new Set([...prev, ...acc])));
  }

  // 5) on focusName submit: find first exact/partial match, expand + scroll
  useEffect(() => {
    if (!focusName || !data.length) return;
    const q = focusName.toLowerCase();
    const target = data.find(e => e.name.toLowerCase().includes(q));
    if (target) {
      expandPathTo(target.id);
      const el = nodeRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusName, data]); // only when you submit

  function renderNode(node) {
    return (
      <TreeItem
        key={node.id}
        nodeId={String(node.id)}
        label={
          <div ref={el => (nodeRefs.current[node.id] = el)}>
            <EmployeeCard emp={node} query={query} />
          </div>
        }
      >
        {node.children?.map(child => renderNode(child))}
      </TreeItem>
    );
  }

  if (!data.length) return <p style={{ padding: 16 }}>Loading organization…</p>;

  return (
    <div style={{ padding: 8 }}>
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

      {/* tiny results info */}
      {query ? (
        <p style={{ padding: 8, margin: 0, color: "rgba(0,0,0,0.6)" }}>
          {matches.size ? `${matches.size} match${matches.size > 1 ? "es" : ""}` : "No matches"}
        </p>
      ) : null}
    </div>
  );
}
