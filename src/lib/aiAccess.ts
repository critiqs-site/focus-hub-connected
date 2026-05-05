import { toast } from "sonner";

/** Master kill-switch for all AI Tools (Physique/Outfit/Food). */
export const AI_TOOLS_UNDER_CONSTRUCTION = true;

export const GUEST_AI_MESSAGE = "This feature is only available for registered users.";

export function blockGuestAi(): boolean {
  toast.error(GUEST_AI_MESSAGE);
  return true;
}

export function blockUnderConstruction(): boolean {
  toast.warning("This feature is under construction.");
  return true;
}