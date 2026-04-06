import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Trash2, Plus, Users, ListTodo, Calendar, BookOpen, Megaphone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  users: { id: string; email: string; created_at: string; last_sign_in_at: string | null }[];
  totalRegistered: number;
  totalProfiles: number;
  totalTodos: number;
  totalEvents: number;
  totalJournals: number;
}

interface Announcement {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
}

const Owner = () => {
  const [phase, setPhase] = useState<"404" | "auth" | "dashboard">("404");
  const [leftAt, setLeftAt] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [petName, setPetName] = useState("");
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [loading, setLoading] = useState(false);

  // Check sessionStorage for existing auth
  useEffect(() => {
    const saved = sessionStorage.getItem("ownerAuth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.password && parsed.petName) {
          setPassword(parsed.password);
          setPetName(parsed.petName);
          setPhase("dashboard");
        }
      } catch {}
    }
  }, []);

  // Visibility change detection
  useEffect(() => {
    if (phase !== "404") return;
    const handleVisibility = () => {
      if (document.hidden) {
        setLeftAt(Date.now());
      } else if (leftAt && Date.now() - leftAt >= 5000) {
        setPhase("auth");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase, leftAt]);

  const authenticate = async () => {
    setAuthError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stats", {
        body: { password, petName },
      });
      if (error || data?.error) {
        setAuthError("Invalid credentials");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("ownerAuth", JSON.stringify({ password, petName }));
      setStats(data);
      setPhase("dashboard");
      fetchAnnouncements();
    } catch {
      setAuthError("Connection error");
    }
    setLoading(false);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-stats", {
        body: { password, petName },
      });
      if (data && !data.error) setStats(data);
    } catch {}
    setLoading(false);
  }, [password, petName]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("admin-announce", {
        body: { password, petName, action: "list" },
      });
      if (Array.isArray(data)) setAnnouncements(data);
    } catch {}
  }, [password, petName]);

  const createAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    await supabase.functions.invoke("admin-announce", {
      body: { password, petName, action: "create", message: newAnnouncement.trim() },
    });
    setNewAnnouncement("");
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.functions.invoke("admin-announce", {
      body: { password, petName, action: "delete", id },
    });
    fetchAnnouncements();
  };

  const toggleAnnouncement = async (id: string) => {
    await supabase.functions.invoke("admin-announce", {
      body: { password, petName, action: "toggle", id },
    });
    fetchAnnouncements();
  };

  useEffect(() => {
    if (phase === "dashboard") {
      fetchStats();
      fetchAnnouncements();
    }
  }, [phase]);

  // 404 disguise
  if (phase === "404") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/90">Return to Home</a>
        </div>
      </div>
    );
  }

  // Auth form
  if (phase === "auth") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm p-8 rounded-2xl space-y-4" style={{
          background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
          border: '1px solid hsla(0, 0%, 100%, 0.12)',
        }}>
          <h2 className="text-xl font-bold text-foreground text-center">🔒 Access Required</h2>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-secondary/30"
          />
          <Input
            type="text"
            placeholder="Pet name"
            value={petName}
            onChange={e => setPetName(e.target.value)}
            className="bg-secondary/30"
            onKeyDown={e => e.key === "Enter" && authenticate()}
          />
          {authError && <p className="text-sm text-destructive text-center">{authError}</p>}
          <Button onClick={authenticate} disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Enter"}
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard
  const glassStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
    border: '1px solid hsla(0, 0%, 100%, 0.12)',
    backdropFilter: 'blur(20px)',
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">👑 Owner Dashboard</h1>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Users, label: "Registered Users", value: stats.totalRegistered, color: "text-blue-400" },
              { icon: Users, label: "Profiles", value: stats.totalProfiles, color: "text-green-400" },
              { icon: ListTodo, label: "Total Todos", value: stats.totalTodos, color: "text-primary" },
              { icon: Calendar, label: "Total Events", value: stats.totalEvents, color: "text-yellow-400" },
              { icon: BookOpen, label: "Journal Entries", value: stats.totalJournals, color: "text-pink-400" },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-2xl text-center" style={glassStyle}>
                <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
                <div className="text-3xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Announcements */}
        <div className="p-6 rounded-2xl" style={glassStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              value={newAnnouncement}
              onChange={e => setNewAnnouncement(e.target.value)}
              placeholder="New announcement..."
              className="bg-secondary/30"
              onKeyDown={e => e.key === "Enter" && createAnnouncement()}
            />
            <Button onClick={createAnnouncement} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}>
                <span className={`flex-1 text-sm ${a.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{a.message}</span>
                <button onClick={() => toggleAnnouncement(a.id)} className="text-muted-foreground hover:text-foreground">
                  {a.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => deleteAnnouncement(a.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-muted-foreground italic">No announcements yet</p>}
          </div>
        </div>

        {/* Users Table */}
        {stats && (
          <div className="p-6 rounded-2xl" style={glassStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Registered Users ({stats.users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-muted-foreground/10">
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Joined</th>
                    <th className="pb-2">Last Sign In</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map(u => (
                    <tr key={u.id} className="border-b border-muted-foreground/5">
                      <td className="py-2 pr-4 text-foreground">{u.email}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Owner;
