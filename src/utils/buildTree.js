// src/utils/buildTree.js

// Normalize any employee record to a common shape that our UI expects.
// Works even if your JSON uses different key names (manager_id, designation, dept, etc.).
export function normalizeEmployees(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map(({ id, managerId = null, name = "", role = "", department = "" }) => ({
      id,
      managerId,
      name,
      role,
      department,
    }))
    .filter(e => e.id != null);
}


// Convert the flat list into a nested "forest" (array of root nodes).
export function buildForest(list) {
  const byId = new Map(list.map((e) => [e.id, { ...e, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    const mid = node.managerId;
    if (mid == null || !byId.has(mid)) {
      // CEO / no manager -> root
      roots.push(node);
    } else {
      byId.get(mid).children.push(node);
    }
  }
  return roots;
}
