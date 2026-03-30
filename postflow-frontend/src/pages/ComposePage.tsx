import * as React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transformPost, schedulePost, getPlatformStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Wand2, Loader2, Send, ChevronRight,
  CheckCircle2, AlertCircle, RefreshCw,
  Upload, X, ImageIcon, Film, Music, Info,
} from "lucide-react";

// ── Platform definitions ──────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "facebook",  name: "Facebook",    logo: "/facebook-logo.png" },
  { id: "instagram", name: "Instagram",   logo: "/instagram-logo.png" },
  { id: "twitter",   name: "Twitter / X", logo: "/twitter-logo.png" },
];

// Per-platform media rules
const PLATFORM_MEDIA_RULES: Record<string, {
  accept: string[];
  maxSizeMB: Record<string, number>;
  videoMaxSec?: number;
  videoMinSec?: number;
  notes: string[];
  unsupported: string[];
}> = {
  facebook: {
    accept: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxSizeMB: { image: 4, video: 10240, gif: 4 },
    videoMaxSec: 14400,
    notes: ["Photos: JPG/PNG up to 4 MB", "Videos: MP4 up to 10 GB, max 240 min", "GIF supported"],
    unsupported: ["Audio (MP3/WAV)"],
  },
  instagram: {
    accept: ["image/jpeg", "image/png", "video/mp4"],
    maxSizeMB: { image: 8, video: 1024 },
    videoMaxSec: 90,
    videoMinSec: 15,
    notes: ["Photos: JPG/PNG up to 8 MB", "Reels (MP4): 15 sec – 90 sec, up to 1 GB"],
    unsupported: ["Audio (MP3/WAV)", "GIF"],
  },
  twitter: {
    accept: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxSizeMB: { image: 5, gif: 15, video: 512 },
    videoMaxSec: 140,
    notes: ["Photos: JPG/PNG up to 5 MB", "GIF up to 15 MB", "Videos: MP4 up to 512 MB, max 140 sec"],
    unsupported: ["Audio (MP3/WAV)"],
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface MediaFile {
  file: File;
  previewUrl: string;
  type: "image" | "video" | "audio" | "gif";
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMediaType(file: File): "image" | "video" | "audio" | "gif" {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "audio";
}

function validateMedia(file: File, platformId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const rules = PLATFORM_MEDIA_RULES[platformId];
    const mediaType = getMediaType(file);

    if (!rules.accept.includes(file.type)) {
      resolve(`${file.type.split("/")[1].toUpperCase()} is not supported on ${PLATFORMS.find(p => p.id === platformId)?.name}`);
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    const limitKey = mediaType === "gif" ? "gif" : mediaType === "video" ? "video" : "image";
    const maxMB = rules.maxSizeMB[limitKey];
    if (maxMB && sizeMB > maxMB) {
      resolve(`File too large: ${sizeMB.toFixed(1)} MB (max ${maxMB >= 1024 ? (maxMB / 1024).toFixed(0) + " GB" : maxMB + " MB"})`);
      return;
    }

    if (mediaType === "video" && (rules.videoMaxSec || rules.videoMinSec)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const dur = video.duration;
        if (rules.videoMaxSec && dur > rules.videoMaxSec) {
          resolve(`Video too long: ${Math.round(dur)}s (max ${rules.videoMaxSec}s)`);
        } else if (rules.videoMinSec && dur < rules.videoMinSec) {
          resolve(`Video too short: ${Math.round(dur)}s (min ${rules.videoMinSec}s)`);
        } else {
          resolve(null);
        }
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    } else {
      resolve(null);
    }
  });
}

// ── Media preview ─────────────────────────────────────────────────────────────
function MediaPreview({ media, onRemove }: { media: MediaFile; onRemove: () => void }) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
      {(media.type === "image" || media.type === "gif") ? (
        <img src={media.previewUrl} alt="preview" className="w-full h-40 object-cover" />
      ) : media.type === "video" ? (
        <video src={media.previewUrl} className="w-full h-40 object-cover" muted playsInline />
      ) : (
        <div className="w-full h-16 flex items-center gap-3 px-4">
          <Music className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm text-slate-600 truncate">{media.file.name}</span>
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded font-medium uppercase">
        {media.type}
      </span>

      {media.error && (
        <div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-[10px] px-2 py-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" /> {media.error}
        </div>
      )}
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────
function MediaDropZone({
  platformId, media, onAdd, onRemove,
}: {
  platformId: string;
  media: MediaFile | null;
  onAdd: (file: File, error: string | null) => void;
  onRemove: () => void;
}) {
  const rules = PLATFORM_MEDIA_RULES[platformId];
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFile = async (file: File) => {
    const error = await validateMedia(file, platformId);
    onAdd(file, error);
  };

  return (
    <div className="mt-2 space-y-2">
      {media ? (
        <MediaPreview media={media} onRemove={onRemove} />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg px-4 py-4 flex flex-col items-center gap-1.5 cursor-pointer transition-colors",
            dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80"
          )}
        >
          <Upload className="w-4 h-4 text-slate-400" />
          <p className="text-xs text-slate-500 text-center">
            Drop media or <span className="text-indigo-600 font-medium">browse</span>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={rules.accept.join(",")}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>
      )}

      <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 space-y-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Info className="w-3 h-3" /> Platform limits
        </p>
        {rules.notes.map(note => (
          <p key={note} className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> {note}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ComposePage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  const [content, setContent] = React.useState("");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([]);
  const [versions, setVersions] = React.useState<Record<string, string>>({});
  const [transforming, setTransforming] = React.useState(false);
  const [transformError, setTransformError] = React.useState("");
  const [platformMedia, setPlatformMedia] = React.useState<Record<string, MediaFile | null>>({});
  const [scheduleTimes, setScheduleTimes] = React.useState<Record<string, string>>({});
  const [scheduling, setScheduling] = React.useState(false);
  const [scheduleError, setScheduleError] = React.useState("");
  const [connectedPlatforms, setConnectedPlatforms] = React.useState<string[]>([]);

  // Initialize connected platforms and select them by default
  React.useEffect(() => {
    getPlatformStatus().then(res => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const connected = list.filter((p: any) => p.connected).map((p: any) => p.platform);
      setConnectedPlatforms(connected);
      setSelectedPlatforms(connected); // Only auto-select what is connected
    }).catch(() => {});
  }, []);

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleTransform = async () => {
    if (!content.trim()) return;
    // Only proceed if at least one selected platform is actually connected
    const validPlatforms = selectedPlatforms.filter(p => connectedPlatforms.includes(p));
    if (validPlatforms.length === 0) {
      setTransformError("Please select at least one connected account.");
      return;
    }

    setTransforming(true); setTransformError("");
    try {
      const res = await transformPost(content, validPlatforms);
      setVersions(res.data.versions);
      setStep(2);
    } catch (err: any) {
      setTransformError(err.response?.data?.error || "AI transformation failed");
    } finally { setTransforming(false); }
  };

  const handleRetransform = async () => {
    setTransforming(true); setTransformError("");
    try {
      const res = await transformPost(content, selectedPlatforms);
      setVersions(res.data.versions);
    } catch { setTransformError("Retry failed"); }
    finally { setTransforming(false); }
  };

  const handleAddMedia = async (platformId: string, file: File, error: string | null) => {
    const previewUrl = URL.createObjectURL(file);
    setPlatformMedia(prev => ({
      ...prev,
      [platformId]: { file, previewUrl, type: getMediaType(file), error: error || undefined },
    }));
  };

  const handleRemoveMedia = (platformId: string) => {
    setPlatformMedia(prev => {
      const m = prev[platformId];
      if (m) URL.revokeObjectURL(m.previewUrl);
      return { ...prev, [platformId]: null };
    });
  };

  const hasMediaErrors = selectedPlatforms.some(id => platformMedia[id]?.error);

  const handleSchedule = async () => {
    if (hasMediaErrors) { setScheduleError("Fix media errors before scheduling"); return; }
    const schedules = selectedPlatforms.filter(p => scheduleTimes[p]).map(p => ({ platform: p, scheduled_at: scheduleTimes[p] }));
    if (schedules.length === 0) { setScheduleError("Set at least one schedule time"); return; }

    setScheduling(true); setScheduleError("");
    try {
      const formData = new FormData();
      formData.append("original_content", content);
      formData.append("platform_versions", JSON.stringify(versions));
      formData.append("schedules", JSON.stringify(schedules));
      selectedPlatforms.forEach(id => {
        const m = platformMedia[id];
        if (m) formData.append(`media_${id}`, m.file);
      });
      await schedulePost(formData as any);
      navigate("/scheduled?success=1");
    } catch (err: any) {
      setScheduleError(err.response?.data?.error || "Scheduling failed");
    } finally { setScheduling(false); }
  };

  const minDateTime = new Date(Date.now() + 2 * 60000).toISOString().slice(0, 16);
  const STEPS = ["Write", "Preview & Media", "Schedule"];

  return (
    <Layout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold">Create post</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect your accounts to enable AI content generation</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 px-4 sm:px-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  step > i + 1 ? "bg-indigo-600 text-white" :
                  step === i + 1 ? "bg-indigo-600 text-white ring-4 ring-indigo-100" :
                  "bg-gray-100 text-muted-foreground"
                )}>
                  {step > i + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn("text-sm hidden sm:block", step === i + 1 ? "font-medium" : "text-muted-foreground")}>{s}</span>
              </div>
              {i < 2 && <div className={cn("flex-1 h-px", step > i + 1 ? "bg-indigo-400" : "bg-border")} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-medium">Original content</Label>
              <textarea
                id="content" rows={5} value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's on your mind? AI will rewrite this for your connected accounts."
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 resize-none transition-all outline-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Target Platforms</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLATFORMS.map(p => {
                  const isConnected = connectedPlatforms.includes(p.id);
                  const isSelected = selectedPlatforms.includes(p.id);
                  return (
                    <button 
                      key={p.id} 
                      disabled={!isConnected}
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all group",
                        !isConnected ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed" : 
                        isSelected ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200"
                      )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-white border shrink-0",
                        isSelected ? "border-indigo-200" : "border-slate-100"
                      )}>
                        <img src={p.logo} alt={p.name} className={cn("w-5 h-5 object-contain", !isConnected && "grayscale opacity-50")} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="truncate">{p.name}</p>
                        {!isConnected && <p className="text-[10px] text-red-400">Disconnected</p>}
                      </div>
                      {isConnected && isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {transformError && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" /> {transformError}
              </div>
            )}

            <Button 
              onClick={handleTransform} 
              disabled={!content.trim() || selectedPlatforms.length === 0 || transforming}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-md shadow-indigo-100"
            >
              {transforming ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Drafting variations...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate Platform Content <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        )}

        {/* ── STEP 2: Preview & Media ── */}
        {step === 2 && (
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Post Previews</h2>
              <Button variant="ghost" size="sm" onClick={handleRetransform} disabled={transforming} className="h-8 text-indigo-600 hover:bg-indigo-50">
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", transforming && "animate-spin")} />
                Refresh AI
              </Button>
            </div>

            {selectedPlatforms.map(platformId => {
              const p = PLATFORMS.find(x => x.id === platformId)!;
              const media = platformMedia[platformId] ?? null;
              return (
                <div key={platformId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                    <img src={p.logo} alt={p.name} className="w-5 h-5 object-contain" />
                    <span className="font-bold text-sm text-slate-700">{p.name}</span>
                    {platformId === "twitter" && (
                      <span className={cn("ml-auto text-xs font-mono", (versions[platformId]?.length || 0) > 280 ? "text-red-500 font-bold" : "text-slate-400")}>
                        {versions[platformId]?.length || 0}/280
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    <textarea 
                      rows={3} 
                      value={versions[platformId] || ""}
                      onChange={e => setVersions(v => ({ ...v, [platformId]: e.target.value }))}
                      className="w-full text-sm leading-relaxed focus:outline-none bg-transparent resize-none border-none p-0" 
                    />
                    
                    <div className="pt-4 border-t border-slate-50">
                      <MediaDropZone
                        platformId={platformId}
                        media={media}
                        onAdd={(file, error) => handleAddMedia(platformId, file, error)}
                        onRemove={() => handleRemoveMedia(platformId)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">Back</Button>
              <Button onClick={() => setStep(3)} disabled={hasMediaErrors} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-11 gap-2 shadow-sm">
                Next: Set Schedule <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Schedule ── */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="font-bold text-slate-800">Final Schedule</h2>
              <p className="text-xs text-slate-400">Specify when each account should publish its version</p>
            </div>

            <div className="space-y-4">
              {selectedPlatforms.map(platformId => {
                const p = PLATFORMS.find(x => x.id === platformId)!;
                const media = platformMedia[platformId];
                return (
                  <div key={platformId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <img src={p.logo} alt={p.name} className="w-4 h-4" />
                      <Label className="text-sm font-bold text-slate-700">{p.name}</Label>
                      {media && (
                        <span className="ml-auto text-[10px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {media.type === 'video' ? <Film className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                          Media Ready
                        </span>
                      )}
                    </div>
                    <Input 
                      type="datetime-local" 
                      min={minDateTime}
                      value={scheduleTimes[platformId] || ""}
                      onChange={e => setScheduleTimes(t => ({ ...t, [platformId]: e.target.value }))}
                      className="bg-white"
                    />
                  </div>
                );
              })}
            </div>

            {scheduleError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" /> {scheduleError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">Back</Button>
              <Button 
                onClick={handleSchedule} 
                disabled={scheduling} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 gap-2 shadow-md"
              >
                {scheduling ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</>
                ) : (
                  <><Send className="w-4 h-4" /> Publish Schedules</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}