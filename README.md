# Employee Hierarchy



## 1) How to run the project

### Prerequisites
- **Node.js 18+** (18 LTS recommended for Create React App).
- This project was bootstrapped with **Create React App** (react-scripts).

> If your dev server behaves oddly with React 19, pin to React 18:
> ```bash
> npm i -E react@18.3.1 react-dom@18.3.1
> ```

### Install & start (development)
```bash
npm install
npm start

## 2)Features implemented 

2) Features implemented

Dynamic data load (simulated API)
Employees and users are fetched at runtime from public/employees.json and public/users.json.

Employee hierarchy (CEO → Managers → Employees)
A flat list with managerId is converted into a nested tree. Multiple roots are supported.

Employee cards
Each employee is displayed as a card showing Name, Role, and Department (compact & responsive).

Expand / Collapse subordinates
Clicking a manager’s card (or the chevron icon) expands/collapses their direct reports.
Includes Expand All / Collapse All controls.

Search & focus

Live highlight of matching text while typing.

Press Enter to expand the path to the first match and scroll into view.

Clear (“x”) button and tiny results count.

Light / Dark theme
Global theme toggle, persisted in localStorage.

Login (mock)
Credentials are validated against public/users.json; successful logins persist to localStorage.

Responsive UI
Mobile-first layout: the header wraps neatly, search takes a full row on small screens, cards remain touch-friendly.

Loading & error states
Linear progress indicator while fetching; clear error & empty-state messaging.


3) Where each skill is demonstrated (file references)
React fundamentals (components, props, state, events)

Presentational components:
src/components/EmployeeCard.jsx – Renders Name / Role / Department (wrapped in React.memo).

Controlled inputs & forms:
src/components/SearchBar.jsx – Controlled input + clear + submit on Enter.
src/components/LoginForm.jsx – Controlled form with error UI.

Hooks (useState, useEffect, useMemo, useRef)

Data fetching & derived state:
src/components/OrgTree.jsx

useEffect: fetch employees; loading & error handling.

useMemo: build the tree (forest), flatten nodes, compute match sets.

useRef: DOM refs used for scrollIntoView.

useState: expanded nodes, selected node, query/focus values.

Auth & persistence:
src/hooks/useAuth.js – manages user session; reads/writes localStorage.

Data transformation / algorithm

Tolerant schema normalization:
normalizeEmployees(list) in src/utils/buildTree.js maps various possible key names
(e.g., manager_id, designation, dept) to { id, managerId, name, role, department }.

Flat → Tree conversion:
buildForest(list) in src/utils/buildTree.js links each node to its manager via managerId and returns an array of root nodes.

UI/UX & responsiveness

Plain React hierarchical UI (no TreeItem dependency):
src/components/OrgTree.jsx uses MUI layout primitives (Box, Stack, Collapse) and chevrons to render a nested, collapsible tree of cards.

Responsive header & search:
src/App.js – toolbar items wrap; search input becomes full width on small screens.

Accessible affordances:
Chevron buttons have aria-label; search is submit-on-Enter.

Search & focus behavior

Live highlight:
highlight() helper inside src/components/EmployeeCard.jsx.

Expand path + scroll to result:
expandPathTo() + scrollIntoView() inside src/components/OrgTree.jsx.

Theming

Global light/dark mode:
src/context/ThemeContext.jsx – builds the MUI theme (palette.mode) and persists the chosen mode to localStorage. Toggle button in src/App.js.

Error handling & states

Loading / error / empty states:
src/components/OrgTree.jsx – LinearProgress for loading, Alert for errors and “no data” messaging.