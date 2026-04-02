import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { getPosts, deletePost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PlusSquare, Clock, CheckCircle2, XCircle,
  Trash2, Loader2, CalendarDays,
} from "lucide-react";

const PLATFORM_LOGOS: Record<string, string> = {
  facebook:  "/facebook-logo.png",
  instagram: "/instagram-logo.png",
  twitter:   "/twitter-logo.png",
  linkedin:  "/linkedIn-logo.png",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  posted:  "bg-emerald-50 text-emerald-700",
  failed:  "bg-red-50 text-red-600",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  posted:  <CheckCircle2 className="w-3 h-3" />,
  failed:  <XCircle className="w-3 h-3" />,
};

type FilterType = "all" | "pending" | "posted" | "failed";

export default function ScheduledPage() {
  const location = useLocation();
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [deleting, setDeleting] = React.useState<number | null>(null);
  const [successMsg, setSuccessMsg] = React.useState("");

  const load = async () => {
    try {
      const res = await getPosts();
      setPosts(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  React.useEffect(() => {
    load();
    const params = new URLSearchParams(location.search);
    if (params.get("success")) {
      setSuccessMsg("Post scheduled successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      window.history.replaceState({}, "", "/scheduled");
    }
  }, []);

  const handleDelete = async (postId: number) => {
    setDeleting(postId);
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (_) {}
    finally { setDeleting(null); }
  };

  const filtered = posts.filter(post => {
    if (filter === "all") return true;
    return (post.post_schedules || []).some((s: any) => s.status === filter);
  });

  const counts = {
    all:     posts.length,
    pending: posts.filter(p => (p.post_schedules || []).some((s: any) => s.status === "pending")).length,
    posted:  posts.filter(p => (p.post_schedules || []).some((s: any) => s.status === "posted")).length,
    failed:  posts.filter(p => (p.post_schedules || []).some((s: any) => s.status === "failed")).length,
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Scheduled posts</h1>
            <p className="text-muted-foreground text-sm mt-1">Track all your posts across platforms</p>
          </div>
          <Link to="/compose">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusSquare className="w-4 h-4" /> New Post
            </Button>
          </Link>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "posted", "failed"] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                filter === f ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-muted-foreground border-border hover:border-indigo-300"
              )}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={cn(
                "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                filter === f ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-border rounded-xl">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">No posts found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "all" ? "Create your first post to get started" : `No ${filter} posts`}
            </p>
            {filter === "all" && (
              <Link to="/compose">
                <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  <PlusSquare className="w-3.5 h-3.5" /> Create post
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post: any) => {
              const hasPending = (post.post_schedules || []).some((s: any) => s.status === "pending");
              return (
                <div key={post.id} className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-relaxed flex-1">{post.original_content}</p>
                      {hasPending && (
                        <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                          className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                          {deleting === post.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  <div className="divide-y divide-border">
                    {(post.post_schedules || []).map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                        {/* ✅ PNG logo instead of colored letter box */}
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <img
                            src={PLATFORM_LOGOS[s.platform] || "/favicon.ico"}
                            alt={s.platform}
                            style={{ width: 14, height: 14 }}
                            className="object-contain"
                          />
                        </div>
                        <span className="text-sm capitalize font-medium w-20">{s.platform}</span>
                        <span className="text-xs text-muted-foreground flex-1">
                          {new Date(s.scheduled_at).toLocaleString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        <span className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium",
                          STATUS_STYLES[s.status] || "bg-gray-100 text-gray-500"
                        )}>
                          {STATUS_ICONS[s.status]}
                          {s.status}
                        </span>
                        {s.error && (
                          <span className="text-xs text-red-500 truncate max-w-32" title={s.error}>
                            {s.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}