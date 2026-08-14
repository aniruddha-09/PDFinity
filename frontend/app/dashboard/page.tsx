"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Download,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { listJobs, getMe, getDownloadUrl, JobResponse, User } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        return listJobs();
      })
      .then((jobList) => {
        setJobs(jobList);
      })
      .catch((err) => {
        setError(err.message || "Please sign in to view your dashboard.");
        setTimeout(() => router.push("/auth/login"), 1500);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Task Dashboard
            </h1>
          </div>
          <p className="text-xs font-mono text-neutral-400">
            AUTHENTICATED SESSION: <span className="text-white font-bold">{user?.email || "USER"}</span>
          </p>
        </div>

        <Link
          href="/"
          className="btn-accent text-xs py-2.5 px-4 self-start sm:self-auto"
        >
          <span>New Operation</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center space-y-3 shadow-card">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs font-mono text-neutral-400">LOADING TASK RECORDS...</p>
        </div>
      ) : error ? (
        <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-4 shadow-card rivets">
          <div className="w-14 h-14 rounded-2xl bg-[#0e0e0e] border border-[#222] flex items-center justify-center mx-auto text-neutral-400 shadow-recessed">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">No Processing Tasks Yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto font-normal">
              Your processed files and AI summaries will appear here once you initiate any tool operations.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 btn-accent text-xs py-2.5 px-5"
          >
            Launch Tools
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden shadow-card rivets">
          <div className="p-5 border-b border-[#222] flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              Task History ({jobs.length})
            </h3>
            <span className="text-[10px] font-mono text-neutral-500 bg-[#0e0e0e] px-2.5 py-1 rounded border border-[#222]">
              RETENTION: 24 HOURS
            </span>
          </div>

          <div className="divide-y divide-[#1f1f1f]">
            {jobs.map((j) => {
              const isCompleted = j.status === "completed";
              const isFailed = j.status === "failed";
              const isProcessing = j.status === "processing" || j.status === "queued";

              return (
                <div
                  key={j.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181818] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0d0d0d] border border-[#222] flex items-center justify-center flex-shrink-0 text-accent shadow-recessed">
                      {j.operation === "summarize" ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-white">
                          {j.operation.replace(/_/g, " ")}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            COMPLETED
                          </span>
                        )}
                        {isProcessing && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1f1f1f] text-accent border border-[#333]">
                            {j.progress || 10}%
                          </span>
                        )}
                        {isFailed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            FAILED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{formatTimestamp(j.created_at)}</span>
                        <span>•</span>
                        <span className="text-neutral-500">
                          ID: {j.id.slice(0, 8)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {isCompleted && j.output_file_id && (
                      <a
                        href={getDownloadUrl(j.output_file_id)}
                        download
                        className="btn-accent text-xs py-2 px-4 shadow-card"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
