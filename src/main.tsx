import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { telemetry } from "./lib/telemetry";

telemetry.install();

createRoot(document.getElementById("root")!).render(<App />);
