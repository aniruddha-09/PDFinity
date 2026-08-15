"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { JobResponse, getDownloadUrl } from "@/lib/api";

interface JobStatusCardProps {
  job: JobResponse | null;
  isLoading: boolean;
  onReset: () => void;
  summaryResult?: {
    summary: string;
    page_count?: number;
    word_count?: number;
  } | null;
}

export default function JobStatusCard({
  job,
  isLoading,
  onReset,
  summaryResult,
}: JobStatusCardProps) {
  if (!job && !isLoading) return null;

  const isCompleted = job?.status === "completed";
  const isFailed = job?.status === "failed";
  const isProcessing = job?.status === "processing" || job?.status === "queued" || isLoading;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="w-full rounded-2xl bg-[#141414] border border-[#2a2a2a] p-6 sm:p-8 shadow-card space-y-6 rivets">
      {/* Header status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {isProcessing && (
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-accent shadow-recessed">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {isCompleted && (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          {isFailed && (
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}

          <div>
            <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-white">
              {isProcessing && "Executing Pipeline..."}
              {isCompleted && "Task Completed"}
              {isFailed && "Execution Failed"}
            </h4>
            <p className="text-xs text-neutral-400 font-normal">
              {isProcessing && "Asynchronous worker processing your file transformation."}
              {isCompleted && "Transformation finished. File ready for download."}
              {isFailed && (job?.error_message || "An unexpected processing error occurred.")}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isProcessing && (
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-[#1c1c1c] text-accent border border-[#333]">
              {job?.progress || 10}%
            </span>
          )}
          {isCompleted && (
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              100% READY
            </span>
          )}
          {isFailed && (
            <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              FAILED
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-[#0d0d0d] h-3 rounded-full overflow-hidden p-0.5 border border-[#222] shadow-recessed">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300 ease-out shadow-glow-yellow"
              style={{ width: `${Math.max(job?.progress || 10, 10)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span>CELERY TASK ID: {job?.id ? job.id.slice(0, 8) : "INITIALIZING"}</span>
            <span className="text-accent font-bold">{job?.progress || 10}%</span>
          </div>
        </div>
      )}

      {/* AI Summary result if available */}
      {summaryResult && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Document Summary</span>
            </div>
            {summaryResult.page_count && (
              <span className="text-[11px] font-mono text-neutral-400">
                {summaryResult.page_count} pages • ~{summaryResult.word_count} words
              </span>
            )}
          </div>
          <div className="p-5 rounded-xl bg-[#0d0d0d] border border-[#262626] text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto font-mono text-xs shadow-recessed">
            {summaryResult.summary}
          </div>
        </div>
      )}

      {/* Compression stats if available */}
      {isCompleted && job?.options?.stats && (
        <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#262626] shadow-recessed space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
              Compression Metrics
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                (job.options.stats.reduction_percent || 0) > 0
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-[#1f1f1f] text-neutral-300 border-[#333]"
              }`}
            >
              {(job.options.stats.reduction_percent || 0) > 0
                ? `-${job.options.stats.reduction_percent}% REDUCED`
                : "OPTIMALLY COMPACT"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222]">
              <span className="text-[10px] text-neutral-500 uppercase block">Original</span>
              <span className="text-xs font-bold text-neutral-300">
                {formatFileSize(job.options.stats.original_size)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222]">
              <span className="text-[10px] text-neutral-500 uppercase block">Compressed</span>
              <span className="text-xs font-bold text-emerald-400">
                {formatFileSize(job.options.stats.compressed_size)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222]">
              <span className="text-[10px] text-neutral-500 uppercase block">Saved</span>
              <span className="text-xs font-bold text-accent">
                {(job.options.stats.reduction_percent || 0) > 0
                  ? `${job.options.stats.reduction_percent}%`
                  : "0%"}
              </span>
            </div>
          </div>

          {(job.options.stats.reduction_percent || 0) === 0 && (
            <p className="text-[11px] text-neutral-400 font-mono text-center pt-1">
              ✨ This document has no uncompressed images or redundant streams and is already at maximum compact efficiency.
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {isCompleted && job?.output_file_id && (
          <a
            href={getDownloadUrl(job.output_file_id)}
            download
            className="w-full sm:flex-1 btn-accent text-xs py-3.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Processed File</span>
          </a>
        )}

        <button
          type="button"
          onClick={onReset}
          className={`w-full ${
            isCompleted && job?.output_file_id ? "sm:w-auto" : "sm:flex-1"
          } btn-secondary text-xs py-3.5`}
        >
          <RotateCcw className="w-4 h-4 text-neutral-400" />
          <span>New Operation</span>
        </button>
      </div>
    </div>
  );
}
