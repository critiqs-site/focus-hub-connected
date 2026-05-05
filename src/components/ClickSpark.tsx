import { useEffect } from "react";

const ClickSpark = () => {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const handler = (e: PointerEvent) => {
      // Skip on touch where it would feel noisy
      if (e.pointerType === "touch") return;
      const root = document.createElement("div");
      root.className = "click-spark";
      root.style.left = e.clientX + "px";
      root.style.top = e.clientY + "px";
      const N = 6;
      for (let i = 0; i < N; i++) {
        const p = document.createElement("i");
        const angle = (Math.PI * 2 * i) / N + Math.random() * 0.4;
        const dist = 18 + Math.random() * 10;
        p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        p.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
        root.appendChild(p);
      }
      document.body.appendChild(root);
      setTimeout(() => root.remove(), 500);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);
  return null;
};

export default ClickSpark;