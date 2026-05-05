import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Compass, Check } from "lucide-react";
import {
  TIMEZONE_LIST, getStoredTimezone, setStoredTimezone,
  getOffsetLabel, formatTimeInTz, timeOfDayBand,
} from "@/lib/timezone";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const TimezoneDialog = ({ open, onOpenChange }: Props) => {
  const [now, setNow] = useState(new Date());
  const [current, setCurrent] = useState(getStoredTimezone());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setCurrent(getStoredTimezone());
    setQuery("");
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TIMEZONE_LIST;
    return TIMEZONE_LIST.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.tz.toLowerCase().includes(q)
    );
  }, [query]);

  const apply = (tz: string) => {
    setStoredTimezone(tz);
    setCurrent(tz);
    const band = timeOfDayBand(tz, new Date());
    toast.success(`Timezone set — ${band.label} ${band.emoji}`);
  };

  const autoDetect = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    apply(tz);
  };

  const currentBand = timeOfDayBand(current, now);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Change Timezone
          </DialogTitle>
        </DialogHeader>

        <div
          className="rounded-2xl p-4 border"
          style={{
            borderColor: `hsl(${currentBand.hsl} / 0.4)`,
            background: `hsl(${currentBand.hsl} / 0.08)`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Current timezone</div>
              <div className="text-sm font-semibold text-foreground">{current}</div>
              <div className="text-xs text-muted-foreground">
                {getOffsetLabel(current, now)} · {currentBand.emoji} {currentBand.label}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{formatTimeInTz(current, now)}</div>
            </div>
          </div>
          <Button onClick={autoDetect} className="w-full mt-3 gap-2">
            <Compass className="h-4 w-4" /> AUTO DETECT
          </Button>
        </div>

        <Input
          placeholder="Search timezone, country, city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1"
        />

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
          {filtered.map(t => {
            const band = timeOfDayBand(t.tz, now);
            const selected = t.tz === current;
            return (
              <button
                key={t.tz}
                onClick={() => apply(t.tz)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors border ${
                  selected ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-secondary/60"
                }`}
                style={{ borderLeft: `4px solid hsl(${band.hsl} / 0.6)` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {t.label} <span className="text-xs text-muted-foreground">· {t.country}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{t.tz} · {getOffsetLabel(t.tz, now)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{formatTimeInTz(t.tz, now)}</div>
                  <div className="text-[10px] text-muted-foreground">{band.emoji} {band.label}</div>
                </div>
                {selected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No matches</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimezoneDialog;