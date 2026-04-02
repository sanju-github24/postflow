import * as React from "react";
import Layout from "@/components/Layout";
import { getPlatformStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Link2Off, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PlatformConfig {
  id: "facebook" | "instagram" | "twitter" | "linkedin";
  name: string;
  logo: string;
  desc: string;
  scope: string;
  note?: string;
  connectVia?: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook",
    logo: "/facebook-logo.png",
    desc: "Post to your Facebook Page",
    scope: "pages_manage_posts, instagram_content_publish",
  },
  {
    id: "instagram",
    name: "Instagram",
    logo: "/instagram-logo.png",
    desc: "Post to your Instagram Business account",
    scope: "instagram_basic, instagram_content_publish",
    note: "Linked automatically when you connect Facebook",
    connectVia: "facebook",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    logo: "/twitter-logo.png",
    desc: "Post tweets to your X account",
    scope: "tweet.write, users.read",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    logo: "/linkedin-logo.png",
    desc: "Post to your LinkedIn profile",
    scope: "w_member_social, openid, profile, email",
  },
];

// ✅ Derives backend root URL from VITE_API_URL env variable
// e.g. https://postflow-backend.onrender.com/api → https://postflow-backend.onrender.com
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000/api")
  .replace(/\/api$/, "");

export default function AccountsPage() {
  const { token, user } = useAuth();
  const [statuses, setStatuses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [disconnecting, setDisconnecting] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getPlatformStatus();
      let list: any[] = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.data) list = res.data.data;
      else if (res.data?.connected_platforms) list = res.data.connected_platforms;
      setStatuses(list);
    } catch (error) {
      console.error("Failed to load platform statuses", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected || error) window.history.replaceState({}, "", "/accounts");

    if (connected) {
      setSuccessMessage(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      load();
      setTimeout(() => load(false), 1500);
    } else {
      load();
    }
  }, []);

  const getStatus = (id: string) => {
    if (!statuses || !Array.isArray(statuses)) return null;
    return statuses.find((s) => String(s.platform).toLowerCase().trim() === id.toLowerCase().trim());
  };

  const isConnectedPlatform = (id: string): boolean => {
    const status = getStatus(id);
    if (!status) return false;
    if (typeof status.connected === "boolean") return status.connected;
    return !!(status.access_token || status.platform_user_id || status.username);
  };

  const handleConnect = (platform: PlatformConfig) => {
    if (!user?.id) { alert("User session not found. Please log in again."); return; }
    const targetPlatform = platform.connectVia || platform.id;
    // ✅ Uses env variable
    window.location.href = `${API_BASE}/api/auth/${targetPlatform}?userId=${user.id}`;
  };

  const handleDisconnect = async (platformId: string) => {
    setDisconnecting(platformId);
    try {
      // ✅ Uses env variable
      await fetch(`${API_BASE}/api/auth/disconnect/${platformId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await load(false);
    } catch {
      alert("Failed to disconnect platform.");
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold">Connected accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your social connections and permissions.</p>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          {PLATFORMS.map((p) => {
            const status = getStatus(p.id);
            const isConnected = isConnectedPlatform(p.id);
            const isDisconnecting = disconnecting === p.id;
            const isDisabled = p.id === "instagram";

            return (
              <div key={p.id} className="bg-white border border-border rounded-xl p-5 transition-all hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    <img src={p.logo} alt={`${p.name} logo`} className="object-contain" style={{ width: 28, height: 28 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {isConnected ? `@${status?.username || status?.platform_user_id || "Connected"}` : p.desc}
                    </p>
                    {p.note && !isConnected && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1 bg-indigo-50 px-2 py-0.5 rounded inline-block">{p.note}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {loading ? (
                      <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse" />
                    ) : isConnected ? (
                      <Button variant="outline" size="sm" onClick={() => handleDisconnect(p.id)}
                        disabled={isDisconnecting || isDisabled}
                        className="gap-1.5 text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200">
                        {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(p)} disabled={isDisabled}
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-200">
                        <ExternalLink className="w-3.5 h-3.5" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    Scopes: <span className="font-normal normal-case tracking-normal ml-1">{p.scope}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mt-8 text-center leading-relaxed">
          Using secure OAuth 2.0. Your tokens are encrypted.
        </p>
      </div>
    </Layout>
  );
}