import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface EffectsContextType {
  effectsEnabled: boolean;
  toggleEffects: () => void;
}

const EffectsContext = createContext<EffectsContextType>({
  effectsEnabled: true,
  toggleEffects: () => {},
});

export const useEffects = () => useContext(EffectsContext);

export const EffectsProvider = ({ children }: { children: ReactNode }) => {
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const stored = localStorage.getItem("effectsEnabled");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("effectsEnabled", String(effectsEnabled));
    if (!effectsEnabled) {
      document.documentElement.classList.add("no-effects");
    } else {
      document.documentElement.classList.remove("no-effects");
    }
  }, [effectsEnabled]);

  const toggleEffects = () => setEffectsEnabled((prev) => !prev);

  return (
    <EffectsContext.Provider value={{ effectsEnabled, toggleEffects }}>
      {children}
    </EffectsContext.Provider>
  );
};
