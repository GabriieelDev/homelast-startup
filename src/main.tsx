import { createRoot } from "react-dom/client";
import { migrateAuthStorage } from "./lib/migrateAuthStorage";
import App from "./App.tsx";
import "./index.css";

// Run BEFORE App mounts so AuthContext's initial getSession() reads a clean store.
migrateAuthStorage();

createRoot(document.getElementById("root")!).render(<App />);
