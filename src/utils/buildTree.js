// Convert flat employees into a nested "forest" (array of root nodes).
// Each node will have a "children" array.
export function buildForest(list) {
  const byId = new Map(list.map(e => [e.id, { ...e, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    if (node.managerId == null || !byId.has(node.managerId)) {
      // No manager found -> root
      roots.push(node);
    } else {
      byId.get(node.managerId).children.push(node);
    }
  }
  return roots;
}
