# Python & Virtual Environment

venv – Creates a virtual environment for Python projects (isolates dependencies).

requirements.txt – Lists all Python dependencies to install with:

pip install -r requirements.txt

#📁 Git & Project Setup Files

.gitignore – Specifies files/folders Git should ignore (e.g., node_modules, .env).

setup.sh – Shell script for setting up or configuring a project (often runs installs or environment setup).

 #📦 Node.js & React Project Files

package.json – Lists project details, scripts, and all JavaScript dependencies.

package-lock.json – Auto-generated when you run npm install.

Locks exact versions of installed dependencies for consistent builds.

#⚙️ Commands

npm install – Installs all project dependencies listed in package.json.

npm start – Starts a plain React app (usually on port 3000).

npm run dev – Starts a Next.js development server.

#⚛️ React Basics

React – Frontend library for building UI components.

Component-Based Architecture – UI is split into reusable components.

Client-Side Rendering (CSR) – Browser loads a minimal HTML shell and React renders content dynamically.

React Routing

Uses react-router and you must define routes manually.

⚡ Next.js (React Framework by Vercel)

Built on top of React – adds extra features like:

✅ File-based Routing – Routes are created automatically from the pages/ directory.

⚡ Server-Side Rendering (SSR) – HTML is generated on the server for faster first load.

📄 Static Site Generation (SSG) – Pre-renders pages at build time for performance.

🔄 State & Lifecycle with Hooks
State Management
const [instances, setInstances] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);


useState – Creates a state variable and a setter function.

Initial State – useState([]) initializes with an empty array, useState(true) with a boolean.

State Updates – setInstances(data) updates state and triggers a re-render.

useEffect
useEffect(() => {
  loadInstances();
}, []);


Empty dependency array [] → Runs only once on component mount (similar to componentDidMount in class components).

#🧱 Component Structure

Functional Components (Modern Approach) – Use hooks and simple syntax:

export default function Home() {
  return <div>JSX</div>;
}


Class Components (Older Approach) – Use render() method:

class MyComponent extends React.Component {
  render() {
    return <div>JSX</div>;
  }
}


Naming Convention: Components use PascalCase.

#📤 Props vs State

State – Internal, mutable data managed by a component.

Props – Data passed from parent, immutable and read-only.

#🧪 Event Handling

e.preventDefault() – Prevents default browser behavior (like form submission reload).

#📁 .next Folder (Next.js Build Output)

Created automatically by Next.js during build or development.

Stores compiled, optimized, and server-ready files.

Generated when:

npm run build → Production build.

npm run dev → Temporary build for development.



