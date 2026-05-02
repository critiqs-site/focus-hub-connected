import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck } from "lucide-react";
import { getUserPinHash, setUserPin, verifyUserPin } from "@/hooks/useNotebook";
import { toast } from "sonner";

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "verify" | "setup";
  onSuccess: () => void;
}

export const PinDialog = ({ open, onOpenChange, userId, mode, onSuccess }: PinDialogProps) => {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(mode === "setup");

  useEffect(() => {
    if (!open) { setPin(""); setConfirm(""); return; }
    if (mode === "verify") {
      getUserPinHash(userId).then(hash => setNeedsSetup(!hash));
    } else {
      setNeedsSetup(true);
    }
  }, [open, mode, userId]);

  const handleSubmit = async () => {
    if (!/^\d{4}$/.test(pin)) { toast.error("PIN must be 4 digits"); return; }
    setLoading(true);
    try {
      if (needsSetup) {
        if (pin !== confirm) { toast.error("PINs don't match"); setLoading(false); return; }
        await setUserPin(userId, pin);
        toast.success("PIN set");
        onSuccess();
        onOpenChange(false);
      } else {
        const ok = await verifyUserPin(userId, pin);
        if (!ok) { toast.error("Wrong PIN"); setLoading(false); return; }
        onSuccess();
        onOpenChange(false);
      }
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {needsSetup ? <ShieldCheck className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-primary" />}
            {needsSetup ? "Set master PIN" : "Enter PIN"}
          </DialogTitle>
          <DialogDescription>
            {needsSetup
              ? "Choose a 4-digit PIN. It unlocks any locked note or doc. We can't recover it if you forget."
              : "Enter your 4-digit PIN to continue."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
          />
          {needsSetup && (
            <Input
              inputMode="numeric"
              maxLength={4}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
              placeholder="confirm"
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          )}
          <Button className="w-full" disabled={loading || pin.length !== 4 || (needsSetup && confirm.length !== 4)} onClick={handleSubmit}>
            {needsSetup ? "Set PIN" : "Unlock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDialog;