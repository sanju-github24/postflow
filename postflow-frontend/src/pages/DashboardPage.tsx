import * as React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { getPlatformStatus, getPosts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PlusSquare, Clock, CheckCircle2, XCircle, Zap, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_LOGOS: Record<string, string> = {
  facebook:  "/facebook-logo.png",
  instagram: "/instagram-logo.png",
  twitter:   "/twitter-logo.png",
  linkedin:  "/linkedIn-logo.png",
};

const ALL_PLATFORMS = ["facebook", "instagram", "twitter", "linkedin"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [platforms, setPlatforms] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [pRes, postsRes] = await Promise.all([getPlatformStatus(), getPosts()]);

        let rawList: any[] = [];
        if (Array.isArray(pRes.data)) {
          rawList = pRes.data;
        } else if (pRes.data?.data) {
          rawList = pRes.data.data;
        } else if (pRes.data?.connected_platforms) {
          rawList = pRes.data.connected_platforms;
        }

        const merged = ALL_PLATFORMS.map((name) => {
          const found = rawList.find(
            (s) => String(s.platform).toLowerCase().trim() === name
          );
          return {
            platform: name,
            connected: !!found?.connected,
            username: found?.username || found?.platform_user_id || null,
          };
        });

        setPlatforms(merged);
        setPosts(postsRes.data);
      } catch (err) {
        console.error("❌ Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const connected = platforms.filter((p) => p.connected).length;
  const allSchedules = posts.flatMap((p: any) => p.post_schedules || []);
  const pending = allSchedules.filter((s: any) => s.status === "pending").length;
  const posted  = allSchedules.filter((s: any) => s.status === "posted").length;
  const failed  = allSchedules.filter((s: any) => s.status === "failed").length;

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">
              Good{" "}
              {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
              , {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here's what's happening with your posts
            </p>
          </div>
          <Link to="/compose">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusSquare className="w-4 h-4" /> New Post
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Connected", value: connected, icon: Link2,        color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Scheduled", value: pending,   icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50"  },
            { label: "Posted",    value: posted,    icon: CheckCircle2, color: "text-emerald-600",bg: "bg-emerald-50"},
            { label: "Failed",    value: failed,    icon: XCircle,      color: "text-red-500",    bg: "bg-red-50"    },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-border rounded-xl p-5">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <p className="text-2xl font-display font-bold">{loading ? "—" : value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Platform status */}
          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base">Connected platforms</h2>
              <Link to="/accounts" className="text-xs text-indigo-600 hover:underline">Manage</Link>
            </div>
            <div className="space-y-3">
              {loading
                ? ALL_PLATFORMS.map((name) => (
                    <div key={name} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                        <div className="h-2.5 w-28 bg-slate-100 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-slate-100 rounded-full" />
                    </div>
                  ))
                : platforms.map((p) => (
                    <div key={p.platform} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                        <img
                          src={PLATFORM_LOGOS[p.platform]}
                          alt={`${p.platform} logo`}
                          style={{ width: 18, height: 18 }}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{p.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.connected ? `@${p.username || "Connected"}` : "Not connected"}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        p.connected ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                      )}>
                        {p.connected ? "Connected" : "—"}
                      </span>
                    </div>
                  ))}
            </div>
          </div>

          {/* Recent posts */}
          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base">Recent posts</h2>
              <Link to="/scheduled" className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {posts.slice(0, 4).map((post: any) => (
                <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.original_content}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(post.post_schedules || []).map((s: any) => (
                        <span
                          key={s.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-medium",
                            s.status === "posted"  ? "bg-emerald-100 text-emerald-700" :
                            s.status === "failed"  ? "bg-red-100 text-red-600" :
                            "bg-amber-100 text-amber-700"
                          )}
                        >
                          {s.platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && !loading && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                  <Link to="/compose">
                    <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                      <PlusSquare className="w-3.5 h-3.5" /> Create your first post
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}