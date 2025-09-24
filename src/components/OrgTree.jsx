import { useEffect, useMemo, useRef, useState } from "react";
import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmployeeCard from "./EmployeeCard";
import { buildForest } from "../utils/buildTree";

/**
 * OrgTree:
 * - loads /employees.json
 * - builds a forest (one or more roots)
 * - renders recursive TreeItems with EmployeeCard as the label
 * - when focusName changes, expands ancestor path and scrolls to that item
 */
export default function OrgTree({ focusName }) {
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

  // 2) derived structures
  const forest = useMemo(() => (data.length ? buildForest(data) : []), [data]);
  const idToEmp = useMemo(() => new Map(data.map(e => [e.id, e])), [data]);

  // 3) expand all ancestors of a target id
  function expandPathTo(id) {
    const acc = new Set();
    let cur = idToEmp.get(id);
    while (cur && cur.managerId != null) {
      acc.add(String(cur.managerId));
      cur = idToEmp.get(cur.managerId);
    }
    setExpanded(prev => Array.from(new Set([...prev, ...acc])));
  }

  // 4) respond to focusName: find first name that matches (contains), expand & scroll to it
  useEffect(() => {
    if (!focusName || !data.length) return;
    const target = data.find(
      e => e.name.toLowerCase().includes(focusName.toLowerCase())
    );
    if (target) {
      expandPathTo(target.id);
      const el = nodeRefs.current[target.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusName, data]); // runs when search changes or data loaded

  // 5) recursive renderer
  function renderNode(node) {
    return (
      <TreeItem
        key={node.id}
        nodeId={String(node.id)}
        label={
          <div ref={el => (nodeRefs.current[node.id] = el)}>
            <EmployeeCard emp={node} />
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
          ".MuiTreeItem-label": { pr: 1, py: 0.5 }, // comfy touch targets
        }}
      >
        {forest.map(root => renderNode(root))}
      </TreeView>
    </div>
  );
}
