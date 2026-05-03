// Tiny event bus to hand transcribed text from the floating mic into the AI chat input.
type Listener = (text: string) => void;
const listeners = new Set<Listener>();

export const voiceBus = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  emit(text: string) {
    listeners.forEach(fn => fn(text));
  },
};
