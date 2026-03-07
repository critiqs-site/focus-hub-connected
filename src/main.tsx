import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { EffectsProvider } from "./contexts/EffectsContext";

createRoot(document.getElementById("root")!).render(
  <EffectsProvider>
    <App />
  </EffectsProvider>
);
